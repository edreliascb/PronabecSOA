require("dotenv").config();

const { Client } = require("pg");
const { obtenerPool } = require("../src/config/database");

const pgUrl =
    process.env.RENDER_DATABASE_URL ||
    process.env.DATABASE_URL;

if (!pgUrl) {
    console.error("❌ Falta RENDER_DATABASE_URL o DATABASE_URL.");
    process.exit(1);
}

const tables = [
    {
        sqlTable: "Usuarios",
        pgTable: "usuarios",
        columns: [
            "id_usuario",
            "nombres",
            "apellidos",
            "email",
            "password_hash",
            "rol",
            "activo",
            "fecha_creacion",
            "fecha_actualizacion"
        ],
        identity: "id_usuario"
    },
    {
        sqlTable: "ConfiguracionSistema",
        pgTable: "configuracionsistema",
        columns: [
            "id_configuracion",
            "clave",
            "valor",
            "descripcion",
            "fecha_actualizacion"
        ],
        identity: "id_configuracion"
    },
    {
        sqlTable: "PerfilesUsuario",
        pgTable: "perfilesusuario",
        columns: [
            "id_perfil",
            "id_usuario",
            "departamento",
            "provincia",
            "distrito",
            "carrera_interes",
            "nivel_estudio",
            "institucion",
            "fecha_actualizacion"
        ],
        identity: "id_perfil"
    },
    {
        sqlTable: "Alertas",
        pgTable: "alertas",
        columns: [
            "id_alerta",
            "id_usuario",
            "nombre",
            "palabra_clave",
            "region",
            "activa",
            "fecha_creacion"
        ],
        identity: "id_alerta"
    },
    {
        sqlTable: "AuditoriaEventos",
        pgTable: "auditoriaeventos",
        columns: [
            "id_auditoria",
            "id_usuario",
            "accion",
            "entidad",
            "detalle",
            "fecha_evento"
        ],
        identity: "id_auditoria"
    },
    {
        sqlTable: "AuthTokens",
        pgTable: "authtokens",
        columns: [
            "id_token",
            "id_usuario",
            "tipo",
            "token_hash",
            "expira_en",
            "usado",
            "fecha_uso",
            "ip_solicitud",
            "creado_en"
        ],
        identity: "id_token"
    },
    {
        sqlTable: "DocumentosUsuario",
        pgTable: "documentosusuario",
        columns: [
            "id_documento_usuario",
            "id_usuario",
            "tipo_documento",
            "nombre_archivo",
            "descripcion",
            "fecha_emision",
            "fecha_vencimiento",
            "estado_validacion",
            "observacion_validacion",
            "fecha_creacion",
            "fecha_actualizacion"
        ],
        identity: "id_documento_usuario"
    },
    {
        sqlTable: "Favoritos",
        pgTable: "favoritos",
        columns: [
            "id_favorito",
            "id_usuario",
            "tipo",
            "referencia",
            "datos_json",
            "fecha_creacion",
            "tipo_recurso",
            "recurso_id",
            "titulo",
            "subtitulo"
        ],
        identity: "id_favorito"
    },
    {
        sqlTable: "HistorialConsultas",
        pgTable: "historialconsultas",
        columns: [
            "id_historial",
            "id_usuario",
            "tipo_consulta",
            "termino",
            "filtros_json",
            "fecha_consulta"
        ],
        identity: "id_historial"
    },
    {
        sqlTable: "Notificaciones",
        pgTable: "notificaciones",
        columns: [
            "id_notificacion",
            "id_usuario",
            "titulo",
            "mensaje",
            "tipo",
            "leida",
            "fecha_creacion",
            "fecha_lectura"
        ],
        identity: "id_notificacion"
    },
    {
        sqlTable: "SeguimientosPostulacion",
        pgTable: "seguimientospostulacion",
        columns: [
            "id_seguimiento",
            "id_usuario",
            "id_postulacion",
            "titulo",
            "estado",
            "notas",
            "fecha_creacion",
            "fecha_actualizacion"
        ],
        identity: "id_seguimiento"
    },
    {
        sqlTable: "UsuarioEmailEstado",
        pgTable: "usuarioemailestado",
        columns: [
            "id_usuario",
            "email_verificado",
            "fecha_verificacion",
            "fecha_actualizacion"
        ],
        identity: null
    }
];

const truncateOrder = [
    "usuarioemailestado",
    "seguimientospostulacion",
    "notificaciones",
    "historialconsultas",
    "favoritos",
    "documentosusuario",
    "authtokens",
    "auditoriaeventos",
    "alertas",
    "perfilesusuario",
    "configuracionsistema",
    "usuarios"
];

function quoteSqlServer(name) {
    return `[${String(name).replace(/]/g, "]]")}]`;
}

function quotePg(name) {
    return `"${String(name).replace(/"/g, '""')}"`;
}

async function readSource(pool, table) {
    const cols = table.columns
        .map(quoteSqlServer)
        .join(", ");

    const result = await pool
        .request()
        .query(
            `SELECT ${cols} FROM dbo.${quoteSqlServer(table.sqlTable)} ORDER BY 1`
        );

    return result.recordset || [];
}

async function destinationHasData(pg) {
    const unions = tables
        .map(
            t =>
                `SELECT '${t.pgTable}' AS tabla, COUNT(*)::bigint AS filas FROM ${quotePg(t.pgTable)}`
        )
        .join(" UNION ALL ");

    const result = await pg.query(unions);
    return result.rows.filter(r => Number(r.filas) > 0);
}

