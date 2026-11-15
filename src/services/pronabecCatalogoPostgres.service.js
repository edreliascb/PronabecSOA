/* =========================================================
   EDUPERÚ - CATÁLOGO PRONABEC EN POSTGRESQL

   Lee datasets previamente sincronizados por streaming.
   No descarga archivos externos durante una petición web.
========================================================= */

const { Pool } =
    require("pg");


let pool =
    null;


function esPostgres() {

    return String(
        process.env.DB_ENGINE ||
        ""
    )
        .trim()
        .toLowerCase() ===
        "postgres";

}


function obtenerUrl() {

    return (
        process.env.DATABASE_URL ||
        process.env.RENDER_DATABASE_URL ||
        ""
    );

}


function obtenerPool() {

    if (!esPostgres()) {
        return null;
    }


    const connectionString =
        obtenerUrl();


    if (!connectionString) {
        return null;
    }


    if (!pool) {

        pool =
            new Pool({
                connectionString,
                max:
                    3,
                idleTimeoutMillis:
                    10000,
                connectionTimeoutMillis:
                    5000,
                ssl:
                    connectionString.includes(
                        "localhost"
                    )
                        ? false
                        : {
                            rejectUnauthorized:
                                false
                        }
            });

    }


    return pool;

}



/* =========================================================
   EDUPERU_NORMALIZAR_FILAS_PRONABEC_V2
========================================================= */

function normalizarClave(
    valor
) {

    return String(
        valor ||
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
        .replace(
            /[^a-z0-9]+/g,
            ""
        );

}


function buscarCampo(
    fila,
    grupos
) {

    if (
        !fila ||
        typeof fila !==
            "object"
    ) {

        return null;

    }


    const entradas =
        Object.entries(
            fila
        )
            .filter(
                ([, valor]) =>
                    valor !==
                        null &&
                    valor !==
                        undefined &&
                    String(valor)
                        .trim() !==
                        ""
            )
            .map(
                (
                    [clave, valor]
                ) => ({
                    clave,
                    normalizada:
                        normalizarClave(
                            clave
                        ),
                    valor
                })
            );


    for (
        const grupo
        of grupos
    ) {

        const tokens =
            grupo.map(
                normalizarClave
            );


        const candidatos =
            entradas
                .filter(
                    item =>
                        tokens.every(
                            token =>
                                item.normalizada
                                    .includes(
                                        token
                                    )
                        )
                )
                .sort(
                    (a, b) => {

                        const aNombre =
                            a.normalizada
                                .includes(
                                    "nombre"
                                )
                                ? 1
                                : 0;

                        const bNombre =
                            b.normalizada
                                .includes(
                                    "nombre"
                                )
                                ? 1
                                : 0;


                        return (
                            bNombre -
                            aNombre
                        );

                    }
                );


        if (
            candidatos.length
        ) {

            return candidatos[0]
                .valor;

        }

    }


    return null;

}


function normalizarFila(
    recurso,
    fila
) {

    if (
        !fila ||
        typeof fila !==
            "object"
    ) {

        return fila;

    }


    const salida = {
        ...fila
    };


    if (
        recurso ===
        "ConvocatoriaCarreraVigentes"
    ) {

        salida.convocatoria =
            salida.convocatoria ||
            salida.CONVOCATORIA ||
            buscarCampo(
                fila,
                [
                    [
                        "nombre",
                        "convocatoria"
                    ],
                    [
                        "convocatoria"
                    ],
                    [
                        "nombre",
                        "beca"
                    ],
                    [
                        "beca"
                    ],
                    [
                        "programa"
                    ]
                ]
            ) ||
            "Convocatoria PRONABEC";


        salida.carrera =
            salida.carrera ||
            salida.CARRERA ||
            buscarCampo(
                fila,
                [
                    [
                        "nombre",
                        "carrera"
                    ],
                    [
                        "carrera"
                    ],
                    [
                        "programa",
                        "estudio"
                    ]
                ]
            ) ||
            "Oferta educativa nacional";


        salida.region =
            salida.region ||
            salida.REGION ||
            buscarCampo(
                fila,
                [
                    [
                        "departamento"
                    ],
                    [
                        "region"
                    ],
                    [
                        "sede"
                    ],
                    [
                        "ubicacion"
                    ]
                ]
            ) ||
            "Nacional";


        salida.sede =
            salida.sede ||
            salida.region;


        salida.estado =
            salida.estado ||
            salida.ESTADO ||
            buscarCampo(
                fila,
                [
                    [
                        "estado"
                    ],
                    [
                        "vigencia"
                    ]
                ]
            ) ||
            "Vigente";

    }


    return salida;

}


async function obtenerMetadata(
    recurso
) {

    const db =
        obtenerPool();


    if (!db) {
        return null;
    }


    const resultado =
        await db.query(
            `
            SELECT
                recurso,
                active_sync_id,
                total_rows,
                fuente_url,
                synced_at,
                status
            FROM pronabec_sync
            WHERE recurso = $1
            LIMIT 1
            `,
            [
                recurso
            ]
        );


    const fila =
        resultado.rows[0];


    if (
        !fila ||
        fila.status !==
            "COMPLETADO" ||
        !fila.active_sync_id
    ) {

        return null;

    }


    return fila;

}


function construirFiltro(
    parametros,
    valores
) {

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
                        "pagina",
                        "filas",
                        "sidx",
                        "sord",
                        "order"
                    ].includes(
                        String(clave)
                            .toLowerCase()
                    ) &&
                    valor !==
                        undefined &&
                    valor !==
                        null &&
                    String(valor)
                        .trim() !==
                        ""
            );


    if (
        filtros.length ===
        0
    ) {

        return "";

    }


    const condiciones =
        filtros.map(
            ([, valor]) => {

                valores.push(
                    `%${String(valor).trim()}%`
                );


                return (
                    `fila_json::text ILIKE $${valores.length}`
                );

            }
        );


    return (
        " AND " +
        condiciones.join(
            " AND "
        )
    );

}


