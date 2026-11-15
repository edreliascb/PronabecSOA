require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const connectionString =
    process.env.DATABASE_URL ||
    process.env.RENDER_DATABASE_URL;

if (!connectionString) {
    console.error("❌ Falta DATABASE_URL o RENDER_DATABASE_URL.");
    process.exit(1);
}

const file =
    path.join(
        process.cwd(),
        "database",
        "postgres",
        "002_compat_eduperu.sql"
    );

const client =
    new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

(async () => {
    try {
        await client.connect();

        await client.query(
            fs.readFileSync(file, "utf8")
        );

        console.log(
            "✅ Esquema de compatibilidad PostgreSQL aplicado."
        );

    } catch (error) {
        console.error(
            "❌ ERROR:",
            error.message
        );

        process.exitCode = 1;

    } finally {
        await client.end().catch(() => {});
    }
})();