async function insertRows(pg, table, rows) {
    if (!rows.length) return;

    const columns = table.columns
        .map(quotePg)
        .join(", ");

    for (const row of rows) {
        const values = table.columns.map(col => row[col]);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

        await pg.query(
            `INSERT INTO ${quotePg(table.pgTable)} (${columns}) VALUES (${placeholders})`,
            values
        );
    }
}

async function resetIdentity(pg, table) {
    if (!table.identity) return;

    const sequenceResult = await pg.query(
        `SELECT pg_get_serial_sequence($1, $2) AS sequence_name`,
        [table.pgTable, table.identity]
    );

    const sequenceName = sequenceResult.rows[0]?.sequence_name;
    if (!sequenceName) return;

    const maxResult = await pg.query(
        `SELECT COALESCE(MAX(${quotePg(table.identity)}), 0)::bigint AS max_id
         FROM ${quotePg(table.pgTable)}`
    );

    const nextValue = Number(maxResult.rows[0].max_id) + 1;

    await pg.query(
        `SELECT setval($1::regclass, $2, false)`,
        [sequenceName, nextValue]
    );
}

(async () => {
    let sqlPool = null;
    const pg = new Client({
        connectionString: pgUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log("");
        console.log("================================================================");
        console.log(" EDUPERÚ - MIGRACIÓN SQL SERVER → POSTGRESQL RENDER");
        console.log("================================================================");
        console.log("");

        console.log("1) Conectando con SQL Server...");
        sqlPool = await obtenerPool();
        console.log("✅ SQL Server conectado");

        console.log("2) Conectando con PostgreSQL Render...");
        await pg.connect();

        const pgInfo = await pg.query(`
            SELECT current_database() AS base, current_user AS usuario
        `);

        console.log(
            `✅ PostgreSQL conectado — ${pgInfo.rows[0].base} / ${pgInfo.rows[0].usuario}`
        );

        console.log("");
        console.log("3) Leyendo datos fuente...");
        const sourceData = new Map();

        for (const table of tables) {
            const rows = await readSource(sqlPool, table);
            sourceData.set(table.pgTable, rows);
            console.log(
                `   ${table.sqlTable.padEnd(25)} ${String(rows.length).padStart(4)} fila(s)`
            );
        }

        const currentRows = await destinationHasData(pg);

        if (currentRows.length > 0 && process.env.MIGRATION_FORCE_REPLACE !== "1") {
            console.log("");
            console.error("❌ PostgreSQL ya contiene datos.");
            console.error("   Para evitar duplicados, la migración se detuvo.");
            console.error("");
            console.error("Tablas con datos:");
            for (const row of currentRows) {
                console.error(`   - ${row.tabla}: ${row.filas}`);
            }
            console.error("");
            console.error(
                "Si deseas reemplazar completamente esos datos, ejecuta primero:"
            );
            console.error(
                '$env:MIGRATION_FORCE_REPLACE="1"'
            );
            console.error(
                "y vuelve a ejecutar npm run postgres:migrar"
            );
            process.exitCode = 2;
            return;
        }

        console.log("");
        console.log("4) Iniciando transacción PostgreSQL...");
        await pg.query("BEGIN");

        if (currentRows.length > 0) {
            console.log("   Reemplazo autorizado: limpiando destino...");
            await pg.query(
                `TRUNCATE TABLE ${truncateOrder
                    .map(quotePg)
                    .join(", ")} RESTART IDENTITY CASCADE`
            );
        }

        console.log("5) Insertando registros...");

        for (const table of tables) {
            const rows = sourceData.get(table.pgTable) || [];
            await insertRows(pg, table, rows);
            console.log(
                `✅ ${table.sqlTable.padEnd(25)} → ${table.pgTable.padEnd(25)} ${rows.length}`
            );
        }

        console.log("");
        console.log("6) Ajustando secuencias IDENTITY...");

        for (const table of tables) {
            await resetIdentity(pg, table);
        }

        console.log("✅ Secuencias ajustadas");

        console.log("");
        console.log("7) Validando conteos antes de COMMIT...");

        let mismatch = 0;

        for (const table of tables) {
            const expected = (sourceData.get(table.pgTable) || []).length;
            const result = await pg.query(
                `SELECT COUNT(*)::bigint AS filas FROM ${quotePg(table.pgTable)}`
            );
            const actual = Number(result.rows[0].filas);
            const ok = expected === actual;

            console.log(
                `${ok ? "✅" : "❌"} ${table.pgTable.padEnd(27)} SQL=${String(expected).padStart(3)} PG=${String(actual).padStart(3)}`
            );

            if (!ok) mismatch++;
        }

        if (mismatch > 0) {
            console.log("");
            console.error(
                `❌ Se detectaron ${mismatch} diferencia(s). Ejecutando ROLLBACK.`
            );
            await pg.query("ROLLBACK");
            process.exitCode = 1;
            return;
        }

        await pg.query("COMMIT");

        console.log("");
        console.log("================================================================");
        console.log(" MIGRACIÓN COMPLETADA ✅");
        console.log("================================================================");
        console.log("Los datos originales de SQL Server NO fueron modificados.");
        console.log("PostgreSQL Render contiene una copia validada de EduPeruDB.");
    } catch (error) {
        try {
            await pg.query("ROLLBACK");
        } catch {}

        console.error("");
        console.error("❌ ERROR DE MIGRACIÓN:", error.message);
        process.exitCode = 1;
    } finally {
        try {
            await pg.end();
        } catch {}

        try {
            if (sqlPool) {
                await sqlPool.close();
            }
        } catch {}
    }
})();
