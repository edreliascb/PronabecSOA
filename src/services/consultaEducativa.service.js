const convocatoriaService = require("./convocatoria.service");
const postulacionService = require("./postulacion.service");
const documentoService = require("./documentoRequisito.service");
const convenioService = require("./convenio.service");
const institucionService = require("./institucion.service");
const regionService = require("./region.service");

const TIMEOUT_PASO_MS = 15000;

function obtenerEstadoServicio(resultado) {
    if (!resultado) return "ERROR";
    if (
        resultado.disponible === false ||
        resultado.modo === "NO_DISPONIBLE" ||
        resultado.estado === "NO_DISPONIBLE"
    ) return "NO_DISPONIBLE";
    return "OPERATIVO";
}

function obtenerFuente(resultado) {
    return (
        resultado?.fuente ||
        resultado?.fuentePrincipal ||
        resultado?.modo ||
        resultado?.servicio ||
        "Interna"
    );
}

function obtenerTotal(resultado) {
    const candidatos = [
        resultado?.total,
        resultado?.resultado?.total,
        resultado?.paginacion?.total,
        resultado?.resultado?.paginacion?.total
    ];
    for (const candidato of candidatos) {
        const numero = Number(candidato);
        if (Number.isFinite(numero)) return numero;
    }
    return null;
}

function conTimeout(promesa, ms, nombre) {
    let temporizador;
    const timeout = new Promise((_, reject) => {
        temporizador = setTimeout(() => {
            const error = new Error(`${nombre} excedió el tiempo máximo de ${ms} ms.`);
            error.code = "ORQUESTACION_TIMEOUT";
            reject(error);
        }, ms);
    });
    return Promise.race([promesa, timeout])
        .finally(() => clearTimeout(temporizador));
}

async function ejecutarPaso(nombre, grupo, funcion) {
    const inicio = Date.now();
    try {
        const resultado = await conTimeout(
            Promise.resolve().then(funcion),
            TIMEOUT_PASO_MS,
            nombre
        );
        const estado = obtenerEstadoServicio(resultado);
        return {
            servicio: nombre,
            grupo,
            estado,
            duracionMs: Date.now() - inicio,
            fuente: obtenerFuente(resultado),
            total: obtenerTotal(resultado),
            motivo: estado === "NO_DISPONIBLE"
                ? resultado?.motivo || "La fuente requerida no está disponible."
                : null
        };
    } catch (error) {
        return {
            servicio: nombre,
            grupo,
            estado: error.code === "ORQUESTACION_TIMEOUT" ? "NO_DISPONIBLE" : "ERROR",
            duracionMs: Date.now() - inicio,
            fuente: "No determinada",
            total: null,
            motivo: error.message
        };
    }
}

async function realizarConsultaCompleta() {
    try {
        const [convocatorias, postulaciones, documentos, convenios] = await Promise.all([
            convocatoriaService.listarConvocatorias(1, 10),
            postulacionService.listarPostulaciones(1, 10),
            documentoService.listarDocumentos(1, 10),
            convenioService.listarConvenios(1, 10)
        ]);

        return {
            servicio: "ConsultaEducativaService",
            tipo: "Servicio Orquestador",
            descripcion: "Integra servicios educativos y reporta disponibilidad real de cada fuente.",
            estadoServicios: {
                convocatorias: obtenerEstadoServicio(convocatorias),
                postulaciones: obtenerEstadoServicio(postulaciones),
                documentos: obtenerEstadoServicio(documentos),
                convenios: obtenerEstadoServicio(convenios),
                plataforma: "OPERATIVA"
            },
            convocatorias,
            postulaciones,
            documentos,
            convenios
        };
    } catch (error) {
        console.error("ERROR DEL ORQUESTADOR:", error.message);
        throw new Error("No se pudo completar la consulta educativa.");
    }
}

async function ejecutarOrquestacionDemostrable() {
    const inicioTotal = Date.now();

    // Fase 1: servicios independientes en paralelo.
    const faseDominio = await Promise.all([
        ejecutarPaso(
            "ConvocatoriaService",
            "DOMINIO",
            () => convocatoriaService.listarConvocatorias(1, 10)
        ),
        ejecutarPaso(
            "PostulacionService",
            "DOMINIO",
            () => postulacionService.listarPostulaciones(1, 10)
        ),
        ejecutarPaso(
            "DocumentoRequisitoService",
            "DOMINIO",
            () => documentoService.listarDocumentos(1, 10)
        ),
        ejecutarPaso(
            "ConvenioService",
            "DOMINIO",
            () => convenioService.listarConvenios(1, 10)
        ),
        ejecutarPaso(
            "RegionService",
            "CATALOGO",
            () => regionService.listarRegiones()
        )
    ]);

    // Fase 2: composición. InstitucionService deriva su catálogo desde ConvenioService.
    const faseComposicion = await Promise.all([
        ejecutarPaso(
            "InstitucionService",
            "COMPOSICION",
            () => institucionService.listarInstituciones()
        )
    ]);

    const pasos = [...faseDominio, ...faseComposicion];
    const operativos = pasos.filter(p => p.estado === "OPERATIVO").length;
    const noDisponibles = pasos.filter(p => p.estado === "NO_DISPONIBLE").length;
    const errores = pasos.filter(p => p.estado === "ERROR").length;

    let estado = "COMPLETADA";
    if (errores > 0) estado = "PARCIAL";
    else if (noDisponibles > 0) estado = "COMPLETADA_CON_ADVERTENCIAS";

    return {
        servicio: "ConsultaEducativaService",
        tipo: "Servicio Orquestador",
        operacion: "OrquestacionDemostrable",
        descripcion: "Coordina servicios atómicos con ejecución paralela, composición y timeout individual para evitar bloqueos por fuentes externas.",
        estado,
        fechaEjecucion: new Date().toISOString(),
        timeoutPorServicioMs: TIMEOUT_PASO_MS,
        duracionTotalMs: Date.now() - inicioTotal,
        flujo: [
            "API/BFF",
            "ConsultaEducativaService",
            "Servicios de dominio y catálogo",
            "Servicio de composición",
            "Respuesta JSON normalizada"
        ],
        politicaDatos: "Se usan únicamente fuentes oficiales configuradas. Si una fuente no responde dentro del límite, se reporta NO_DISPONIBLE y la orquestación continúa.",
        resumen: {
            totalServicios: pasos.length,
            operativos,
            noDisponibles,
            errores
        },
        fases: {
            dominio: faseDominio.map(p => p.servicio),
            composicion: faseComposicion.map(p => p.servicio)
        },
        servicios: pasos
    };
}

module.exports = {
    realizarConsultaCompleta,
    ejecutarOrquestacionDemostrable
};
