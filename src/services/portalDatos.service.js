/* =========================================================
   EDUPERÚ - DATOS NORMALIZADOS PARA TODAS LAS PESTAÑAS
========================================================= */

const { Pool } =
    require("pg");


let pool =
    null;


function obtenerPool() {

    if (pool) {
        return pool;
    }


    const connectionString =
        process.env.DATABASE_URL ||
        "";


    if (!connectionString) {

        throw new Error(
            "DATABASE_URL no está configurada."
        );

    }


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


    return pool;

}


function entero(
    valor,
    defecto,
    minimo,
    maximo
) {

    const n =
        Number(
            valor
        );


    if (
        !Number.isFinite(
            n
        )
    ) {

        return defecto;

    }


    return Math.max(
        minimo,
        Math.min(
            maximo,
            Math.trunc(
                n
            )
        )
    );

}


async function obtenerBuildActivo(
    recurso
) {

    const db =
        obtenerPool();


    const r =
        await db.query(
            `
            SELECT
                active_build_id,
                total_rows,
                built_at
            FROM pronabec_portal_builds
            WHERE
                recurso = $1
                AND status = 'COMPLETADO'
            LIMIT 1
            `,
            [
                recurso
            ]
        );


    return r.rows[0] ||
        null;

}


function filtrosSql(
    query,
    valores,
    columnas = []
) {

    const condiciones =
        [];


    const q =
        String(
            query.q ||
            query.buscar ||
            query.search ||
            ""
        )
            .trim();


    if (q) {

        valores.push(
            `%${q}%`
        );


        const idx =
            valores.length;


        condiciones.push(
            `(
                titulo ILIKE $${idx}
                OR convocatoria ILIKE $${idx}
                OR carrera ILIKE $${idx}
                OR institucion ILIKE $${idx}
                OR region ILIKE $${idx}
                OR sede ILIKE $${idx}
                OR convenio ILIKE $${idx}
                OR descripcion ILIKE $${idx}
            )`
        );

    }


    for (
        const columna
        of columnas
    ) {

        const valor =
            String(
                query[columna] ||
                ""
            )
                .trim();


        if (!valor) {
            continue;
        }


        valores.push(
            `%${valor}%`
        );


        condiciones.push(
            `${columna} ILIKE $${valores.length}`
        );

    }


    return condiciones.length
        ? " AND " +
          condiciones.join(
              " AND "
          )
        : "";

}


async function listarRegistros(
    recurso,
    query = {},
    opciones = {}
) {

    const db =
        obtenerPool();


    const build =
        await obtenerBuildActivo(
            recurso
        );


    if (!build) {

        return {

            recurso,

            total:
                0,

            pagina:
                1,

            filas:
                [],

            datos:
                []

        };

    }


    const pagina =
        entero(
            query.page ??
            query.pagina,
            1,
            1,
            1000000
        );


    const rows =
        entero(
            query.rows ??
            query.limit ??
            query.filas,
            opciones.rowsDefecto ||
            100,
            1,
            opciones.rowsMax ||
            5000
        );


    const valoresBase = [
        recurso,
        build.active_build_id
    ];


    const extra =
        filtrosSql(
            query,
            valoresBase,
            opciones.filtros ||
            []
        );


    let total =
        Number(
            build.total_rows ||
            0
        );


    if (extra) {

        const count =
            await db.query(
                `
                SELECT
                    COUNT(*)::bigint AS total
                FROM pronabec_portal
                WHERE
                    recurso = $1
                    AND build_id = $2
                    ${extra}
                `,
                valoresBase
            );


        total =
            Number(
                count.rows[0]
                    ?.total ||
                0
            );

    }


    const valores =
        [
            recurso,
            build.active_build_id
        ];


    const extraLista =
        filtrosSql(
            query,
            valores,
            opciones.filtros ||
            []
        );


    valores.push(
        rows
    );

    const limitIndex =
        valores.length;


    valores.push(
        (
            pagina -
            1
        ) *
        rows
    );

    const offsetIndex =
        valores.length;


    const result =
        await db.query(
            `
            SELECT
                ordinal,
                titulo,
                convocatoria,
                carrera,
                institucion,
                region,
                sede,
                estado,
                modalidad,
                convenio,
                tipo_convenio,
                descripcion
            FROM pronabec_portal
            WHERE
                recurso = $1
                AND build_id = $2
                ${extraLista}
            ORDER BY ordinal
            LIMIT $${limitIndex}
            OFFSET $${offsetIndex}
            `,
            valores
        );


    const datos =
        result.rows.map(
            fila => ({

                id:
                    `${recurso}-${fila.ordinal}`,

                fuente:
                    "PRONABEC - PostgreSQL",

                modo:
                    "POSTGRES_SINCRONIZADO",

                ...fila

            })
        );


    return {

        recurso,

        modo:
            "POSTGRES_SINCRONIZADO",

        fuente:
            "PRONABEC - Datos sincronizados en PostgreSQL",

        disponible:
            true,

        total,

        pagina,

        filas:
            rows,

        totalPaginas:
            Math.max(
                1,
                Math.ceil(
                    total /
                    rows
                )
            ),

        data:
            datos,

        rows:
            datos,

        records:
            datos,

        datos

    };

}


