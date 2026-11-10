/* =========================================================
   EDUPERÚ SOA
   HEALTH CHECK SERVICE
   40 SERVICIOS EMPRESARIALES
========================================================= */


const convocatoriaService =
    require(
        "./convocatoria.service"
    );


const postulacionService =
    require(
        "./postulacion.service"
    );


const documentoService =
    require(
        "./documentoRequisito.service"
    );


const convenioService =
    require(
        "./convenio.service"
    );


const institucionService =
    require(
        "./institucion.service"
    );


const regionService =
    require(
        "./region.service"
    );


const ubigeoService =
    require(
        "./ubigeo.service"
    );


const contratosService =
    require(
        "./contratos.service"
    );


/* =========================================================
   MEDIR SERVICIO
========================================================= */

async function medirServicio({

    nombre,

    tipo,

    endpoint,

    modoLocal = false,

    ejecutar

}) {

    const inicio =
        Date.now();


    try {

        const respuesta =
            await ejecutar();


        const latenciaMs =
            Date.now() -
            inicio;


        let modo =
            modoLocal
                ? "LOCAL"
                : detectarModo(
                    respuesta
                );


        if (
            modo ===
            "DESCONOCIDO"
        ) {

            modo =
                "OPERATIVO";

        }


        const disponible =
            modo !==
            "NO_DISPONIBLE";


        return {

            nombre,

            tipo,

            endpoint,

            estado:
                disponible
                    ? "OPERATIVO"
                    : "NO_DISPONIBLE",

            modo,

            latenciaMs,

            disponible,

            detalle:
                obtenerDetalle(
                    respuesta,
                    modo
                )

        };

    } catch (error) {

        return {

            nombre,

            tipo,

            endpoint,

            estado:
                "ERROR",

            modo:
                "ERROR",

            latenciaMs:
                Date.now() -
                inicio,

            disponible:
                false,

            detalle:
                error.message ||
                "Error desconocido"

        };

    }

}


/* =========================================================
   DETECTAR MODO / FUENTE
========================================================= */

function detectarModo(
    respuesta
) {

    const valores =
        [];


    buscarValoresFuente(
        respuesta,
        valores,
        0
    );


    const normalizados =
        valores.map(
            valor =>
                normalizar(
                    valor
                )
        );


    if (
        normalizados.some(
            valor =>
                valor.includes(
                    "no disponible"
                ) ||
                valor.includes(
                    "no_disponible"
                )
        )
    ) {

        return "NO_DISPONIBLE";

    }


    if (
        normalizados.some(
            valor =>
                valor.includes(
                    "portal nacional"
                ) ||
                valor.includes(
                    "portal_nacional"
                ) ||
                valor.includes(
                    "plataforma nacional"
                ) ||
                valor.includes(
                    "datosabiertos.gob.pe"
                )
        )
    ) {

        return "PORTAL_NACIONAL";

    }


    if (
        normalizados.some(
            valor =>
                valor.includes(
                    "portal pronabec"
                ) ||
                valor.includes(
                    "portal_pronabec"
                ) ||
                valor.includes(
                    "datosabiertos.pronabec"
                )
        )
    ) {

        return "PORTAL_PRONABEC";

    }


    if (
        normalizados.some(
            valor =>
                valor ===
                    "api" ||
                valor.includes(
                    "api pronabec"
                ) ||
                valor.includes(
                    "api_pronabec"
                )
        )
    ) {

        return "API_PRONABEC";

    }


    if (
        normalizados.some(
            valor =>
                valor.includes(
                    "local"
                )
        )
    ) {

        return "LOCAL";

    }


    return "DESCONOCIDO";

}


/* =========================================================
   BUSCAR CAMPOS RELACIONADOS CON FUENTE / MODO
========================================================= */

function buscarValoresFuente(
    objeto,
    resultados,
    profundidad
) {

    if (
        profundidad > 6 ||
        objeto === null ||
        objeto === undefined
    ) {

        return;

    }


    if (
        typeof objeto !==
        "object"
    ) {

        return;

    }


    if (
        Array.isArray(
            objeto
        )
    ) {

        objeto
            .slice(
                0,
                20
            )
            .forEach(
                item => {

                    buscarValoresFuente(
                        item,
                        resultados,
                        profundidad + 1
                    );

                }
            );


        return;

    }


    const clavesFuente = [

        "modo",

        "fuente",

        "origen",

        "source",

        "estadofuente",

        "fuenteactual",

        "fuenteexterna"

    ];


    for (
        const [
            clave,
            valor
        ]
        of Object.entries(
            objeto
        )
    ) {

        const claveNormalizada =
            normalizar(
                clave
            )
                .replace(
                    /\s+/g,
                    ""
                );


        if (
            clavesFuente.includes(
                claveNormalizada
            ) &&
            (
                typeof valor ===
                    "string" ||
                typeof valor ===
                    "number"
            )
        ) {

            resultados.push(
                String(
                    valor
                )
            );

        }


        if (
            typeof valor ===
                "object" &&
            valor !==
                null
        ) {

            buscarValoresFuente(
                valor,
                resultados,
                profundidad + 1
            );

        }

    }

}


