const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const connectionString = process.env.RENDER_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Falta RENDER_DATABASE_URL o DATABASE_URL.");
  process.exit(1);
}

const sqlFile = path.join(
  process.cwd(),
  "database",
  "postgres",
  "001_schema_eduperu.sql"
);

if (!fs.existsSync(sqlFile)) {
  console.error("❌ No existe:", sqlFile);
  process.exit(1);
}

const sql = fs.readFileSync(sqlFile, "utf8");

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    console.log("");
    console.log("======================================================");
    console.log(" EDUPERÚ - CREAR ESQUEMA POSTGRESQL");
    console.log("======================================================");

    await client.connect();

    const info = await client.query(`
      SELECT
        current_database() AS base,
        current_user AS usuario,
        CURRENT_TIMESTAMP AS fecha
    `);

    console.log("✅ Conectado a PostgreSQL");
    console.log("Base   :", info.rows[0].base);
    console.log("Usuario:", info.rows[0].usuario);

    await client.query(sql);

    console.log("✅ Esquema PostgreSQL aplicado correctamente.");
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
})();
