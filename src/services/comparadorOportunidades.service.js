/* =========================================================
   EDUPERÚ SOA
   COMPARADOR DE OPORTUNIDADES

   Compara hasta 3 selecciones del catálogo de carreras y
   las enriquece únicamente con información oficial que
   pueda relacionarse de forma verificable.
========================================================= */

const becaService =
    require("./beca.service");

const beneficioService =
    require("./beneficio.service");

const requisitoService =
    require("./requisitoElegibilidad.service");

const institucionService =
    require("./institucion.service");


const MAX_COMPARACION = 3;
const MIN_COMPARACION = 2;
const TIMEOUT_FUENTE_MS = 10000;


function normalizar(texto) {

    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/\s+/g, " ")
        .trim();

}


function texto(objeto, campos, defecto = "") {

    for (const campo of campos) {

        const valor =
            objeto?.[campo];

        if (
            valor !== undefined &&
            valor !== null &&
            String(valor).trim() !== ""
        ) {
            return String(valor).trim();
        }

    }

    return defecto;

}


function arreglo(valor) {
    return Array.isArray(valor) ? valor : [];
}


function coincide(a, b) {

    const na = normalizar(a);
    const nb = normalizar(b);

    if (!na || !nb) {
        return false;
    }

    return (
        na === nb ||
        na.includes(nb) ||
        nb.includes(na)
    );

}


function conTimeout(promesa, ms, nombre) {

    let temporizador;

    const timeout =
        new Promise((_, reject) => {

            temporizador =
                setTimeout(
                    () => reject(
                        new Error(
                            `${nombre} excedió ${ms} ms.`
                        )
                    ),
                    ms
                );

        });

    return Promise
        .race([promesa, timeout])
        .finally(() => clearTimeout(temporizador));

}


async function cargarSeguro(nombre, fn) {

    const inicio = Date.now();

    try {

        const resultado =
            await conTimeout(
                Promise.resolve().then(fn),
                TIMEOUT_FUENTE_MS,
                nombre
            );

        return {
            nombre,
            ok: true,
            tiempoMs: Date.now() - inicio,
            resultado
        };

    } catch (error) {

        return {
            nombre,
            ok: false,
            tiempoMs: Date.now() - inicio,
            error: error.message,
            resultado: null
        };

    }

}


function validarSelecciones(selecciones) {

    if (!Array.isArray(selecciones)) {
        const error = new Error(
            "Debes enviar una lista de oportunidades para comparar."
        );
        error.statusCode = 400;
        throw error;
    }

    if (
        selecciones.length < MIN_COMPARACION ||
        selecciones.length > MAX_COMPARACION
    ) {
        const error = new Error(
            "Selecciona entre 2 y 3 oportunidades para comparar."
        );
        error.statusCode = 400;
        throw error;
    }

}


function limpiarSeleccion(item, indice) {

    const carrera =
        texto(
            item,
            ["carrera", "nombre", "titulo"],
            `Oportunidad ${indice + 1}`
        );

    return {
        idCliente:
            item?.idCliente ??
            item?.indice ??
            indice,

        carrera,

        institucion:
            texto(
                item,
                ["institucion"],
                "N/D"
            ),

        region:
            texto(
                item,
                ["region", "ubicacion"],
                "N/D"
            ),

        convocatoria:
            texto(
                item,
                ["convocatoria", "beca", "concurso"],
                ""
            ),

        estado:
            texto(
                item,
                ["estado"],
                "No publicado"
            ),

        fuente:
            texto(
                item,
                ["fuente"],
                "CarreraService"
            )
    };

}


function buscarBecaRelacionada(seleccion, becas) {

    const referencia =
        seleccion.convocatoria ||
        seleccion.carrera;

    if (!referencia) {
        return null;
    }

    return becas.find(
        beca =>
            coincide(
                referencia,
                beca?.nombre ||
                beca?.concurso
            )
    ) || null;

}


function buscarBeneficiosRelacionados(
    seleccion,
    beca,
    beneficios
) {

    const referencias = [
        seleccion.convocatoria,
        beca?.nombre,
        beca?.concurso
    ].filter(Boolean);

    if (!referencias.length) {
        return [];
    }

    return beneficios.filter(
        item =>
            referencias.some(
                referencia =>
                    coincide(
                        referencia,
                        item?.convocatoria
                    )
            )
    );

}


function buscarRequisitosRelacionados(
    seleccion,
    beca,
    requisitos
) {

    const referencias = [
        seleccion.convocatoria,
        beca?.nombre,
        beca?.concurso
    ].filter(Boolean);

    if (!referencias.length) {
        return [];
    }

    return requisitos.filter(
        item =>
            referencias.some(
                referencia =>
                    coincide(
                        referencia,
                        item?.convocatoria
                    )
            )
    );

}


function buscarInstitucionRelacionada(
    seleccion,
    instituciones
) {

    if (
        !seleccion.institucion ||
        seleccion.institucion === "N/D"
    ) {
        return null;
    }

    return instituciones.find(
        item =>
            coincide(
                seleccion.institucion,
                item?.nombre
            )
    ) || null;

}