/* =========================================================
   DETALLE
========================================================= */

function obtenerDetalle(
    respuesta,
    modo
) {

    if (
        modo ===
        "API_PRONABEC"
    ) {

        return (
            "Servicio operativo mediante API oficial de PRONABEC."
        );

    }


    if (
        modo ===
        "PORTAL_NACIONAL"
    ) {

        return (
            "Servicio operativo mediante la Plataforma Nacional de Datos Abiertos."
        );

    }


    if (
        modo ===
        "PORTAL_PRONABEC"
    ) {

        return (
            "Servicio operativo mediante portal oficial de datos de PRONABEC."
        );

    }


    if (
        modo ===
        "NO_DISPONIBLE"
    ) {

        return (
            respuesta?.observacion ||
            respuesta?.mensaje ||
            respuesta?.resultado?.observacion ||
            respuesta?.resultado?.mensaje ||
            "La fuente oficial requerida no se encuentra disponible."
        );

    }


    if (
        modo ===
        "LOCAL"
    ) {

        return (
            "Servicio local operativo."
        );

    }


    return (
        respuesta?.observacion ||
        "Servicio respondió correctamente."
    );

}


/* =========================================================
   HEALTH CHECK GENERAL
========================================================= */

async function obtenerEstadoSistema() {

    const inicioGeneral =
        Date.now();


    const pruebas = [

        {
            nombre:
                "ConvocatoriaService",

            tipo:
                "Servicio de Entidad",

            endpoint:
                "/api/convocatorias",

            ejecutar:
                () =>
                    convocatoriaService
                        .listarConvocatorias(
                            1,
                            1
                        )
        },


        {
            nombre:
                "PostulacionService",

            tipo:
                "Servicio de Entidad",

            endpoint:
                "/api/postulaciones",

            ejecutar:
                () =>
                    postulacionService
                        .listarPostulaciones(
                            1,
                            1
                        )
        },


        {
            nombre:
                "DocumentoRequisitoService",

            tipo:
                "Servicio de Entidad",

            endpoint:
                "/api/documentos",

            ejecutar:
                () =>
                    documentoService
                        .listarDocumentos(
                            1,
                            1
                        )
        },


        {
            nombre:
                "ConvenioService",

            tipo:
                "Servicio de Entidad",

            endpoint:
                "/api/convenios",

            ejecutar:
                () =>
                    convenioService
                        .listarConvenios(
                            1,
                            1
                        )
        },


        {
            nombre:
                "InstitucionService",

            tipo:
                "Servicio de Catálogo / Composición",

            endpoint:
                "/api/instituciones",

            ejecutar:
                () =>
                    institucionService
                        .listarInstituciones()
        },


        {
            nombre:
                "RegionService",

            tipo:
                "Servicio de Catálogo",

            endpoint:
                "/api/regiones",

            modoLocal:
                true,

            ejecutar:
                () =>
                    regionService
                        .listarRegiones()
        },


        {
            nombre:
                "UbigeoService",

            tipo:
                "Servicio de Catálogo Territorial",

            endpoint:
                "/api/ubigeo",

            modoLocal:
                true,

            ejecutar:
                () =>
                    ubigeoService
                        .obtenerResumen()
        },


        {
            nombre:
                "ContratosService",

            tipo:
                "Servicio de Documentación SOA",

            endpoint:
                "/api/contratos",

            modoLocal:
                true,

            ejecutar:
                () =>
                    contratosService
                        .obtenerContratos()
        }

    ];


    const servicios =
        await Promise.all(

            pruebas.map(
                prueba =>
                    medirServicio(
                        prueba
                    )
            )

        );


    const operativos =
        servicios.filter(
            servicio =>
                servicio.estado ===
                "OPERATIVO"
        )
        .length;


    const noDisponibles =
        servicios.filter(
            servicio =>
                servicio.estado ===
                "NO_DISPONIBLE"
        )
        .length;


    const errores =
        servicios.filter(
            servicio =>
                servicio.estado ===
                "ERROR"
        )
        .length;


    const apiPronabec =
        contarModo(
            servicios,
            "API_PRONABEC"
        );


    const portalNacional =
        contarModo(
            servicios,
            "PORTAL_NACIONAL"
        );


    const portalPronabec =
        contarModo(
            servicios,
            "PORTAL_PRONABEC"
        );


    const locales =
        contarModo(
            servicios,
            "LOCAL"
        );


    const otros =
        contarModo(
            servicios,
            "OPERATIVO"
        );


    const porcentaje =
        servicios.length
            ? Math.round(
                (
                    operativos /
                    servicios.length
                ) *
                100
            )
            : 0;


    const estadoGeneral =
        errores > 0
            ? "DEGRADADO"

            : noDisponibles > 0
                ? "OPERATIVO_PARCIAL"

                : "OPERATIVO";


    const fuenteExterna =
        determinarFuenteExterna(
            servicios
        );


    const inventarioSOA =
        contratosService
            .obtenerResumenContratos();


    return {

        servicio:
            "HealthCheckService",

        tipo:
            "Servicio Utility / Monitoreo",

        proyecto:
            "EduPeruSOA",

        arquitectura:
            "Arquitectura Orientada a Servicios - SOA",

        version:
            "1.9.0",

        estado:
            estadoGeneral,

        disponible:
            errores === 0,

        politicaDatos:
            "Solo fuentes oficiales; no se generan datos ficticios de respaldo.",

        fecha:
            new Date()
                .toISOString(),

        duracionTotalMs:
            Date.now() -
            inicioGeneral,

        inventarioSOA,

        resumenMonitoreo: {

            totalServiciosMonitoreados:
                servicios.length,

            operativos,

            noDisponibles,

            errores,

            apiPronabec,

            portalNacional,

            portalPronabec,

            locales,

            otros,

            disponibilidadPorcentaje:
                porcentaje

        },

        fuenteExterna,

        serviciosMonitoreados:
            servicios

    };

}


