const axios = require("axios");


/* =========================================================
   EDUPERÚ - INTEGRACIÓN OFICIAL PRONABEC

   Estrategia:
   1) API oficial de PRONABEC.
   2) Si el subdominio API no responde, usar recursos
      oficiales publicados por PRONABEC en la Plataforma
      Nacional de Datos Abiertos.
   3) NUNCA inventar datos locales.
========================================================= */


const URL_API_PRONABEC =
    "https://api.datosabiertos.pronabec.gob.pe/developer";


const USER_AGENT =
    "EduPeruSOA/1.0 (+https://localhost)";


const TIMEOUT_API_MS =
    7000;


const TIMEOUT_PORTAL_MS =
    120000;


const CACHE_TTL_MS =
    10 * 60 * 1000;


const API_COOLDOWN_MS =
    5 * 60 * 1000;


/*
   Grupo oficial de PRONABEC dentro de la Plataforma Nacional
   de Datos Abiertos. Se usa únicamente para descubrir enlaces
   publicados por la propia entidad.
*/
const URL_GRUPO_PRONABEC_NACIONAL =
    "https://www.datosabiertos.gob.pe/group/programa-nacional-de-becas-y-cr%C3%A9dito-educativo-pronabec";


const MAX_PAGINAS_DESCUBRIMIENTO_GRUPO =
    8;


/* =========================================================
   RECURSOS OFICIALES ALTERNOS

   Estos enlaces NO son datos ficticios.
   Son publicaciones oficiales de PRONABEC en
   www.datosabiertos.gob.pe o en su portal institucional.
========================================================= */

const RECURSOS_OFICIALES = {

    ConvocatoriaCarreraVigentes: {

        nombre:
            "Convocatorias Vigentes - PRONABEC",

        recursoNacional:
            "https://www.datosabiertos.gob.pe/dataset/convocatorias-vigentes/resource/0be16455-3bf1-4927-b2cd-31de6d2f9adf",

        paginaNacional:
            "https://www.datosabiertos.gob.pe/dataset/convocatorias-vigentes-pronabec",

        paginaPronabec:
            "https://datosabiertos.pronabec.gob.pe/Dataset/ConvocatoriaCarreraVigentes"

    },


    CarrerasElegiblesNacional: {

        nombre:
            "Convocatorias - Carreras elegibles nacional - PRONABEC",

        recursoNacional:
            "https://www.datosabiertos.gob.pe/dataset/convocatorias-carreras-elegibles-nacional-pronabec/resource/a7bab7ae-1213-4ad4-a5e5",

        paginaNacional:
            "https://www.datosabiertos.gob.pe/dataset/convocatorias-carreras-elegibles-nacional-pronabec"

    },


    PostulacionesVigentes: {

        nombre:
            "Postulaciones Vigentes - PRONABEC",

        recursoNacional:
            "https://www.datosabiertos.gob.pe/dataset/postulaciones-vigentes-pronabec/resource/004e6380-e5dd-47d4-8ea6-21014a388d95",

        paginaNacional:
            "https://www.datosabiertos.gob.pe/dataset/postulaciones-vigentes-pronabec",

        paginaPronabec:
            "https://datosabiertos.pronabec.gob.pe/dataset/PostulacionesVigentes"

    },


    Convenio: {

        nombre:
            "Convenios interinstitucionales del Pronabec",

        recursoNacional:
            "https://www.datosabiertos.gob.pe/dataset/convenios-interinstitucionales-del-pronabec/resource/9fa99d9f-4d35-4f35-8162-0ecf8d9696a7",

        paginaNacional:
            "https://www.datosabiertos.gob.pe/dataset/convenios-interinstitucionales-del-pronabec",

        paginaPronabec:
            "https://datosabiertos.pronabec.gob.pe/Dataset/Convenio"

    },


    DocumentosSolicitadosABecarios: {

        nombre:
            "Documentos solicitados a becarios / postulantes - PRONABEC",

        /*
           Publicación histórica del catálogo nacional.
           Actualmente puede apuntar solo a un recurso HTML.
        */
        paginaNacional:
            "https://www.datosabiertos.gob.pe/dataset/documentos-solicitados-becarios-pronabec",

        paginaPronabec:
            "https://datosabiertos.pronabec.gob.pe/dataset/DocumentosSolicitadosABecarios",

        /*
           PRONABEC también publica en la Plataforma Nacional un
           conjunto CSV denominado "Documentos solicitados a
           postulantes a becas del Pronabec". Como el slug/recurso
           puede cambiar al actualizarse, EduPerú lo descubre desde
           las páginas oficiales del grupo PRONABEC en vez de fijar
           una URL de descarga no verificada.
        */
        descubrirEnGrupoPronabec:
            true,

        titulosBusquedaNacional: [
            "Documentos solicitados a postulantes a becas del Pronabec",
            "Documentos solicitados a becarios - PRONABEC"
        ]

    }

};


/* =========================================================
   CACHÉ EN MEMORIA
========================================================= */