function fechasDeBeca(beca) {

    if (!beca) {
        return [];
    }

    return arreglo(beca.momentos)
        .map(item => ({
            momento:
                texto(item, ["momento"], "Etapa"),
            fechaInicio:
                texto(item, ["fechaInicio"], "N/D"),
            fechaFin:
                texto(item, ["fechaFin"], "N/D")
        }))
        .filter(
            item =>
                item.fechaInicio !== "N/D" ||
                item.fechaFin !== "N/D"
        );

}


function construirComparado(
    seleccion,
    fuentes
) {

    const becas =
        arreglo(
            fuentes.becas?.resultado?.datos
        );

    const beneficios =
        arreglo(
            fuentes.beneficios?.resultado?.datos
        );

    const requisitos =
        arreglo(
            fuentes.requisitos?.resultado?.datos
        );

    const instituciones =
        arreglo(
            fuentes.instituciones?.resultado?.datos
        );

    const beca =
        buscarBecaRelacionada(
            seleccion,
            becas
        );

    const beneficiosRelacionados =
        buscarBeneficiosRelacionados(
            seleccion,
            beca,
            beneficios
        );

    const requisitosRelacionados =
        buscarRequisitosRelacionados(
            seleccion,
            beca,
            requisitos
        );

    const institucionRelacionada =
        buscarInstitucionRelacionada(
            seleccion,
            instituciones
        );

    const fuentesUsadas =
        new Set([
            seleccion.fuente,
            beca ? "BecaService" : null,
            beneficiosRelacionados.length ? "BeneficioService" : null,
            requisitosRelacionados.length ? "RequisitoElegibilidadService" : null,
            institucionRelacionada ? "InstitucionService" : null
        ].filter(Boolean));

    return {
        ...seleccion,

        becaRelacionada:
            beca
                ? {
                    nombre:
                        beca.nombre ||
                        beca.concurso ||
                        "N/D",
                    bases:
                        beca.bases ||
                        "N/D",
                    fechas:
                        fechasDeBeca(beca)
                }
                : null,

        beneficios:
            beneficiosRelacionados.map(
                item => item.nombre
            ),

        requisitos:
            requisitosRelacionados.map(
                item => ({
                    nombre:
                        item.nombre,
                    obligatorio:
                        item.obligatorio ||
                        "N/D"
                })
            ),

        institucionVerificada:
            institucionRelacionada
                ? {
                    nombre:
                        institucionRelacionada.nombre,
                    tipo:
                        institucionRelacionada.tipo ||
                        "N/D",
                    ubicacion:
                        institucionRelacionada.ubicacion ||
                        "N/D"
                }
                : null,

        disponibilidad: {
            fechas:
                Boolean(
                    beca &&
                    fechasDeBeca(beca).length
                ),
            beneficios:
                beneficiosRelacionados.length > 0,
            requisitos:
                requisitosRelacionados.length > 0,
            institucion:
                Boolean(institucionRelacionada)
        },

        fuentes:
            [...fuentesUsadas]
    };

}


async function compararOportunidades(selecciones) {

    validarSelecciones(selecciones);

    const limpias =
        selecciones.map(
            limpiarSeleccion
        );

    const inicio = Date.now();

    const [
        becas,
        beneficios,
        requisitos,
        instituciones
    ] = await Promise.all([

        cargarSeguro(
            "BecaService",
            () => becaService.listarBecas()
        ),

        cargarSeguro(
            "BeneficioService",
            () => beneficioService.listarBeneficios()
        ),

        cargarSeguro(
            "RequisitoElegibilidadService",
            () => requisitoService.listarRequisitos()
        ),

        cargarSeguro(
            "InstitucionService",
            () => institucionService.listarInstituciones()
        )

    ]);

    const fuentes = {
        becas,
        beneficios,
        requisitos,
        instituciones
    };

    const comparacion =
        limpias.map(
            item => construirComparado(
                item,
                fuentes
            )
        );

    const fuentesConError =
        Object.values(fuentes)
            .filter(item => !item.ok);

    return {
        servicio:
            "ComparadorOportunidadesService",

        tipo:
            "Servicio de Composición",

        estado:
            fuentesConError.length
                ? "COMPLETADA_CON_ADVERTENCIAS"
                : "COMPLETADA",

        totalComparadas:
            comparacion.length,

        tiempoMs:
            Date.now() - inicio,

        comparacion,

        diagnosticoFuentes:
            Object.values(fuentes).map(
                item => ({
                    servicio:
                        item.nombre,
                    ok:
                        item.ok,
                    tiempoMs:
                        item.tiempoMs,
                    error:
                        item.error ||
                        null,
                    total:
                        item.resultado?.total ??
                        item.resultado?.datos?.length ??
                        null
                })
            ),

        advertencia:
            "El comparador muestra únicamente información oficial que pudo relacionarse de forma verificable. N/D significa que la fuente consultada no publicó ese dato o no permitió asociarlo con la selección; no significa que el beneficio o requisito no exista."
    };

}


module.exports = {
    compararOportunidades
};
