/* =========================================================
   EDUPERÚ - PORTAL DATOS V5
   - Registros completos: pronabec_catalogo
   - Catálogos ligeros: pronabec_dim_*
   - No duplica 333k filas
========================================================= */

const { Pool } = require("pg");

let pool = null;

function db() {
    if (pool) return pool;

    const connectionString =
        process.env.DATABASE_URL || "";

    if (!connectionString) {
        throw new Error("DATABASE_URL no está configurada.");
    }

    pool = new Pool({
        connectionString,
        max: 3,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 5000,
        ssl: connectionString.includes("localhost")
            ? false
            : { rejectUnauthorized: false }
    });

    return pool;
}

function limpiar(valor) {
    return String(valor ?? "")
        .replace(/\s+/g, " ")
        .trim();
}

function norm(valor) {
    return limpiar(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
}

function pick(fila, grupos) {
    if (!fila || typeof fila !== "object") return "";

    const entradas = Object.entries(fila)
        .map(([clave, valor]) => ({
            clave,
            tokens: norm(clave),
            valor: limpiar(valor)
        }))
        .filter(x => x.valor);

    for (const grupo of grupos) {
        const buscados = grupo.map(x => norm(x)[0]).filter(Boolean);

        const encontrados = entradas
            .filter(item =>
                buscados.every(token =>
                    item.tokens.includes(token)
                )
            )
            .sort((a, b) => {
                const score = item => {
                    let s = 0;
                    if (item.tokens.includes("nombre")) s += 3;
                    if (item.tokens.includes("descripcion")) s -= 1;
                    return s;
                };
                return score(b) - score(a);
            });

        if (encontrados.length) {
            return encontrados[0].valor;
        }
    }

    return "";
}

function normalizarFila(recurso, fila, ordinal = 0) {
    const convocatoria = pick(fila, [
        ["nombre", "convocatoria"],
        ["convocatoria"],
        ["beca"],
        ["programa"]
    ]);

    const carrera = pick(fila, [
        ["nombre", "carrera"],
        ["carrera"],
        ["programa", "estudio"],
        ["programa", "academico"],
        ["especialidad"]
    ]);

    const institucion = pick(fila, [
        ["nombre", "institucion"],
        ["institucion"],
        ["nombre", "ies"],
        ["universidad"],
        ["instituto"],
        ["entidad"],
        ["organizacion"],
        ["razon", "social"]
    ]);

    const region = pick(fila, [
        ["departamento"],
        ["region"]
    ]);

    const sede = pick(fila, [
        ["sede"],
        ["campus"],
        ["provincia"],
        ["distrito"],
        ["ubicacion"]
    ]);

    const estado = pick(fila, [
        ["estado"],
        ["vigencia"],
        ["situacion"]
    ]);

    const modalidad = pick(fila, [
        ["modalidad"],
        ["tipo", "estudio"]
    ]);

    const convenio = pick(fila, [
        ["nombre", "convenio"],
        ["convenio"],
        ["objeto", "convenio"],
        ["objeto"]
    ]);

    const tipoConvenio = pick(fila, [
        ["tipo", "convenio"],
        ["tipo", "entidad"]
    ]);

    const descripcion = pick(fila, [
        ["descripcion"],
        ["detalle"],
        ["observacion"],
        ["beneficio"]
    ]);

    let titulo =
        convocatoria ||
        carrera ||
        convenio ||
        institucion ||
        "Registro PRONABEC";

    if (recurso === "CarrerasElegiblesNacional") {
        titulo = carrera || titulo || "Carrera elegible";
    } else if (recurso === "Convenio") {
        titulo = convenio || institucion || titulo || "Convenio PRONABEC";
    } else if (recurso === "PostulacionesVigentes") {
        titulo = carrera || convocatoria || titulo || "Postulación vigente";
    }

    return {
        id: `${recurso}-${ordinal}`,
        ordinal: Number(ordinal || 0),
        titulo,
        convocatoria,
        carrera,
        institucion,
        region: region || sede || "Nacional",
        sede: sede || region || "Nacional",
        estado: estado ||
            (recurso === "ConvocatoriaCarreraVigentes"
                ? "Vigente"
                : "Disponible"),
        modalidad,
        convenio,
        tipo_convenio: tipoConvenio,
        descripcion,
        fuente: "PRONABEC - PostgreSQL",
        modo: "POSTGRES_SINCRONIZADO"
    };
}

async function syncActivo(recurso) {
    const result = await db().query(
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
        [recurso]
    );

    return result.rows[0] || null;
}

function entero(valor, defecto, minimo, maximo) {
    const n = Number(valor);
    if (!Number.isFinite(n)) return defecto;
    return Math.max(minimo, Math.min(maximo, Math.trunc(n)));
}

async function listarRegistros(
    recurso,
    query = {},
    opciones = {}
) {
    const sync = await syncActivo(recurso);

    if (!sync) {
        return {
            recurso,
            modo: "POSTGRES_SINCRONIZADO",
            disponible: false,
            total: 0,
            pagina: 1,
            filas: 0,
            totalPaginas: 1,
            datos: [],
            data: [],
            rows: [],
            records: []
        };
    }

    const pagina = entero(
        query.page ?? query.pagina,
        1,
        1,
        10000000
    );

    const rows = entero(
        query.rows ?? query.limit ?? query.filas,
        opciones.rowsDefecto || 50,
        1,
        opciones.rowsMax || 500
    );

    const valores = [
        recurso,
        sync.active_sync_id
    ];

    let filtro = "";

    /*
       Búsqueda segura y general sobre JSONB.
       Solo se usa cuando el usuario realmente aplica filtros.
    */
    const terminos = [];

    for (const valor of [
        query.q,
        query.buscar,
        query.search,
        query.carrera,
        query.region,
        query.estado,
        query.institucion,
        query.convocatoria
    ]) {
        const v = limpiar(valor);
        if (v) terminos.push(v);
    }

    if (terminos.length) {
        const condiciones = [];

        for (const termino of terminos) {
            valores.push(`%${termino}%`);
            condiciones.push(
                `pc.fila_json::text ILIKE $${valores.length}`
            );
        }

        filtro =
            " AND " +
            condiciones.join(" AND ");
    }

    let total = Number(sync.total_rows || 0);

    if (filtro) {
        const count = await db().query(
            `
            SELECT COUNT(*)::bigint AS total
            FROM pronabec_catalogo pc
            WHERE
                pc.recurso = $1
                AND pc.sync_id = $2
                ${filtro}
            `,
            valores
        );

        total = Number(count.rows[0]?.total || 0);
    }

    const valoresLista = [...valores];

    valoresLista.push(rows);
    const iLimit = valoresLista.length;

    valoresLista.push((pagina - 1) * rows);
    const iOffset = valoresLista.length;

    const result = await db().query(
        `
        SELECT
            pc.ordinal,
            pc.fila_json
        FROM pronabec_catalogo pc
        WHERE
            pc.recurso = $1
            AND pc.sync_id = $2
            ${filtro}
        ORDER BY pc.ordinal
        LIMIT $${iLimit}
        OFFSET $${iOffset}
        `,
        valoresLista
    );

    const datos = result.rows.map(fila =>
        normalizarFila(
            recurso,
            fila.fila_json,
            fila.ordinal
        )
    );

    return {
        recurso,
        modo: "POSTGRES_SINCRONIZADO",
        fuente: "PRONABEC - PostgreSQL",
        disponible: true,
        total,
        pagina,
        filas: rows,
        totalPaginas: Math.max(
            1,
            Math.ceil(total / rows)
        ),
        fechaSincronizacion: sync.synced_at,
        datos,
        data: datos,
        rows: datos,
        records: datos
    };
}

async function tablaExiste(nombre) {
    const result = await db().query(
        `
        SELECT to_regclass($1) AS tabla
        `,
        [`public.${nombre}`]
    );

    return Boolean(result.rows[0]?.tabla);
}

async function listarCarreras(query = {}) {
    if (!(await tablaExiste("pronabec_dim_carreras"))) {
        return {
            modo: "POSTGRES_SINCRONIZADO",
            fuente: "PRONABEC - PostgreSQL",
            total: 0,
            totalRegistros: 0,
            datos: []
        };
    }

    const valores = [];
    let filtro = "";

    const q = limpiar(query.q || query.buscar);

    if (q) {
        valores.push(`%${q}%`);
        filtro = `WHERE carrera ILIKE $1`;
    }

    const result = await db().query(
        `
        SELECT
            carrera,
            oportunidades,
            instituciones,
            regiones,
            institucion_muestra,
            region_muestra,
            convocatoria_muestra
        FROM pronabec_dim_carreras
        ${filtro}
        ORDER BY carrera
        `,
        valores
    );

    const sync =
        await syncActivo(
            "CarrerasElegiblesNacional"
        );

    const datos = result.rows.map(fila => ({
        nombre: fila.carrera,
        carrera: fila.carrera,
        oportunidades: Number(
            fila.oportunidades || 0
        ),
        registros: Number(
            fila.oportunidades || 0
        ),
        instituciones: Number(
            fila.instituciones || 0
        ),
        regiones: Number(
            fila.regiones || 0
        ),
        institucionesLista:
            fila.institucion_muestra
                ? [fila.institucion_muestra]
                : [],
        regionesLista:
            fila.region_muestra
                ? [fila.region_muestra]
                : [],
        convocatoriasLista:
            fila.convocatoria_muestra
                ? [fila.convocatoria_muestra]
                : []
    }));

    return {
        modo: "POSTGRES_SINCRONIZADO",
        fuente: "PRONABEC - PostgreSQL",
        total: datos.length,
        totalRegistros: Number(
            sync?.total_rows || 0
        ),
        datos
    };
}

async function listarInstituciones(query = {}) {
    if (!(await tablaExiste("pronabec_dim_instituciones"))) {
        return {
            modo: "POSTGRES_SINCRONIZADO",
            fuente: "PRONABEC - PostgreSQL",
            total: 0,
            datos: []
        };
    }

    const valores = [];
    let filtro = "";

    const q = limpiar(query.q || query.buscar);

    if (q) {
        valores.push(`%${q}%`);
        filtro =
            `WHERE
                institucion ILIKE $1
                OR ubicacion ILIKE $1`;
    }

    const result = await db().query(
        `
        SELECT
            institucion,
            ubicacion,
            registros,
            fuente_recurso
        FROM pronabec_dim_instituciones
        ${filtro}
        ORDER BY institucion
        `,
        valores
    );

    const datos = result.rows.map(fila => ({
        nombre: fila.institucion,
        institucion: fila.institucion,
        ubicacion:
            fila.ubicacion ||
            "No especificada",
        region:
            fila.ubicacion ||
            "No especificada",
        tipo: "Institución educativa",
        convenio:
            fila.fuente_recurso === "Convenio"
                ? "Convenio PRONABEC"
                : "PRONABEC",
        estado: "Disponible",
        registros: Number(
            fila.registros || 0
        ),
        fuente: "PRONABEC - PostgreSQL"
    }));

    return {
        modo: "POSTGRES_SINCRONIZADO",
        fuente: "PRONABEC - PostgreSQL",
        total: datos.length,
        datos
    };
}

async function listarTerritorio() {
    if (!(await tablaExiste("pronabec_dim_territorio"))) {
        return {
            modo: "POSTGRES_SINCRONIZADO",
            fuente: "PRONABEC - PostgreSQL",
            total: 0,
            totalRegistros: 0,
            datos: []
        };
    }

    const result = await db().query(
        `
        SELECT
            region,
            carrera,
            oportunidades,
            institucion_muestra,
            convocatoria_muestra
        FROM pronabec_dim_territorio
        ORDER BY region, carrera
        `
    );

    const sync =
        await syncActivo(
            "CarrerasElegiblesNacional"
        );

    const datos = result.rows.map(
        (fila, indice) => ({
            id: `territorio-${indice + 1}`,
            carrera: fila.carrera,
            nombre: fila.carrera,
            region: fila.region || "Nacional",
            sede: fila.region || "Nacional",
            institucion:
                fila.institucion_muestra ||
                "",
            convocatoria:
                fila.convocatoria_muestra ||
                "",
            oportunidades: Number(
                fila.oportunidades || 0
            ),
            estado: "Disponible",
            fuente: "PRONABEC - PostgreSQL"
        })
    );

    return {
        modo: "POSTGRES_SINCRONIZADO",
        fuente: "PRONABEC - PostgreSQL",
        totalRegistros: Number(
            sync?.total_rows || 0
        ),
        total: datos.length,
        datos
    };
}

async function resumen() {
    const result = await db().query(
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

    return result.rows.map(fila => ({
        recurso: fila.recurso,
        total_rows: Number(
            fila.total_rows || 0
        ),
        built_at: fila.synced_at,
        status: fila.status
    }));
}

async function estadisticas() {
    const filas = await resumen();

    const mapa = Object.fromEntries(
        filas.map(fila => [
            fila.recurso,
            fila.total_rows
        ])
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
            totalRegiones: 25
        },

        catalogos: {
            carreras:
                carreras.datos.map(
                    item => item.nombre
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
        convocatorias,
        postulaciones,
        convenios
    ] = await Promise.all([
        listarRegistros(
            "ConvocatoriaCarreraVigentes",
            { page: 1, rows: 100 },
            { rowsDefecto: 100, rowsMax: 100 }
        ),

        listarRegistros(
            "PostulacionesVigentes",
            { page: 1, rows: 100 },
            { rowsDefecto: 100, rowsMax: 100 }
        ),

        listarRegistros(
            "Convenio",
            { page: 1, rows: 100 },
            { rowsDefecto: 100, rowsMax: 100 }
        )
    ]);

    return {
        convocatorias: {
            modo: "POSTGRES_SINCRONIZADO",
            fuente: "PRONABEC - PostgreSQL",
            disponible: true,
            total: convocatorias.total,
            datos: convocatorias
        },

        postulaciones: {
            modo: "POSTGRES_SINCRONIZADO",
            fuente: "PRONABEC - PostgreSQL",
            disponible: true,
            total: postulaciones.total,
            datos: postulaciones
        },

        convenios: {
            modo: "POSTGRES_SINCRONIZADO",
            fuente: "PRONABEC - PostgreSQL",
            disponible: true,
            total: convenios.total,
            datos: convenios
        },

        documentos: {
            modo: "NO_DISPONIBLE",
            fuente: "PRONABEC",
            disponible: false,
            total: 0,
            datos: []
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