const cache =
    new Map();


let apiNoDisponibleHasta =
    0;


let ultimoErrorApi =
    null;


/* =========================================================
   CLIENTES HTTP
========================================================= */

const clienteApi =
    axios.create({

        baseURL:
            URL_API_PRONABEC,

        timeout:
            TIMEOUT_API_MS,

        headers: {

            Accept:
                "application/json",

            "User-Agent":
                USER_AGENT

        }

    });


const clientePortal =
    axios.create({

        timeout:
            TIMEOUT_PORTAL_MS,

        maxContentLength:
            150 * 1024 * 1024,

        maxBodyLength:
            150 * 1024 * 1024,

        headers: {

            Accept:
                "text/html,application/xhtml+xml,text/csv,application/json;q=0.9,*/*;q=0.8",

            "Accept-Language":
                "es-PE,es;q=0.9,en;q=0.7",

            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36"

        }

    });


/* =========================================================
   CONSULTA API PRONABEC ORIGINAL
   Se conserva para compatibilidad.
========================================================= */

async function consultarRecurso(
    recurso,
    parametros = {}
) {

    const apiKey =
        process.env.PRONABEC_API_KEY;


    if (!apiKey) {

        throw crearErrorFuente(
            "PRONABEC_API_KEY_NO_CONFIGURADA",
            "No se encontró PRONABEC_API_KEY en el archivo .env."
        );

    }


    try {

        const respuesta =
            await clienteApi.get(
                `/${recurso}`,
                {
                    params: {
                        apiKey,
                        ...parametros
                    }
                }
            );


        return respuesta.data;

    } catch (error) {

        throw normalizarErrorApi(
            error,
            recurso
        );

    }

}


/* =========================================================
   CONSULTA OFICIAL MULTIFUENTE

   Primero intenta la API PRONABEC.
   Si falla, consulta publicaciones oficiales del Estado.
========================================================= */

async function consultarFuenteOficial(
    recurso,
    parametros = {}
) {

    let errorApi =
        null;


    /* -----------------------------------------------------
       1. API OFICIAL PRONABEC
    ----------------------------------------------------- */

    if (
        Date.now() >=
        apiNoDisponibleHasta
    ) {

        try {

            const respuestaApi =
                await consultarRecurso(
                    recurso,
                    parametros
                );


            const registrosApi =
                extraerRegistros(
                    respuestaApi
                );


            if (
                registrosApi.length > 0
            ) {

                ultimoErrorApi =
                    null;


                return {

                    modo:
                        "API_PRONABEC",

                    fuente:
                        "PRONABEC - API de Datos Abiertos",

                    fuenteOficial:
                        true,

                    disponible:
                        true,

                    recurso,

                    urlFuente:
                        `${URL_API_PRONABEC}/${recurso}`,

                    total:
                        obtenerTotal(
                            respuestaApi,
                            registrosApi
                        ),

                    datos:
                        registrosApi,

                    fechaConsulta:
                        new Date().toISOString()

                };

            }


            console.warn(
                `[PRONABEC] ${recurso}: la API respondió sin registros. Se comprobará otra publicación oficial.`
            );

        } catch (error) {

            errorApi =
                error;


            ultimoErrorApi =
                error;


            if (
                [
                    "ENOTFOUND",
                    "EAI_AGAIN",
                    "ECONNREFUSED",
                    "ECONNABORTED",
                    "ETIMEDOUT"
                ].includes(
                    error.codigoTecnico
                )
            ) {

                apiNoDisponibleHasta =
                    Date.now() +
                    API_COOLDOWN_MS;

            }


            console.warn(
                `[PRONABEC] API no disponible para ${recurso}: ${error.message}`
            );

        }

    } else {

        errorApi =
            ultimoErrorApi;


        console.warn(
            `[PRONABEC] API en pausa temporal por error de red. Se consultará una publicación oficial alterna para ${recurso}.`
        );

    }


    /* -----------------------------------------------------
       2. PLATAFORMA NACIONAL / PORTAL PRONABEC
    ----------------------------------------------------- */

    try {

        const oficial =
            await consultarPublicacionOficial(
                recurso,
                parametros
            );


        if (
            oficial &&
            oficial.datos.length > 0
        ) {

            return {

                ...oficial,

                motivoApi:
                    errorApi?.message ||
                    null

            };

        }


        throw crearErrorFuente(
            "SIN_REGISTROS_OFICIALES",
            "La fuente oficial respondió, pero no publicó registros utilizables."
        );

    } catch (errorPortal) {

        const mensajeApi =
            errorApi?.message ||
            "La API principal no devolvió registros.";


        const errorFinal =
            crearErrorFuente(
                "FUENTES_OFICIALES_NO_DISPONIBLES",
                `No fue posible obtener datos reales de PRONABEC. API: ${mensajeApi} Fuente alterna oficial: ${errorPortal.message}`
            );


        errorFinal.causaApi =
            errorApi;

        errorFinal.causaPortal =
            errorPortal;


        throw errorFinal;

    }

}


