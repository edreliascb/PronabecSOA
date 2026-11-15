require("dotenv").config();

const { Pool } = require("pg");

const url =
    process.env.PRONABEC_SYNC_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "";

if (!url) {
    console.error("❌ Falta URL.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: url,
    max: 1,
    ssl: url.includes("localhost")
        ? false
        : { rejectUnauthorized: false }
});

async function main() {
    const r = await pool.query(`
        SELECT
            recurso,
            total_rows,
            status,
            active_sync_id IS NOT NULL AS activo
        FROM pronabec_sync
        ORDER BY recurso;
    `);

    console.log("");
    console.log("DATOS ORIGINALES:");
    console.table(r.rows);

    const c = await pool.query(`
        SELECT
            COUNT(*)::bigint AS filas
        FROM pronabec_catalogo;
    `);

    console.log(
        "pronabec_catalogo:",
        Number(c.rows[0]?.filas || 0)
            .toLocaleString("es-PE")
    );

    const d = await pool.query(`
        SELECT
            pg_database_size(
                current_database()
            ) AS bytes;
    `);

    console.log(
        "Tamaño DB:",
        (
            Number(d.rows[0]?.bytes || 0) /
            1024 /
            1024
        ).toFixed(1),
        "MB"
    );
}

main()
    .catch(console.error)
    .finally(() => pool.end());