async function listarCarreras(
    query = {}
) {

    const db =
        obtenerPool();


    const build =
        await obtenerBuildActivo(
            "CarrerasElegiblesNacional"
        );


    if (!build) {

        return {

            total:
                0,

            datos:
                []

        };

    }


    const q =
        String(
            query.q ||
            query.buscar ||
            ""
        )
            .trim();


    const valores = [
        build.active_build_id
    ];


    let filtro =
        " AND carrera IS NOT NULL AND BTRIM(carrera) <> '' ";


    if (q) {

        valores.push(
            `%${q}%`
        );


        filtro +=
            ` AND carrera ILIKE $${valores.length} `;

    }


    const result =
        await db.query(
            `
            SELECT
                carrera AS nombre,
                COUNT(*)::bigint AS oportunidades,
                COUNT(
                    DISTINCT NULLIF(
                        BTRIM(institucion),
                        ''
                    )
                )::bigint AS instituciones,
                COUNT(
                    DISTINCT NULLIF(
                        BTRIM(region),
                        ''
                    )
                )::bigint AS regiones
            FROM pronabec_portal
            WHERE
                recurso = 'CarrerasElegiblesNacional'
                AND build_id = $1
                ${filtro}
            GROUP BY carrera
            ORDER BY carrera
            `,
            valores
        );


    const datos =
        result.rows.map(
            fila => ({

                nombre:
                    fila.nombre,

                carrera:
                    fila.nombre,

                oportunidades:
                    Number(
                        fila.oportunidades ||
                        0
                    ),

                instituciones:
                    Number(
                        fila.instituciones ||
                        0
                    ),

                regiones:
                    Number(
                        fila.regiones ||
                        0
                    )

            })
        );


    return {

        modo:
            "POSTGRES_SINCRONIZADO",

        total:
            datos.length,

        datos

    };

}


async function listarInstituciones(
    query = {}
) {

    const db =
        obtenerPool();


    const buildCarreras =
        await obtenerBuildActivo(
            "CarrerasElegiblesNacional"
        );


    const buildConvenios =
        await obtenerBuildActivo(
            "Convenio"
        );


    const partes =
        [];

    const valores =
        [];


    if (buildCarreras) {

        valores.push(
            buildCarreras.active_build_id
        );


        partes.push(
            `
            SELECT
                institucion,
                NULLIF(
                    BTRIM(region),
                    ''
                ) AS ubicacion,
                'Institución educativa' AS tipo,
                'Carreras elegibles' AS convenio
            FROM pronabec_portal
            WHERE
                recurso = 'CarrerasElegiblesNacional'
                AND build_id = $${valores.length}
                AND institucion IS NOT NULL
                AND BTRIM(institucion) <> ''
            `
        );

    }


    if (buildConvenios) {

        valores.push(
            buildConvenios.active_build_id
        );


        partes.push(
            `
            SELECT
                institucion,
                COALESCE(
                    NULLIF(
                        BTRIM(region),
                        ''
                    ),
                    NULLIF(
                        BTRIM(sede),
                        ''
                    )
                ) AS ubicacion,
                COALESCE(
                    NULLIF(
                        BTRIM(tipo_convenio),
                        ''
                    ),
                    'Entidad con convenio'
                ) AS tipo,
                COALESCE(
                    NULLIF(
                        BTRIM(convenio),
                        ''
                    ),
                    'Convenio PRONABEC'
                ) AS convenio
            FROM pronabec_portal
            WHERE
                recurso = 'Convenio'
                AND build_id = $${valores.length}
                AND institucion IS NOT NULL
                AND BTRIM(institucion) <> ''
            `
        );

    }


    if (!partes.length) {

        return {

            modo:
                "POSTGRES_SINCRONIZADO",

            total:
                0,

            datos:
                []

        };

    }


    let filtro =
        "";


    const q =
        String(
            query.q ||
            query.buscar ||
            ""
        )
            .trim();


    if (q) {

        valores.push(
            `%${q}%`
        );


        filtro =
            `WHERE
                institucion ILIKE $${valores.length}
                OR ubicacion ILIKE $${valores.length}
                OR tipo ILIKE $${valores.length}`;

    }


    const result =
        await db.query(
            `
            WITH base AS (
                ${partes.join(
                    "\nUNION ALL\n"
                )}
            )
            SELECT
                institucion AS nombre,
                MIN(
                    COALESCE(
                        ubicacion,
                        'No especificada'
                    )
                ) AS ubicacion,
                MIN(
                    COALESCE(
                        tipo,
                        'Institución educativa'
                    )
                ) AS tipo,
                MIN(
                    COALESCE(
                        convenio,
                        'PRONABEC'
                    )
                ) AS convenio,
                COUNT(*)::bigint AS registros
            FROM base
            ${filtro}
            GROUP BY institucion
            ORDER BY institucion
            `,
            valores
        );


    const datos =
        result.rows.map(
            fila => ({

                nombre:
                    fila.nombre,

                institucion:
                    fila.nombre,

                ubicacion:
                    fila.ubicacion,

                region:
                    fila.ubicacion,

                tipo:
                    fila.tipo,

                convenio:
                    fila.convenio,

                estado:
                    "Disponible",

                registros:
                    Number(
                        fila.registros ||
                        0
                    ),

                fuente:
                    "PRONABEC - PostgreSQL"

            })
        );


    return {

        modo:
            "POSTGRES_SINCRONIZADO",

        total:
            datos.length,

        datos

    };

}