/* =========================================================
   CONSULTA PAGINADA OFICIAL
========================================================= */

async function consultarPaginadoOficial(
    recurso,
    pagina = 1,
    filas = 10,
    filtros = {}
) {

    pagina =
        Math.max(
            1,
            Number(pagina) ||
            1
        );


    filas =
        Math.max(
            1,
            Math.min(
                200,
                Number(filas) ||
                10
            )
        );


    const respuesta =
        await consultarFuenteOficial(
            recurso,
            {
                page:
                    pagina,

                rows:
                    filas,

                ...filtros
            }
        );


    /*
       La API PRONABEC ya pagina del lado servidor.
       El portal nacional se pagina localmente.
    */

    if (
        respuesta.modo ===
        "API_PRONABEC"
    ) {

        return respuesta;

    }


    const todos =
        respuesta.datos;


    const inicio =
        (pagina - 1) *
        filas;


    return {

        ...respuesta,

        total:
            todos.length,

        pagina,

        filas,

        datos:
            todos.slice(
                inicio,
                inicio + filas
            )

    };

}


/* =========================================================
   COMPATIBILIDAD CON EL CÓDIGO ANTERIOR
========================================================= */

async function consultarPaginado(
    recurso,
    pagina = 1,
    filas = 10,
    filtros = {}
) {

    return await consultarRecurso(
        recurso,
        {
            page:
                pagina,

            rows:
                filas,

            ...filtros
        }
    );

}


/* =========================================================
   FUENTE OFICIAL ALTERNA
========================================================= */

async function consultarPublicacionOficial(
    recurso,
    parametros = {}
) {

    const configuracion =
        RECURSOS_OFICIALES[recurso];


    if (!configuracion) {

        throw crearErrorFuente(
            "RECURSO_OFICIAL_NO_CONFIGURADO",
            `No existe una publicación oficial alterna configurada para ${recurso}.`
        );

    }


    const claveCache =
        `oficial:${recurso}`;


    let registros =
        obtenerCache(
            claveCache
        );


    let urlUtilizada =
        configuracion.recursoNacional ||
        configuracion.paginaNacional ||
        configuracion.paginaPronabec;


    let tipoFuente =
        "PORTAL_NACIONAL";


    if (!registros) {

        /* -------------------------------------------------
           2A. CSV oficial publicado en datosabiertos.gob.pe
        ------------------------------------------------- */

        const paginas =
            [
                configuracion.recursoNacional,
                configuracion.paginaNacional
            ]
                .filter(Boolean);


        for (
            const pagina
            of paginas
        ) {

            try {

                const urlCsv =
                    await descubrirUrlCsv(
                        pagina
                    );


                if (!urlCsv) {
                    continue;
                }


                const csv =
                    await descargarTexto(
                        urlCsv
                    );


                const parsed =
                    parsearCsv(
                        csv
                    );


                if (
                    parsed.length > 0
                ) {

                    registros =
                        parsed;

                    urlUtilizada =
                        urlCsv;

                    tipoFuente =
                        "PORTAL_NACIONAL";

                    break;

                }

            } catch (error) {

                console.warn(
                    `[PRONABEC] No se pudo leer ${pagina}: ${error.message}`
                );

            }

        }


        /* -------------------------------------------------
           2B. DESCUBRIMIENTO EN EL GRUPO OFICIAL PRONABEC

           Algunos conjuntos más recientes de la Plataforma
           Nacional cambian de slug o de resource UUID. En esos
           casos se localiza primero la página oficial del dataset
           por su título y luego se descubre su CSV real.

           No se usa ningún buscador externo ni datos inventados.
        ------------------------------------------------- */

        if (
            (!registros ||
             registros.length === 0) &&
            configuracion.descubrirEnGrupoPronabec
        ) {

            try {

                const paginaDataset =
                    await descubrirDatasetEnGrupoPronabec(
                        configuracion
                    );


                if (
                    paginaDataset
                ) {

                    const urlCsv =
                        await descubrirUrlCsv(
                            paginaDataset
                        );


                    if (
                        urlCsv
                    ) {

                        const csv =
                            await descargarTexto(
                                urlCsv
                            );


                        const parsed =
                            parsearCsv(
                                csv
                            );


                        if (
                            parsed.length > 0
                        ) {

                            registros =
                                parsed;


                            urlUtilizada =
                                urlCsv;


                            tipoFuente =
                                "PORTAL_NACIONAL";

                        }

                    }

                }

            } catch (error) {

                console.warn(
                    `[PRONABEC] No se pudo descubrir el dataset nacional actualizado de ${configuracion.nombre}: ${error.message}`
                );

            }

        }


        /* -------------------------------------------------
           2C. Página oficial PRONABEC (HTML)
           Solo se usa si la publicación contiene filas reales.
        ------------------------------------------------- */

        if (
            (!registros ||
             registros.length === 0) &&
            configuracion.paginaPronabec
        ) {

            try {

                const html =
                    await descargarTexto(
                        configuracion.paginaPronabec
                    );


                const tabla =
                    parsearMejorTablaHtml(
                        html,
                        recurso
                    );


                if (
                    tabla.length > 0
                ) {

                    registros =
                        tabla;

                    urlUtilizada =
                        configuracion.paginaPronabec;

                    tipoFuente =
                        "PORTAL_PRONABEC";

                }

            } catch (error) {

                console.warn(
                    `[PRONABEC] No se pudo leer la página oficial ${configuracion.paginaPronabec}: ${error.message}`
                );

            }

        }


        if (
            registros &&
            registros.length > 0
        ) {

            guardarCache(
                claveCache,
                registros
            );

        }

    }


    if (
        !registros ||
        registros.length === 0
    ) {

        throw crearErrorFuente(
            "SIN_DATOS_EN_PUBLICACIONES_OFICIALES",
            `No se encontraron registros reales publicados para ${configuracion.nombre}.`
        );

    }


    const filtrados =
        aplicarFiltrosLocales(
            registros,
            parametros
        );


    return {

        modo:
            tipoFuente,

        fuente:
            tipoFuente ===
            "PORTAL_PRONABEC"
                ? "PRONABEC - Portal de Datos Abiertos"
                : "PRONABEC - Plataforma Nacional de Datos Abiertos",

        fuenteOficial:
            true,

        disponible:
            true,

        recurso,

        nombreFuente:
            configuracion.nombre,

        urlFuente:
            urlUtilizada,

        total:
            filtrados.length,

        datos:
            filtrados,

        fechaConsulta:
            new Date().toISOString()

    };

}


