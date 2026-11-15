/* =========================================================
   EDUPERÚ - ÍNDICES LIGEROS V5
   Lee pronabec_catalogo por páginas y guarda SOLO dimensiones.
========================================================= */

require("dotenv").config();

const { Pool } = require("pg");

const DATABASE_URL =
    process.env.PRONABEC_SYNC_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "";

if (!DATABASE_URL) {
    console.error(
        "❌ Falta PRONABEC_SYNC_DATABASE_URL."
    );
    process.exit(1);
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 1,
    ssl: DATABASE_URL.includes("localhost")
        ? false
        : { rejectUnauthorized: false }
});

const PAGE = 2000;
const INSERT_BATCH = 300;

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
    const entradas = Object.entries(fila || {})
        .map(([clave, valor]) => ({
            clave,
            tokens: norm(clave),
            valor: limpiar(valor)
        }))
        .filter(x => x.valor);

    for (const grupo of grupos) {
        const buscados = grupo
            .map(x => norm(x)[0])
            .filter(Boolean);

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

function extraerCarrera(fila) {
    return pick(fila, [
        ["nombre", "carrera"],
        ["carrera"],
        ["programa", "estudio"],
        ["programa", "academico"],
        ["especialidad"]
    ]);
}

function extraerInstitucion(fila) {
    return pick(fila, [
        ["nombre", "institucion"],
        ["institucion"],
        ["nombre", "ies"],
        ["universidad"],
        ["instituto"],
        ["entidad"],
        ["organizacion"],
        ["razon", "social"]
    ]);
}

function extraerRegion(fila) {
    return (
        pick(fila, [
            ["departamento"],
            ["region"]
        ]) ||
        pick(fila, [
            ["sede"],
            ["provincia"],
            ["distrito"],
            ["ubicacion"]
        ]) ||
        "Nacional"
    );
}

function extraerConvocatoria(fila) {
    return pick(fila, [
        ["nombre", "convocatoria"],
        ["convocatoria"],
        ["beca"],
        ["programa"]
    ]);
}

async function asegurarTablas() {
    await pool.query(`
        DROP TABLE IF EXISTS
            pronabec_portal
        CASCADE;

        DROP TABLE IF EXISTS
            pronabec_portal_builds
        CASCADE;

        CREATE TABLE IF NOT EXISTS
            pronabec_dim_carreras
        (
            carrera TEXT PRIMARY KEY,
            oportunidades BIGINT NOT NULL DEFAULT 0,
            instituciones INTEGER NOT NULL DEFAULT 0,
            regiones INTEGER NOT NULL DEFAULT 0,
            institucion_muestra TEXT NULL,
            region_muestra TEXT NULL,
            convocatoria_muestra TEXT NULL,
            actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS
            pronabec_dim_instituciones
        (
            institucion TEXT PRIMARY KEY,
            ubicacion TEXT NULL,
            registros BIGINT NOT NULL DEFAULT 0,
            fuente_recurso VARCHAR(120) NULL,
            actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS
            pronabec_dim_territorio
        (
            region TEXT NOT NULL,
            carrera TEXT NOT NULL,
            oportunidades BIGINT NOT NULL DEFAULT 0,
            institucion_muestra TEXT NULL,
            convocatoria_muestra TEXT NULL,
            actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY(region, carrera)
        );

        TRUNCATE TABLE
            pronabec_dim_carreras,
            pronabec_dim_instituciones,
            pronabec_dim_territorio;
    `);
}

async function syncActivo(recurso) {
    const r = await pool.query(
        `
        SELECT
            active_sync_id,
            total_rows
        FROM pronabec_sync
        WHERE
            recurso = $1
            AND status = 'COMPLETADO'
            AND active_sync_id IS NOT NULL
        LIMIT 1
        `,
        [recurso]
    );

    return r.rows[0] || null;
}

async function construirCarreras() {
    const sync =
        await syncActivo(
            "CarrerasElegiblesNacional"
        );

    if (!sync) {
        throw new Error(
            "CarrerasElegiblesNacional no está sincronizado."
        );
    }

    const carreras = new Map();
    const instituciones = new Map();
    const territorio = new Map();

    let last = 0;
    let total = 0;

    console.log("");
    console.log("▶ Construyendo dimensiones de Carreras...");

    while (true) {
        const r = await pool.query(
            `
            SELECT
                ordinal,
                fila_json
            FROM pronabec_catalogo
            WHERE
                recurso = $1
                AND sync_id = $2
                AND ordinal > $3
            ORDER BY ordinal
            LIMIT $4
            `,
            [
                "CarrerasElegiblesNacional",
                sync.active_sync_id,
                last,
                PAGE
            ]
        );

        if (!r.rows.length) break;

        for (const row of r.rows) {
            const fila = row.fila_json || {};

            const carrera =
                extraerCarrera(fila);

            if (!carrera) continue;

            const institucion =
                extraerInstitucion(fila);

            const region =
                extraerRegion(fila);

            const convocatoria =
                extraerConvocatoria(fila);

            const keyCarrera =
                carrera.toLowerCase();

            let c = carreras.get(keyCarrera);

            if (!c) {
                c = {
                    carrera,
                    oportunidades: 0,
                    instituciones: new Set(),
                    regiones: new Set(),
                    institucion_muestra:
                        institucion || "",
                    region_muestra:
                        region || "",
                    convocatoria_muestra:
                        convocatoria || ""
                };
                carreras.set(keyCarrera, c);
            }

            c.oportunidades++;

            if (institucion) {
                c.instituciones.add(
                    institucion.toLowerCase()
                );
            }

            if (region) {
                c.regiones.add(
                    region.toLowerCase()
                );
            }

            if (institucion) {
                const ik =
                    institucion.toLowerCase();

                let inst =
                    instituciones.get(ik);

                if (!inst) {
                    inst = {
                        institucion,
                        ubicacion: region || "",
                        registros: 0,
                        fuente_recurso:
                            "CarrerasElegiblesNacional"
                    };
                    instituciones.set(ik, inst);
                }

                inst.registros++;

                if (!inst.ubicacion && region) {
                    inst.ubicacion = region;
                }
            }

            const tk =
                `${region.toLowerCase()}|${carrera.toLowerCase()}`;

            let t =
                territorio.get(tk);

            if (!t) {
                t = {
                    region,
                    carrera,
                    oportunidades: 0,
                    institucion_muestra:
                        institucion || "",
                    convocatoria_muestra:
                        convocatoria || ""
                };
                territorio.set(tk, t);
            }

            t.oportunidades++;
        }

        last =
            Number(
                r.rows[
                    r.rows.length - 1
                ].ordinal
            );

        total += r.rows.length;

        if (total % 20000 === 0) {
            console.log(
                `   ${total.toLocaleString("es-PE")} filas leídas`
            );
        }
    }

    console.log(
        `   Carreras únicas: ${carreras.size.toLocaleString("es-PE")}`
    );

    console.log(
        `   Instituciones: ${instituciones.size.toLocaleString("es-PE")}`
    );

    console.log(
        `   Carrera/región: ${territorio.size.toLocaleString("es-PE")}`
    );

    return {
        carreras,
        instituciones,
        territorio
    };
}

async function agregarInstitucionesConvenios(
    instituciones
) {
    const sync =
        await syncActivo(
            "Convenio"
        );

    if (!sync) return;

    let last = 0;
    let total = 0;

    console.log("");
    console.log("▶ Integrando instituciones de Convenios...");

    while (true) {
        const r = await pool.query(
            `
            SELECT
                ordinal,
                fila_json
            FROM pronabec_catalogo
            WHERE
                recurso = $1
                AND sync_id = $2
                AND ordinal > $3
            ORDER BY ordinal
            LIMIT $4
            `,
            [
                "Convenio",
                sync.active_sync_id,
                last,
                PAGE
            ]
        );

        if (!r.rows.length) break;

        for (const row of r.rows) {
            const fila =
                row.fila_json || {};

            const institucion =
                extraerInstitucion(fila);

            if (!institucion) continue;

            const region =
                extraerRegion(fila);

            const key =
                institucion.toLowerCase();

            let inst =
                instituciones.get(key);

            if (!inst) {
                inst = {
                    institucion,
                    ubicacion: region || "",
                    registros: 0,
                    fuente_recurso:
                        "Convenio"
                };

                instituciones.set(
                    key,
                    inst
                );
            }

            inst.registros++;

            if (!inst.ubicacion && region) {
                inst.ubicacion = region;
            }
        }

        last =
            Number(
                r.rows[
                    r.rows.length - 1
                ].ordinal
            );

        total += r.rows.length;
    }

    console.log(
        `   Convenios leídos: ${total.toLocaleString("es-PE")}`
    );
}

async function insertarCarreras(mapa) {
    const filas =
        Array.from(mapa.values());

    for (
        let i = 0;
        i < filas.length;
        i += INSERT_BATCH
    ) {
        const lote =
            filas.slice(
                i,
                i + INSERT_BATCH
            );

        const valores = [];
        const groups = [];

        for (const x of lote) {
            const base = valores.length;

            valores.push(
                x.carrera,
                x.oportunidades,
                x.instituciones.size,
                x.regiones.size,
                x.institucion_muestra || null,
                x.region_muestra || null,
                x.convocatoria_muestra || null
            );

            groups.push(
                `(
                    $${base + 1},
                    $${base + 2},
                    $${base + 3},
                    $${base + 4},
                    $${base + 5},
                    $${base + 6},
                    $${base + 7}
                )`
            );
        }

        await pool.query(
            `
            INSERT INTO pronabec_dim_carreras
            (
                carrera,
                oportunidades,
                instituciones,
                regiones,
                institucion_muestra,
                region_muestra,
                convocatoria_muestra
            )
            VALUES ${groups.join(",")}
            `,
            valores
        );
    }
}

async function insertarInstituciones(mapa) {
    const filas =
        Array.from(mapa.values());

    for (
        let i = 0;
        i < filas.length;
        i += INSERT_BATCH
    ) {
        const lote =
            filas.slice(
                i,
                i + INSERT_BATCH
            );

        const valores = [];
        const groups = [];

        for (const x of lote) {
            const base = valores.length;

            valores.push(
                x.institucion,
                x.ubicacion || null,
                x.registros,
                x.fuente_recurso
            );

            groups.push(
                `(
                    $${base + 1},
                    $${base + 2},
                    $${base + 3},
                    $${base + 4}
                )`
            );
        }

        await pool.query(
            `
            INSERT INTO pronabec_dim_instituciones
            (
                institucion,
                ubicacion,
                registros,
                fuente_recurso
            )
            VALUES ${groups.join(",")}
            `,
            valores
        );
    }
}

async function insertarTerritorio(mapa) {
    const filas =
        Array.from(mapa.values());

    for (
        let i = 0;
        i < filas.length;
        i += INSERT_BATCH
    ) {
        const lote =
            filas.slice(
                i,
                i + INSERT_BATCH
            );

        const valores = [];
        const groups = [];

        for (const x of lote) {
            const base = valores.length;

            valores.push(
                x.region,
                x.carrera,
                x.oportunidades,
                x.institucion_muestra || null,
                x.convocatoria_muestra || null
            );

            groups.push(
                `(
                    $${base + 1},
                    $${base + 2},
                    $${base + 3},
                    $${base + 4},
                    $${base + 5}
                )`
            );
        }

        await pool.query(
            `
            INSERT INTO pronabec_dim_territorio
            (
                region,
                carrera,
                oportunidades,
                institucion_muestra,
                convocatoria_muestra
            )
            VALUES ${groups.join(",")}
            `,
            valores
        );
    }
}

async function mostrarResumen() {
    const r = await pool.query(`
        SELECT 'Carreras' AS nombre,
               COUNT(*)::bigint AS total
        FROM pronabec_dim_carreras

        UNION ALL

        SELECT 'Instituciones',
               COUNT(*)::bigint
        FROM pronabec_dim_instituciones

        UNION ALL

        SELECT 'Territorio',
               COUNT(*)::bigint
        FROM pronabec_dim_territorio;
    `);

    console.log("");
    console.log("======================================================");
    console.log(" RESUMEN DE ÍNDICES LIGEROS");
    console.log("======================================================");

    for (const fila of r.rows) {
        console.log(
            `✅ ${fila.nombre}: ${Number(fila.total).toLocaleString("es-PE")}`
        );
    }
}

async function main() {
    console.log("");
    console.log("======================================================");
    console.log(" EDUPERÚ - CONSTRUIR ÍNDICES LIGEROS V5");
    console.log("======================================================");
    console.log("");
    console.log(
        "No duplica los 333 mil registros."
    );

    await asegurarTablas();

    const datos =
        await construirCarreras();

    await agregarInstitucionesConvenios(
        datos.instituciones
    );

    console.log("");
    console.log("▶ Guardando dimensiones pequeñas...");

    await insertarCarreras(
        datos.carreras
    );

    await insertarInstituciones(
        datos.instituciones
    );

    await insertarTerritorio(
        datos.territorio
    );

    await mostrarResumen();

    console.log("");
    console.log(
        "ÍNDICES LIGEROS FINALIZADOS ✅"
    );
}

main()
    .catch(error => {
        console.error("");
        console.error(
            "❌ No se pudieron construir los índices ligeros."
        );
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await pool.end();
    });
