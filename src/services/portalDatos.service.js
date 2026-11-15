/* =========================================================
   EDUPERÚ - PORTAL DATOS V4 SIN DUPLICAR POSTGRESQL

   Usa directamente:
   - pronabec_sync
   - pronabec_catalogo

   NO crea una segunda copia de los 333k+ registros.
========================================================= */

const { Pool } =
    require("pg");


let pool =
    null;


const mappingCache =
    new Map();


function db() {

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


function limpiar(
    valor
) {

    return String(
        valor ??
        ""
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


function tokenizar(
    valor
) {

    return limpiar(
        valor
    )
        .replace(
            /([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g,
            "$1 $2"
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
            " "
        )
        .trim()
        .split(
            /\s+/
        )
        .filter(
            Boolean
        );

}


function escapeSqlString(
    valor
) {

    return String(
        valor
    )
        .replace(
            /'/g,
            "''"
        );

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


async function syncActivo(
    recurso
) {

    const result =
        await db()
            .query(
                `
                SELECT
                    recurso,
                    active_sync_id,
                    total_rows,
                    fuente_url,
                    synced_at,
                    status
                FROM pronabec_sync
                WHERE
                    recurso = $1
                    AND status = 'COMPLETADO'
                    AND active_sync_id IS NOT NULL
                LIMIT 1
                `,
                [
                    recurso
                ]
            );


    return result.rows[0] ||
        null;

}


const gruposCampos = {

    titulo: [
        ["nombre", "convocatoria"],
        ["convocatoria"],
        ["nombre", "carrera"],
        ["carrera"],
        ["nombre", "convenio"],
        ["convenio"],
        ["nombre", "institucion"],
        ["institucion"]
    ],

    convocatoria: [
        ["nombre", "convocatoria"],
        ["convocatoria"],
        ["nombre", "beca"],
        ["beca"],
        ["programa"]
    ],

    carrera: [
        ["nombre", "carrera"],
        ["carrera"],
        ["programa", "estudio"],
        ["programa", "academico"],
        ["especialidad"]
    ],

    institucion: [
        ["nombre", "institucion"],
        ["institucion"],
        ["nombre", "ies"],
        ["universidad"],
        ["instituto"],
        ["entidad"],
        ["organizacion"],
        ["razon", "social"]
    ],

    region: [
        ["departamento"],
        ["region"]
    ],

    sede: [
        ["sede"],
        ["campus"],
        ["provincia"],
        ["distrito"],
        ["ubicacion"]
    ],

    estado: [
        ["estado"],
        ["vigencia"],
        ["situacion"]
    ],

    modalidad: [
        ["modalidad"],
        ["tipo", "estudio"]
    ],

    convenio: [
        ["nombre", "convenio"],
        ["convenio"],
        ["objeto", "convenio"],
        ["objeto"]
    ],

    tipo_convenio: [
        ["tipo", "convenio"],
        ["tipo", "entidad"]
    ],

    descripcion: [
        ["descripcion"],
        ["detalle"],
        ["observacion"],
        ["beneficio"]
    ]

};


function elegirClave(
    claves,
    grupos
) {

    const candidatos =
        claves.map(
            clave => ({
                clave,
                tokens:
                    tokenizar(
                        clave
                    )
            })
        );


    for (
        const grupo
        of grupos
    ) {

        const buscados =
            grupo.map(
                token =>
                    tokenizar(
                        token
                    )[0]
            )
            .filter(
                Boolean
            );


        const matches =
            candidatos
                .filter(
                    item =>
                        buscados.every(
                            token =>
                                item.tokens.includes(
                                    token
                                )
                        )
                )
                .sort(
                    (a, b) => {

                        const score =
                            item => {

                                let s =
                                    0;


                                if (
                                    item.tokens.includes(
                                        "nombre"
                                    )
                                ) {
                                    s += 4;
                                }


                                s -=
                                    item.tokens.length *
                                    0.1;


                                return s;

                            };


                        return (
                            score(b) -
                            score(a)
                        );

                    }
                );


        if (
            matches.length
        ) {

            return matches[0]
                .clave;

        }

    }


    return null;

}


async function mapping(
    recurso
) {

    const sync =
        await syncActivo(
            recurso
        );


    if (!sync) {

        return {
            sync:
                null,
            campos:
                {}
        };

    }


    const cacheKey =
        `${recurso}:${sync.active_sync_id}`;


    if (
        mappingCache.has(
            cacheKey
        )
    ) {

        return {
            sync,
            campos:
                mappingCache.get(
                    cacheKey
                )
        };

    }


    /*
       Solo inspeccionamos hasta 200 filas para descubrir nombres
       reales de columnas. Esto consume muy poco almacenamiento/RAM.
    */
    const result =
        await db()
            .query(
                `
                SELECT DISTINCT
                    k.key
                FROM
                (
                    SELECT
                        fila_json
                    FROM pronabec_catalogo
                    WHERE
                        recurso = $1
                        AND sync_id = $2
                    ORDER BY ordinal
                    LIMIT 200
                ) muestra
                CROSS JOIN LATERAL
                    jsonb_object_keys(
                        muestra.fila_json
                    ) AS k(key)
                `,
                [
                    recurso,
                    sync.active_sync_id
                ]
            );


    const claves =
        result.rows
            .map(
                fila =>
                    fila.key
            )
            .filter(
                Boolean
            );


    const campos =
        {};


    for (
        const [
            nombre,
            grupos
        ]
        of Object.entries(
            gruposCampos
        )
    ) {

        campos[nombre] =
            elegirClave(
                claves,
                grupos
            );

    }


    mappingCache.set(
        cacheKey,
        campos
    );


    console.log(
        `[PortalDatos V4] ${recurso}:`,
        campos
    );


    return {
        sync,
        campos
    };

}


function expr(
    campos,
    nombre,
    alias = "pc"
) {

    const clave =
        campos[
            nombre
        ];


    if (!clave) {

        return "NULL::text";

    }


    return `NULLIF(BTRIM(${alias}.fila_json ->> '${escapeSqlString(clave)}'), '')`;

}


function expresiones(
    campos,
    alias = "pc"
) {

    return {

        titulo:
            expr(
                campos,
                "titulo",
                alias
            ),

        convocatoria:
            expr(
                campos,
                "convocatoria",
                alias
            ),

        carrera:
            expr(
                campos,
                "carrera",
                alias
            ),

        institucion:
            expr(
                campos,
                "institucion",
                alias
            ),

        region:
            expr(
                campos,
                "region",
                alias
            ),

        sede:
            expr(
                campos,
                "sede",
                alias
            ),

        estado:
            expr(
                campos,
                "estado",
                alias
            ),

        modalidad:
            expr(
                campos,
                "modalidad",
                alias
            ),

        convenio:
            expr(
                campos,
                "convenio",
                alias
            ),

        tipo_convenio:
            expr(
                campos,
                "tipo_convenio",
                alias
            ),

        descripcion:
            expr(
                campos,
                "descripcion",
                alias
            )

    };

}


function filtroSql(
    query,
    valores,
    e
) {

    const condiciones =
        [];


    const q =
        limpiar(
            query.q ||
            query.buscar ||
            query.search ||
            ""
        );


    if (q) {

        valores.push(
            `%${q}%`
        );


        const i =
            valores.length;


        const campos =
            [
                e.titulo,
                e.convocatoria,
                e.carrera,
                e.institucion,
                e.region,
                e.sede,
                e.convenio,
                e.descripcion
            ]
                .filter(
                    item =>
                        !item.startsWith(
                            "NULL::"
                        )
                );


        if (
            campos.length
        ) {

            condiciones.push(
                `(${campos
                    .map(
                        item =>
                            `${item} ILIKE $${i}`
                    )
                    .join(
                        " OR "
                    )})`
            );

        }

    }


    for (
        const nombre
        of [
            "carrera",
            "region",
            "estado",
            "institucion",
            "convocatoria"
        ]
    ) {

        const valor =
            limpiar(
                query[nombre]
            );


        if (!valor) {
            continue;
        }


        const ex =
            e[nombre];


        if (
            !ex ||
            ex.startsWith(
                "NULL::"
            )
        ) {
            continue;
        }


        valores.push(
            `%${valor}%`
        );


        condiciones.push(
            `${ex} ILIKE $${valores.length}`
        );

    }


    return condiciones.length
        ? " AND " +
          condiciones.join(
              " AND "
          )
        : "";

}


function normalizarSalida(
    recurso,
    fila
) {

    let titulo =
        limpiar(
            fila.titulo
        );


    const convocatoria =
        limpiar(
            fila.convocatoria
        );

    const carrera =
        limpiar(
            fila.carrera
        );

    const institucion =
        limpiar(
            fila.institucion
        );

    const region =
        limpiar(
            fila.region
        );

    const sede =
        limpiar(
            fila.sede
        );

    const convenio =
        limpiar(
            fila.convenio
        );


    if (
        recurso ===
        "CarrerasElegiblesNacional"
    ) {

        titulo =
            carrera ||
            titulo ||
            "Carrera elegible";

    } else if (
        recurso ===
        "Convenio"
    ) {

        titulo =
            convenio ||
            institucion ||
            titulo ||
            "Convenio PRONABEC";

    } else if (
        recurso ===
        "PostulacionesVigentes"
    ) {

        titulo =
            carrera ||
            convocatoria ||
            titulo ||
            "Postulación vigente";

    } else {

        titulo =
            convocatoria ||
            titulo ||
            "Convocatoria PRONABEC";

    }


    return {

        id:
            `${recurso}-${fila.ordinal}`,

        ordinal:
            Number(
                fila.ordinal ||
                0
            ),

        titulo,

        convocatoria,

        carrera,

        institucion,

        region:
            region ||
            sede ||
            "Nacional",

        sede:
            sede ||
            region ||
            "Nacional",

        estado:
            limpiar(
                fila.estado
            ) ||
            (
                recurso ===
                "ConvocatoriaCarreraVigentes"
                    ? "Vigente"
                    : "Disponible"
            ),

        modalidad:
            limpiar(
                fila.modalidad
            ),

        convenio,

        tipo_convenio:
            limpiar(
                fila.tipo_convenio
            ),

        descripcion:
            limpiar(
                fila.descripcion
            ),

        fuente:
            "PRONABEC - PostgreSQL",

        modo:
            "POSTGRES_SINCRONIZADO"

    };

}


async function listarRegistros(
    recurso,
    query = {},
    opciones = {}
) {

    const info =
        await mapping(
            recurso
        );


    if (!info.sync) {

        return {

            recurso,

            modo:
                "POSTGRES_SINCRONIZADO",

            disponible:
                false,

            total:
                0,

            pagina:
                1,

            filas:
                0,

            totalPaginas:
                1,

            datos:
                [],

            data:
                [],

            rows:
                [],

            records:
                []

        };

    }


    const pagina =
        entero(
            query.page ??
            query.pagina,
            1,
            1,
            10000000
        );


    const rows =
        entero(
            query.rows ??
            query.limit ??
            query.filas,
            opciones.rowsDefecto ||
            50,
            1,
            opciones.rowsMax ||
            500
        );


    const e =
        expresiones(
            info.campos
        );


    const valoresConteo = [
        recurso,
        info.sync.active_sync_id
    ];


    const extraConteo =
        filtroSql(
            query,
            valoresConteo,
            e
        );


    let total =
        Number(
            info.sync.total_rows ||
            0
        );


    if (extraConteo) {

        const count =
            await db()
                .query(
                    `
                    SELECT
                        COUNT(*)::bigint AS total
                    FROM pronabec_catalogo pc
                    WHERE
                        pc.recurso = $1
                        AND pc.sync_id = $2
                        ${extraConteo}
                    `,
                    valoresConteo
                );


        total =
            Number(
                count.rows[0]
                    ?.total ||
                0
            );

    }


    const valores = [
        recurso,
        info.sync.active_sync_id
    ];


    const extra =
        filtroSql(
            query,
            valores,
            e
        );


    valores.push(
        rows
    );

    const iLimit =
        valores.length;


    valores.push(
        (
            pagina -
            1
        ) *
        rows
    );

    const iOffset =
        valores.length;


    const result =
        await db()
            .query(
                `
                SELECT
                    pc.ordinal,

                    COALESCE(
                        ${e.titulo},
                        ${e.convocatoria},
                        ${e.carrera},
                        ${e.convenio},
                        ${e.institucion}
                    ) AS titulo,

                    ${e.convocatoria} AS convocatoria,
                    ${e.carrera} AS carrera,
                    ${e.institucion} AS institucion,
                    ${e.region} AS region,
                    ${e.sede} AS sede,
                    ${e.estado} AS estado,
                    ${e.modalidad} AS modalidad,
                    ${e.convenio} AS convenio,
                    ${e.tipo_convenio} AS tipo_convenio,
                    ${e.descripcion} AS descripcion

                FROM pronabec_catalogo pc

                WHERE
                    pc.recurso = $1
                    AND pc.sync_id = $2
                    ${extra}

                ORDER BY pc.ordinal

                LIMIT $${iLimit}
                OFFSET $${iOffset}
                `,
                valores
            );


    const datos =
        result.rows.map(
            fila =>
                normalizarSalida(
                    recurso,
                    fila
                )
        );


    return {

        recurso,

        modo:
            "POSTGRES_SINCRONIZADO",

        fuente:
            "PRONABEC - PostgreSQL",

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

        fechaSincronizacion:
            info.sync.synced_at,

        datos,

        data:
            datos,

        rows:
            datos,

        records:
            datos

    };

}


async function listarCarreras(
    query = {}
) {

    const info =
        await mapping(
            "CarrerasElegiblesNacional"
        );


    if (!info.sync) {

        return {
            modo:
                "POSTGRES_SINCRONIZADO",
            total:
                0,
            totalRegistros:
                0,
            datos:
                []
        };

    }


    const e =
        expresiones(
            info.campos
        );


    if (
        e.carrera.startsWith(
            "NULL::"
        )
    ) {

        return {
            modo:
                "POSTGRES_SINCRONIZADO",
            total:
                0,
            totalRegistros:
                Number(
                    info.sync.total_rows ||
                    0
                ),
            datos:
                []
        };

    }


    const valores = [
        "CarrerasElegiblesNacional",
        info.sync.active_sync_id
    ];


    let filtro =
        "";


    const q =
        limpiar(
            query.q ||
            query.buscar
        );


    if (q) {

        valores.push(
            `%${q}%`
        );


        filtro =
            ` AND ${e.carrera} ILIKE $${valores.length} `;

    }


    const result =
        await db()
            .query(
                `
                SELECT
                    ${e.carrera} AS nombre,

                    COUNT(*)::bigint AS oportunidades,

                    (
                        ARRAY_AGG(
                            DISTINCT ${e.institucion}
                        )
                        FILTER (
                            WHERE ${e.institucion} IS NOT NULL
                        )
                    )[1:8] AS instituciones_lista,

                    (
                        ARRAY_AGG(
                            DISTINCT COALESCE(
                                ${e.region},
                                ${e.sede}
                            )
                        )
                        FILTER (
                            WHERE COALESCE(
                                ${e.region},
                                ${e.sede}
                            ) IS NOT NULL
                        )
                    )[1:8] AS regiones_lista,

                    (
                        ARRAY_AGG(
                            DISTINCT ${e.convocatoria}
                        )
                        FILTER (
                            WHERE ${e.convocatoria} IS NOT NULL
                        )
                    )[1:8] AS convocatorias_lista

                FROM pronabec_catalogo pc

                WHERE
                    pc.recurso = $1
                    AND pc.sync_id = $2
                    AND ${e.carrera} IS NOT NULL
                    ${filtro}

                GROUP BY
                    ${e.carrera}

                ORDER BY
                    ${e.carrera}
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

                registros:
                    Number(
                        fila.oportunidades ||
                        0
                    ),

                institucionesLista:
                    fila.instituciones_lista ||
                    [],

                regionesLista:
                    fila.regiones_lista ||
                    [],

                convocatoriasLista:
                    fila.convocatorias_lista ||
                    []

            })
        );


    return {

        modo:
            "POSTGRES_SINCRONIZADO",

        fuente:
            "PRONABEC - PostgreSQL",

        total:
            datos.length,

        totalRegistros:
            Number(
                info.sync.total_rows ||
                0
            ),

        datos

    };

}


async function institucionesDe(
    recurso
) {

    const info =
        await mapping(
            recurso
        );


    if (!info.sync) {
        return [];
    }


    const e =
        expresiones(
            info.campos
        );


    if (
        e.institucion.startsWith(
            "NULL::"
        )
    ) {

        return [];

    }


    const result =
        await db()
            .query(
                `
                SELECT
                    ${e.institucion} AS nombre,

                    MIN(
                        COALESCE(
                            ${e.region},
                            ${e.sede}
                        )
                    ) AS ubicacion,

                    COUNT(*)::bigint AS registros

                FROM pronabec_catalogo pc

                WHERE
                    pc.recurso = $1
                    AND pc.sync_id = $2
                    AND ${e.institucion} IS NOT NULL

                GROUP BY
                    ${e.institucion}

                ORDER BY
                    ${e.institucion}
                `,
                [
                    recurso,
                    info.sync.active_sync_id
                ]
            );


    return result.rows;

}


async function listarInstituciones(
    query = {}
) {

    const [
        carreras,
        convenios
    ] =
        await Promise.all([
            institucionesDe(
                "CarrerasElegiblesNacional"
            ),
            institucionesDe(
                "Convenio"
            )
        ]);


    const mapa =
        new Map();


    for (
        const fila
        of [
            ...carreras,
            ...convenios
        ]
    ) {

        const nombre =
            limpiar(
                fila.nombre
            );


        if (!nombre) {
            continue;
        }


        const id =
            nombre
                .toLowerCase();


        const actual =
            mapa.get(
                id
            ) ||
            {
                nombre,
                institucion:
                    nombre,
                ubicacion:
                    limpiar(
                        fila.ubicacion
                    ) ||
                    "No especificada",
                region:
                    limpiar(
                        fila.ubicacion
                    ) ||
                    "No especificada",
                tipo:
                    "Institución educativa",
                convenio:
                    "PRONABEC",
                estado:
                    "Disponible",
                registros:
                    0,
                fuente:
                    "PRONABEC - PostgreSQL"
            };


        actual.registros +=
            Number(
                fila.registros ||
                0
            );


        mapa.set(
            id,
            actual
        );

    }


    let datos =
        Array.from(
            mapa.values()
        );


    const q =
        limpiar(
            query.q ||
            query.buscar
        )
            .toLowerCase();


    if (q) {

        datos =
            datos.filter(
                item =>
                    [
                        item.nombre,
                        item.ubicacion,
                        item.tipo
                    ]
                        .join(
                            " "
                        )
                        .toLowerCase()
                        .includes(
                            q
                        )
            );

    }


    datos.sort(
        (
            a,
            b
        ) =>
            a.nombre.localeCompare(
                b.nombre,
                "es"
            )
    );


    return {

        modo:
            "POSTGRES_SINCRONIZADO",

        fuente:
            "PRONABEC - PostgreSQL",

        total:
            datos.length,

        datos

    };

}


async function listarTerritorio() {

    const info =
        await mapping(
            "CarrerasElegiblesNacional"
        );


    if (!info.sync) {

        return {
            modo:
                "POSTGRES_SINCRONIZADO",
            total:
                0,
            totalRegistros:
                0,
            datos:
                []
        };

    }


    const e =
        expresiones(
            info.campos
        );


    if (
        e.carrera.startsWith(
            "NULL::"
        )
    ) {

        return {
            modo:
                "POSTGRES_SINCRONIZADO",
            total:
                0,
            totalRegistros:
                Number(
                    info.sync.total_rows ||
                    0
                ),
            datos:
                []
        };

    }


    const ubicacion =
        `COALESCE(${e.region}, ${e.sede}, 'Nacional')`;


    const result =
        await db()
            .query(
                `
                SELECT
                    ${ubicacion} AS region,

                    ${e.carrera} AS carrera,

                    MIN(
                        ${e.institucion}
                    ) AS institucion,

                    MIN(
                        ${e.convocatoria}
                    ) AS convocatoria,

                    COUNT(*)::bigint AS oportunidades

                FROM pronabec_catalogo pc

                WHERE
                    pc.recurso = $1
                    AND pc.sync_id = $2
                    AND ${e.carrera} IS NOT NULL

                GROUP BY
                    ${ubicacion},
                    ${e.carrera}

                ORDER BY
                    region,
                    carrera
                `,
                [
                    "CarrerasElegiblesNacional",
                    info.sync.active_sync_id
                ]
            );


    const datos =
        result.rows.map(
            (
                fila,
                indice
            ) => ({

                id:
                    `territorio-${indice + 1}`,

                carrera:
                    fila.carrera,

                nombre:
                    fila.carrera,

                region:
                    fila.region,

                sede:
                    fila.region,

                institucion:
                    fila.institucion ||
                    "",

                convocatoria:
                    fila.convocatoria ||
                    "",

                oportunidades:
                    Number(
                        fila.oportunidades ||
                        0
                    ),

                estado:
                    "Disponible",

                fuente:
                    "PRONABEC - PostgreSQL"

            })
        );


    return {

        modo:
            "POSTGRES_SINCRONIZADO",

        fuente:
            "PRONABEC - PostgreSQL",

        totalRegistros:
            Number(
                info.sync.total_rows ||
                0
            ),

        total:
            datos.length,

        datos

    };

}


async function resumen() {

    const result =
        await db()
            .query(
                `
                SELECT
                    recurso,
                    total_rows,
                    synced_at,
                    status
                FROM pronabec_sync
                WHERE
                    status = 'COMPLETADO'
                    AND active_sync_id IS NOT NULL
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
                fila.synced_at,

            status:
                fila.status

        })
    );

}


async function estadisticas() {

    const filas =
        await resumen();


    const mapa =
        Object.fromEntries(
            filas.map(
                fila => [
                    fila.recurso,
                    fila.total_rows
                ]
            )
        );


    const carreras =
        await listarCarreras();


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

            regiones: [
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
            ]

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
                        100
                },
                {
                    rowsDefecto:
                        100,
                    rowsMax:
                        100
                }
            ),

            listarRegistros(
                "PostulacionesVigentes",
                {
                    page:
                        1,
                    rows:
                        100
                },
                {
                    rowsDefecto:
                        100,
                    rowsMax:
                        100
                }
            ),

            listarRegistros(
                "Convenio",
                {
                    page:
                        1,
                    rows:
                        100
                },
                {
                    rowsDefecto:
                        100,
                    rowsMax:
                        100
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

    listarTerritorio,

    resumen,

    estadisticas,

    consultaGeneral

};