/* =========================================================
   FUENTE EXTERNA
========================================================= */

function determinarFuenteExterna(
    servicios
) {

    const serviciosExternos =
        servicios.filter(
            servicio => [

                "ConvocatoriaService",
                "PostulacionService",
                "DocumentoRequisitoService",
                "ConvenioService",
                "InstitucionService"

            ].includes(
                servicio.nombre
            )
        );


    const apiPronabec =
        contarModo(
            serviciosExternos,
            "API_PRONABEC"
        );


    const portalNacional =
        contarModo(
            serviciosExternos,
            "PORTAL_NACIONAL"
        );


    const portalPronabec =
        contarModo(
            serviciosExternos,
            "PORTAL_PRONABEC"
        );


    const noDisponibles =
        contarModo(
            serviciosExternos,
            "NO_DISPONIBLE"
        );


    const errores =
        contarModo(
            serviciosExternos,
            "ERROR"
        );


    const oficialesDisponibles =
        apiPronabec +
        portalNacional +
        portalPronabec;


    let estado =
        "NO_DETERMINADO";


    if (
        oficialesDisponibles > 0 &&
        noDisponibles === 0 &&
        errores === 0
    ) {

        estado =
            "OFICIAL_DISPONIBLE";

    } else if (
        oficialesDisponibles > 0
    ) {

        estado =
            "OFICIAL_PARCIAL";

    } else if (
        errores > 0
    ) {

        estado =
            "ERROR";

    } else if (
        noDisponibles > 0
    ) {

        estado =
            "NO_DISPONIBLE";

    }


    return {

        nombre:
            "PRONABEC",

        politica:
            "SOLO_FUENTES_OFICIALES",

        estado,

        apiPronabec,

        portalNacional,

        portalPronabec,

        noDisponibles,

        errores

    };

}


/* =========================================================
   CONTAR MODO
========================================================= */

function contarModo(
    servicios,
    modo
) {

    return servicios.filter(
        servicio =>
            servicio.modo ===
            modo
    )
    .length;

}


/* =========================================================
   NORMALIZAR
========================================================= */

function normalizar(
    texto
) {

    return String(
        texto ||
        ""
    )
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();

}


/* =========================================================
   EXPORTAR
========================================================= */

module.exports = {

    obtenerEstadoSistema

};