async function consultarPaginado(
    recurso,
    pagina = 1,
    filas = 10,
    filtros = {}
) {

    const db =
        obtenerPool();


    if (!db) {
        return null;
    }


    const metadata =
        await obtenerMetadata(
            recurso
        );


    if (!metadata) {
        return null;
    }


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


    const valoresConteo = [
        recurso,
        metadata.active_sync_id
    ];


    const whereExtra =
        construirFiltro(
            filtros,
            valoresConteo
        );


    let total =
        Number(
            metadata.total_rows ||
            0
        );


    if (whereExtra) {

        const conteo =
            await db.query(
                `
                SELECT
                    COUNT(*)::bigint AS total
                FROM pronabec_catalogo
                WHERE
                    recurso = $1
                    AND sync_id = $2
                    ${whereExtra}
                `,
                valoresConteo
            );


        total =
            Number(
                conteo.rows[0]
                    ?.total ||
                0
            );

    }


    const offset =
        (pagina - 1) *
        filas;


    const valores = [
        recurso,
        metadata.active_sync_id
    ];


    const filtroLista =
        construirFiltro(
            filtros,
            valores
        );


    valores.push(
        filas
    );


    const limitIndex =
        valores.length;


    valores.push(
        offset
    );


    const offsetIndex =
        valores.length;


    const resultado =
        await db.query(
            `
            SELECT
                fila_json
            FROM pronabec_catalogo
            WHERE
                recurso = $1
                AND sync_id = $2
                ${filtroLista}
            ORDER BY ordinal
            LIMIT $${limitIndex}
            OFFSET $${offsetIndex}
            `,
            valores
        );


    return {

        modo:
            "POSTGRES_SINCRONIZADO",

        fuente:
            "PRONABEC - Datos Abiertos sincronizados en PostgreSQL",

        fuenteOficial:
            true,

        disponible:
            true,

        recurso,

        urlFuente:
            metadata.fuente_url,

        total,

        pagina,

        filas,

        datos:
            resultado.rows
                .map(
                    fila =>
                        normalizarFila(
                            recurso,
                            fila.fila_json
                        )
                ),

        fechaConsulta:
            new Date()
                .toISOString(),

        fechaSincronizacion:
            metadata.synced_at

    };

}


async function consultarCompatible(
    recurso,
    parametros = {}
) {

    const pagina =
        Number(
            parametros.page ??
            parametros.pagina ??
            1
        ) ||
        1;


    const filas =
        Number(
            parametros.rows ??
            parametros.filas ??
            10
        ) ||
        10;


    const resultado =
        await consultarPaginado(
            recurso,
            pagina,
            filas,
            parametros
        );


    if (!resultado) {
        return null;
    }


    return {

        ...resultado,

        records:
            resultado.datos,

        rows:
            resultado.datos,

        data:
            resultado.datos

    };

}


async function obtenerResumen() {

    const db =
        obtenerPool();


    if (!db) {
        return [];
    }


    const resultado =
        await db.query(
            `
            SELECT
                recurso,
                total_rows,
                fuente_url,
                synced_at,
                status
            FROM pronabec_sync
            ORDER BY recurso
            `
        );


    return resultado.rows;

}


module.exports = {

    consultarPaginado,

    consultarCompatible,

    obtenerResumen

};