/* =========================================================
   DESCUBRIR DATASET EN EL GRUPO OFICIAL PRONABEC
========================================================= */

async function descubrirDatasetEnGrupoPronabec(
    configuracion
) {

    const titulos =
        Array.isArray(
            configuracion?.titulosBusquedaNacional
        )
            ? configuracion.titulosBusquedaNacional
            : [];


    if (
        titulos.length === 0
    ) {

        return null;

    }


    const objetivos =
        titulos
            .map(
                titulo =>
                    normalizarTexto(
                        titulo
                    )
            )
            .filter(Boolean);


    /*
       Se recorren pocas páginas del grupo oficial. La URL final
       encontrada siempre debe pertenecer a datosabiertos.gob.pe.
    */
    for (
        let pagina = 0;
        pagina < MAX_PAGINAS_DESCUBRIMIENTO_GRUPO;
        pagina++
    ) {

        const url =
            pagina === 0
                ? URL_GRUPO_PRONABEC_NACIONAL
                : `${URL_GRUPO_PRONABEC_NACIONAL}?page=${pagina}&search_api_views_fulltext=&sort_by=changed&sort_order=DESC`;


        let html;


        try {

            html =
                await descargarTexto(
                    url
                );

        } catch (error) {

            /*
               Si una página concreta no responde, se prueban las
               siguientes. No se convierte el fallo en dato.
            */
            continue;

        }


        const enlaces =
            extraerEnlacesHtml(
                html,
                url
            );


        const candidatos =
            enlaces.filter(
                item => {

                    if (
                        !/datosabiertos\.gob\.pe$/i.test(
                            obtenerHostSeguro(
                                item.url
                            )
                        )
                    ) {

                        return false;

                    }


                    if (
                        !/\/dataset\//i.test(
                            item.url
                        )
                    ) {

                        return false;

                    }


                    const texto =
                        normalizarTexto(
                            item.texto
                        );


                    return objetivos.some(
                        objetivo =>
                            texto === objetivo ||
                            texto.includes(
                                objetivo
                            ) ||
                            objetivo.includes(
                                texto
                            )
                    );

                }
            );


        if (
            candidatos.length > 0
        ) {

            /*
               Se prioriza el primer título configurado.
            */
            candidatos.sort(
                (
                    a,
                    b
                ) => {

                    const aTexto =
                        normalizarTexto(
                            a.texto
                        );


                    const bTexto =
                        normalizarTexto(
                            b.texto
                        );


                    const aIndice =
                        objetivos.findIndex(
                            objetivo =>
                                aTexto.includes(
                                    objetivo
                                ) ||
                                objetivo.includes(
                                    aTexto
                                )
                        );


                    const bIndice =
                        objetivos.findIndex(
                            objetivo =>
                                bTexto.includes(
                                    objetivo
                                ) ||
                                objetivo.includes(
                                    bTexto
                                )
                        );


                    return (
                        (
                            aIndice < 0
                                ? 999
                                : aIndice
                        ) -
                        (
                            bIndice < 0
                                ? 999
                                : bIndice
                        )
                    );

                }
            );


            return candidatos[0].url;

        }

    }


    return null;

}


function obtenerHostSeguro(
    url
) {

    try {

        return new URL(
            url
        ).hostname;

    } catch {

        return "";

    }

}


/* =========================================================
   DESCUBRIR CSV DESDE UNA PÁGINA OFICIAL
========================================================= */