async function resumen() {

    const db =
        obtenerPool();


    const result =
        await db.query(
            `
            SELECT
                recurso,
                total_rows,
                built_at,
                status
            FROM pronabec_portal_builds
            WHERE status = 'COMPLETADO'
            ORDER BY recurso
            `
        );


    return result.rows.map(
        fila => ({

            recurso:
                fila.recurso,

            total_rows:
                Number(
                    fila.total_rows ||
                    0
                ),

            built_at:
                fila.built_at,

            status:
                fila.status

        })
    );

}


async function estadisticas() {

    const resumenFilas =
        await resumen();


    const mapa =
        Object.fromEntries(
            resumenFilas.map(
                fila => [
                    fila.recurso,
                    fila.total_rows
                ]
            )
        );


    const carreras =
        await listarCarreras();


    const regiones = [
        "Amazonas",
        "Áncash",
        "Apurímac",
        "Arequipa",
        "Ayacucho",
        "Cajamarca",
        "Callao",
        "Cusco",
        "Huancavelica",
        "Huánuco",
        "Ica",
        "Junín",
        "La Libertad",
        "Lambayeque",
        "Lima",
        "Loreto",
        "Madre de Dios",
        "Moquegua",
        "Pasco",
        "Piura",
        "Puno",
        "San Martín",
        "Tacna",
        "Tumbes",
        "Ucayali"
    ];


    return {

        resumen: {

            totalConvocatorias:
                mapa.ConvocatoriaCarreraVigentes ||
                0,

            totalCarreras:
                mapa.CarrerasElegiblesNacional ||
                0,

            totalConvenios:
                mapa.Convenio ||
                0,

            totalPostulaciones:
                mapa.PostulacionesVigentes ||
                0,

            totalDocumentos:
                mapa.DocumentosSolicitadosABecarios ||
                0,

            totalRegiones:
                25

        },

        catalogos: {

            carreras:
                carreras.datos.map(
                    item =>
                        item.nombre
                ),

            regiones

        },

        fuentes: {

            convocatorias:
                "POSTGRES_SINCRONIZADO",

            carreras:
                "POSTGRES_SINCRONIZADO",

            convenios:
                "POSTGRES_SINCRONIZADO",

            postulaciones:
                "POSTGRES_SINCRONIZADO",

            instituciones:
                "POSTGRES_SINCRONIZADO"

        }

    };

}


async function consultaGeneral() {

    const [
        oportunidades,
        postulaciones,
        convenios
    ] =
        await Promise.all([

            listarRegistros(
                "CarrerasElegiblesNacional",
                {
                    page:
                        1,
                    rows:
                        3000
                },
                {
                    rowsDefecto:
                        3000,
                    rowsMax:
                        3000
                }
            ),

            listarRegistros(
                "PostulacionesVigentes",
                {
                    page:
                        1,
                    rows:
                        500
                },
                {
                    rowsDefecto:
                        500,
                    rowsMax:
                        500
                }
            ),

            listarRegistros(
                "Convenio",
                {
                    page:
                        1,
                    rows:
                        500
                },
                {
                    rowsDefecto:
                        500,
                    rowsMax:
                        500
                }
            )

        ]);


    return {

        convocatorias: {

            modo:
                "POSTGRES_SINCRONIZADO",

            fuente:
                "PRONABEC - PostgreSQL",

            disponible:
                true,

            total:
                oportunidades.total,

            datos:
                oportunidades

        },

        postulaciones: {

            modo:
                "POSTGRES_SINCRONIZADO",

            fuente:
                "PRONABEC - PostgreSQL",

            disponible:
                true,

            total:
                postulaciones.total,

            datos:
                postulaciones

        },

        convenios: {

            modo:
                "POSTGRES_SINCRONIZADO",

            fuente:
                "PRONABEC - PostgreSQL",

            disponible:
                true,

            total:
                convenios.total,

            datos:
                convenios

        },

        documentos: {

            modo:
                "NO_DISPONIBLE",

            fuente:
                "PRONABEC",

            disponible:
                false,

            total:
                0,

            datos:
                []

        }

    };

}


module.exports = {

    listarRegistros,

    listarCarreras,

    listarInstituciones,

    resumen,

    estadisticas,

    consultaGeneral

};