async function descubrirUrlCsv(
    urlInicial
) {

    const visitadas =
        new Set();


    return await descubrirUrlCsvRecursivo(
        urlInicial,
        visitadas,
        0
    );

}


async function descubrirUrlCsvRecursivo(
    url,
    visitadas,
    profundidad
) {

    if (
        !url ||
        visitadas.has(url) ||
        profundidad > 4
    ) {

        return null;

    }


    visitadas.add(
        url
    );


    if (
        /\.csv(?:$|\?)/i.test(
            url
        )
    ) {

        return url;

    }


    const html =
        await descargarTexto(
            url
        );


    const enlaces =
        extraerEnlacesHtml(
            html,
            url
        );


    const csvDirecto =
        enlaces.find(
            item =>
                /\.csv(?:$|\?)/i.test(
                    item.url
                )
        );


    if (
        csvDirecto
    ) {

        return csvDirecto.url;

    }


    /*
       En DKAN/Drupal el enlace de descarga a veces no termina en
       .csv, pero el texto del recurso sí indica que es CSV.
    */
    const csvPorTexto =
        enlaces.find(
            item => {

                const texto =
                    normalizarTexto(
                        item.texto
                    );


                return (
                    texto.includes(
                        "CSV"
                    ) &&
                    (
                        texto.includes(
                            "DATASET"
                        ) ||
                        texto.includes(
                            "DESCARGAR"
                        ) ||
                        texto.includes(
                            "RECURSO"
                        )
                    )
                );

            }
        );


    if (
        csvPorTexto
    ) {

        try {

            const encontrada =
                await descubrirUrlCsvRecursivo(
                    csvPorTexto.url,
                    visitadas,
                    profundidad + 1
                );


            if (
                encontrada
            ) {

                return encontrada;

            }

        } catch {
            // Continúa con otros candidatos oficiales.
        }

    }


    const descargas =
        enlaces.filter(
            item => {

                const texto =
                    normalizarTexto(
                        item.texto
                    );


                return (
                    texto.includes(
                        "DESCARGAR"
                    ) ||
                    texto.includes(
                        "DOWNLOAD"
                    ) ||
                    /\/download(?:\/|$|\?)/i.test(
                        item.url
                    )
                );

            }
        );


    for (
        const descarga
        of descargas
    ) {

        if (
            /\.csv(?:$|\?)/i.test(
                descarga.url
            )
        ) {

            return descarga.url;

        }


        try {

            const encontrada =
                await descubrirUrlCsvRecursivo(
                    descarga.url,
                    visitadas,
                    profundidad + 1
                );


            if (
                encontrada
            ) {

                return encontrada;

            }

        } catch {
            // Continúa con la siguiente descarga.
        }

    }


    const recursos =
        enlaces.filter(
            item =>
                /\/resource\//i.test(
                    item.url
                )
        );


    for (
        const recurso
        of recursos
    ) {

        try {

            const encontrada =
                await descubrirUrlCsvRecursivo(
                    recurso.url,
                    visitadas,
                    profundidad + 1
                );


            if (
                encontrada
            ) {

                return encontrada;

            }

        } catch {
            // Continúa con otro recurso.
        }

    }


    return null;

}


/* =========================================================
   DESCARGAR TEXTO
========================================================= */

async function descargarTexto(
    url
) {

    /*
       Se descarga como binario para evitar que Axios convierta
       un CSV Windows-1252/Latin-1 como si fuera UTF-8.
       Eso corrige textos como:
       AMPLIACI�N -> AMPLIACIÓN
       EDUCACI�N  -> EDUCACIÓN
    */

    const respuesta =
        await clientePortal.get(
            url,
            {
                responseType:
                    "arraybuffer",

                transformResponse:
                    [
                        data =>
                            data
                    ]
            }
        );


    const buffer =
        Buffer.isBuffer(
            respuesta.data
        )
            ? respuesta.data
            : Buffer.from(
                respuesta.data
            );


    return decodificarBuffer(
        buffer,
        respuesta.headers?.[
            "content-type"
        ] ||
        ""
    );

}


/* =========================================================
   DECODIFICAR RESPUESTA HTTP
========================================================= */

function decodificarBuffer(
    buffer,
    contentType = ""
) {

    if (
        !buffer ||
        buffer.length === 0
    ) {

        return "";

    }


    /*
       BOM UTF-8
    */
    if (
        buffer.length >= 3 &&
        buffer[0] === 0xEF &&
        buffer[1] === 0xBB &&
        buffer[2] === 0xBF
    ) {

        return buffer
            .subarray(3)
            .toString(
                "utf8"
            );

    }


    /*
       BOM UTF-16 LE
    */
    if (
        buffer.length >= 2 &&
        buffer[0] === 0xFF &&
        buffer[1] === 0xFE
    ) {

        return new TextDecoder(
            "utf-16le"
        )
            .decode(
                buffer.subarray(2)
            );

    }


    const charset =
        String(
            contentType ||
            ""
        )
            .match(
                /charset\s*=\s*["']?([^;"'\s]+)/i
            )?.[1]
            ?.toLowerCase();


    if (
        charset &&
        (
            charset.includes(
                "1252"
            ) ||
            charset.includes(
                "latin1"
            ) ||
            charset.includes(
                "iso-8859-1"
            )
        )
    ) {

        return new TextDecoder(
            "windows-1252"
        )
            .decode(
                buffer
            );

    }


    /*
       Primero se intenta UTF-8 estricto.
       Si los bytes no forman UTF-8 válido, se interpreta
       como Windows-1252, codificación frecuente en CSV
       publicados desde Excel.
    */

    try {

        return new TextDecoder(
            "utf-8",
            {
                fatal:
                    true
            }
        )
            .decode(
                buffer
            );

    } catch {

        return new TextDecoder(
            "windows-1252"
        )
            .decode(
                buffer
            );

    }

}


/* =========================================================
   FILTROS LOCALES
========================================================= */

function aplicarFiltrosLocales(
    registros,
    parametros
) {

    let salida =
        registros;


    const filtros =
        Object.entries(
            parametros ||
            {}
        )
            .filter(
                ([clave, valor]) =>
                    ![
                        "page",
                        "rows",
                        "sidx",
                        "sord",
                        "order"
                    ].includes(
                        clave
                    ) &&
                    valor !==
                    undefined &&
                    valor !==
                    null &&
                    String(valor).trim() !==
                    ""
            );


    if (
        filtros.length === 0
    ) {

        return salida;

    }


    /*
       filter0/filter1 de la API original no incluyen
       el nombre del campo. Para mantener búsquedas útiles
       en la copia oficial se busca el texto en toda la fila.
    */

    const genericos =
        filtros
            .filter(
                ([clave]) =>
                    /^filter\d+$/i.test(
                        clave
                    )
            )
            .map(
                ([, valor]) =>
                    normalizarTexto(
                        valor
                    )
            );


    const especificos =
        filtros.filter(
            ([clave]) =>
                !/^filter\d+$/i.test(
                    clave
                )
        );


    salida =
        salida.filter(
            fila => {

                const contenido =
                    normalizarTexto(
                        JSON.stringify(
                            fila
                        )
                    );


                const cumpleGenericos =
                    genericos.every(
                        valor =>
                            contenido.includes(
                                valor
                            )
                    );


                const cumpleEspecificos =
                    especificos.every(
                        ([campo, valor]) => {

                            const claveReal =
                                Object.keys(
                                    fila
                                )
                                    .find(
                                        clave =>
                                            normalizarTexto(
                                                clave
                                            ) ===
                                            normalizarTexto(
                                                campo
                                            )
                                    );


                            if (!claveReal) {

                                return contenido.includes(
                                    normalizarTexto(
                                        valor
                                    )
                                );

                            }


                            return normalizarTexto(
                                fila[claveReal]
                            )
                                .includes(
                                    normalizarTexto(
                                        valor
                                    )
                                );

                        }
                    );


                return (
                    cumpleGenericos &&
                    cumpleEspecificos
                );

            }
        );


    return salida;

}


/* =========================================================
   EXTRAER REGISTROS DE RESPUESTAS API
========================================================= */

function extraerRegistros(
    respuesta
) {

    if (
        Array.isArray(
            respuesta
        )
    ) {

        return respuesta;

    }


    if (
        !respuesta ||
        typeof respuesta !==
        "object"
    ) {

        return [];

    }


    const candidatos = [

        respuesta.datos,

        respuesta.data,

        respuesta.rows,

        respuesta.records,

        respuesta.resultado,

        respuesta.result,

        respuesta.result?.data,

        respuesta.result?.records

    ];


    for (
        const candidato
        of candidatos
    ) {

        if (
            Array.isArray(
                candidato
            )
        ) {

            return candidato;

        }

    }


    for (
        const valor
        of Object.values(
            respuesta
        )
    ) {

        if (
            Array.isArray(
                valor
            )
        ) {

            return valor;

        }

    }


    return [];

}


function obtenerTotal(
    respuesta,
    registros
) {

    if (
        registros.length > 0
    ) {

        const primero =
            registros[0];


        const total =
            Number(
                primero?.TOTAL_RECORDS ??
                primero?.total_records ??
                respuesta?.TOTAL_RECORDS ??
                respuesta?.total ??
                registros.length
            );


        if (
            Number.isFinite(
                total
            )
        ) {

            return total;

        }

    }


    return registros.length;

}


/* =========================================================
   PARSER CSV RFC4180 BÁSICO
========================================================= */

function parsearCsv(
    texto
) {

    texto =
        String(
            texto ||
            ""
        )
            .replace(
                /^\uFEFF/,
                ""
            );


    if (!texto.trim()) {

        return [];

    }


    const primeraLinea =
        texto
            .split(
                /\r?\n/,
                1
            )[0];


    const separador =
        detectarSeparador(
            primeraLinea
        );


    const filas =
        [];


    let fila =
        [];


    let campo =
        "";


    let entreComillas =
        false;


    for (
        let i = 0;
        i < texto.length;
        i++
    ) {

        const caracter =
            texto[i];


        if (
            caracter ===
            '"'
        ) {

            if (
                entreComillas &&
                texto[i + 1] ===
                '"'
            ) {

                campo +=
                    '"';

                i++;

            } else {

                entreComillas =
                    !entreComillas;

            }


            continue;

        }


        if (
            caracter ===
            separador &&
            !entreComillas
        ) {

            fila.push(
                campo
            );

            campo =
                "";

            continue;

        }


        if (
            (caracter === "\n" ||
             caracter === "\r") &&
            !entreComillas
        ) {

            if (
                caracter === "\r" &&
                texto[i + 1] === "\n"
            ) {

                i++;

            }


            fila.push(
                campo
            );


            if (
                fila.some(
                    valor =>
                        String(valor)
                            .trim() !==
                        ""
                )
            ) {

                filas.push(
                    fila
                );

            }


            fila =
                [];

            campo =
                "";

            continue;

        }


        campo +=
            caracter;

    }


    if (
        campo.length > 0 ||
        fila.length > 0
    ) {

        fila.push(
            campo
        );

        filas.push(
            fila
        );

    }


    if (
        filas.length < 2
    ) {

        return [];

    }


    const cabeceras =
        filas
            .shift()
            .map(
                (cabecera, indice) => {

                    const limpia =
                        String(
                            cabecera ||
                            ""
                        )
                            .trim();


                    return limpia ||
                        `CAMPO_${indice + 1}`;

                }
            );


    return filas
        .map(
            valores => {

                const objeto =
                    {};


                cabeceras.forEach(
                    (
                        cabecera,
                        indice
                    ) => {

                        objeto[cabecera] =
                            String(
                                valores[indice] ??
                                ""
                            )
                                .trim();

                    }
                );


                return objeto;

            }
        )
        .filter(
            objeto =>
                Object.values(
                    objeto
                )
                    .some(
                        valor =>
                            String(valor)
                                .trim() !==
                            ""
                    )
        );

}


function detectarSeparador(
    linea
) {

    const candidatos =
        [",", ";", "\t", "|"];


    let mejor =
        ",";


    let mayor =
        -1;


    for (
        const separador
        of candidatos
    ) {

        const cantidad =
            linea
                .split(
                    separador
                )
                .length -
            1;


        if (
            cantidad >
            mayor
        ) {

            mayor =
                cantidad;

            mejor =
                separador;

        }

    }


    return mejor;

}


/* =========================================================
   PARSER HTML MUY ACOTADO
   Solo toma filas ya publicadas dentro de <table>.
========================================================= */

function parsearMejorTablaHtml(
    html,
    recurso = ""
) {

    html =
        String(
            html ||
            ""
        );


    const tablas =
        [
            ...html.matchAll(
                /<table\b[^>]*>([\s\S]*?)<\/table>/gi
            )
        ]
            .map(
                coincidencia =>
                    coincidencia[1]
            );


    if (
        tablas.length ===
        0
    ) {

        return [];

    }


    const objetivoDocumentos =
        normalizarTexto(
            recurso
        )
        .includes(
            "DOCUMENTOSSOLICITADOS"
        );


    let mejor =
        [];


    let mejorPuntaje =
        -1;


    for (
        const tabla
        of tablas
    ) {

        const filas =
            parsearTablaHtmlInterna(
                tabla
            );


        if (
            filas.length ===
            0
        ) {

            continue;

        }


        const cabeceras =
            Object.keys(
                filas[0] ||
                {}
            )
            .map(
                normalizarTexto
            );


        let puntaje =
            filas.length;


        if (
            objetivoDocumentos
        ) {

            [
                "CATEGORIA",
                "TIPO",
                "DOCUMENTO"
            ].forEach(
                campo => {

                    if (
                        cabeceras.some(
                            cabecera =>
                                cabecera.includes(
                                    campo
                                )
                        )
                    ) {

                        puntaje +=
                            10000;

                    }

                }
            );

        }


        if (
            puntaje >
            mejorPuntaje
        ) {

            mejorPuntaje =
                puntaje;


            mejor =
                filas;

        }

    }


    return mejor;

}


function parsearTablaHtmlInterna(
    contenidoTabla
) {

    const filasHtml =
        [
            ...String(
                contenidoTabla ||
                ""
            )
            .matchAll(
                /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
            )
        ]
            .map(
                coincidencia =>
                    coincidencia[1]
            );


    if (
        filasHtml.length <
        2
    ) {

        return [];

    }


    const extraerCeldas =
        fila =>
            [
                ...fila.matchAll(
                    /<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi
                )
            ]
                .map(
                    coincidencia =>
                        limpiarHtml(
                            coincidencia[1]
                        )
                );


    const cabeceras =
        extraerCeldas(
            filasHtml[0]
        );


    if (
        cabeceras.length ===
        0
    ) {

        return [];

    }


    return filasHtml
        .slice(
            1
        )
        .map(
            fila => {

                const celdas =
                    extraerCeldas(
                        fila
                    );


                const objeto =
                    {};


                cabeceras.forEach(
                    (
                        cabecera,
                        indice
                    ) => {

                        objeto[
                            cabecera ||
                            `CAMPO_${indice + 1}`
                        ] =
                            celdas[
                                indice
                            ] ||
                            "";

                    }
                );


                return objeto;

            }
        )
        .filter(
            objeto =>
                Object.values(
                    objeto
                )
                    .some(
                        valor => {

                            const texto =
                                normalizarTexto(
                                    valor
                                );


                            return (
                                texto &&
                                texto !==
                                "NO HAY DATOS DISPONIBLES"
                            );

                        }
                    )
        );

}


/* =========================================================
   ENLACES HTML
========================================================= */

function extraerEnlacesHtml(
    html,
    baseUrl
) {

    const salida =
        [];


    const regex =
        /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;


    let coincidencia;


    while (
        (
            coincidencia =
                regex.exec(
                    String(
                        html ||
                        ""
                    )
                )
        )
    ) {

        try {

            const href =
                decodificarEntidades(
                    coincidencia[1]
                );


            const url =
                new URL(
                    href,
                    baseUrl
                )
                    .toString();


            salida.push({

                url,

                texto:
                    limpiarHtml(
                        coincidencia[2]
                    )

            });

        } catch {
            // Enlace inválido.
        }

    }


    return salida;

}


/* =========================================================
   CACHÉ
========================================================= */

function obtenerCache(
    clave
) {

    const item =
        cache.get(
            clave
        );


    if (!item) {

        return null;

    }


    if (
        Date.now() -
        item.fecha >
        CACHE_TTL_MS
    ) {

        cache.delete(
            clave
        );

        return null;

    }


    return item.datos;

}


function guardarCache(
    clave,
    datos
) {

    cache.set(
        clave,
        {
            fecha:
                Date.now(),

            datos
        }
    );

}


/* =========================================================
   ERRORES
========================================================= */

function normalizarErrorApi(
    error,
    recurso
) {

    const status =
        error.response?.status;


    let mensaje =
        "No se pudo consultar la API oficial de PRONABEC.";


    if (
        status ===
        403
    ) {

        mensaje =
            "La API key de PRONABEC fue rechazada.";

    } else if (
        status ===
        404
    ) {

        mensaje =
            `El recurso ${recurso} no existe en la API de PRONABEC.`;

    } else if (
        status ===
        429
    ) {

        mensaje =
            "Se superó el límite temporal de consultas de PRONABEC.";

    } else if (
        error.code ===
        "ENOTFOUND"
    ) {

        mensaje =
            "El subdominio api.datosabiertos.pronabec.gob.pe no está resolviendo por DNS.";

    } else if (
        error.code ===
        "EAI_AGAIN"
    ) {

        mensaje =
            "El DNS de PRONABEC no respondió a tiempo.";

    } else if (
        error.code ===
        "ECONNABORTED"
    ) {

        mensaje =
            "La API oficial de PRONABEC tardó demasiado en responder.";

    } else if (
        error.message
    ) {

        mensaje =
            error.message;

    }


    const normalizado =
        crearErrorFuente(
            "API_PRONABEC_ERROR",
            mensaje
        );


    normalizado.status =
        status ||
        null;


    normalizado.codigoTecnico =
        error.code ||
        null;


    return normalizado;

}


function crearErrorFuente(
    codigo,
    mensaje
) {

    const error =
        new Error(
            mensaje
        );


    error.codigo =
        codigo;


    return error;

}


/* =========================================================
   TEXTO / HTML
========================================================= */

function normalizarTexto(
    texto
) {

    return String(
        texto ||
        ""
    )
        .trim()
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toUpperCase();

}


function limpiarHtml(
    html
) {

    return decodificarEntidades(
        String(
            html ||
            ""
        )
            .replace(
                /<br\s*\/?>/gi,
                " "
            )
            .replace(
                /<[^>]+>/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim()
    );

}


function decodificarEntidades(
    texto
) {

    return String(
        texto ||
        ""
    )
        .replace(
            /&amp;/gi,
            "&"
        )
        .replace(
            /&quot;/gi,
            '"'
        )
        .replace(
            /&#39;|&apos;/gi,
            "'"
        )
        .replace(
            /&lt;/gi,
            "<"
        )
        .replace(
            /&gt;/gi,
            ">"
        )
        .replace(
            /&nbsp;/gi,
            " "
        );

}


/* =========================================================
   EXPORTAR
========================================================= */

module.exports = {

    consultarRecurso,

    consultarPaginado,

    consultarFuenteOficial,

    consultarPaginadoOficial,

    consultarPublicacionOficial,

    extraerRegistros,

    normalizarTexto,

    /*
       Se exporta solo para pruebas/diagnóstico local.
    */
    descubrirDatasetEnGrupoPronabec

};
