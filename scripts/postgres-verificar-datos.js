require("dotenv").config();

const { Client } = require("pg");

const pgUrl =
    process.env.RENDER_DATABASE_URL ||
    process.env.DATABASE_URL;

if (!pgUrl) {
    console.error("❌ Falta RENDER_DATABASE_URL o DATABASE_URL.");
    process.exit(1);
}

const expected = {
    usuarios: 3,
    perfilesusuario: 1,
    alertas: 3,
    auditoriaeventos: 4,
    authtokens: 5,
    configuracionsistema: 3,
    documentosusuario: 1,
    favoritos: 2,
    historialconsultas: 1,
    notificaciones: 2,
    seguimientospostulacion: 2,
    usuarioemailestado: 1
};

const pg = new Client({
    connectionString: pgUrl,
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        await pg.connect();

        console.log("");
        console.log("========================================================");
        console.log(" EDUPERÚ - VERIFICACIÓN DE DATOS EN RENDER");
        console.log("========================================================");

        let fail = 0;

        for (const [table, expectedRows] of Object.entries(expected)) {
            const result = await pg.query(
                `SELECT COUNT(*)::bigint AS filas FROM "${table}"`
            );
            const actual = Number(result.rows[0].filas);
            const ok = actual === expectedRows;

            console.log(
                `${ok ? "✅" : "❌"} ${table.padEnd(27)} esperado=${String(expectedRows).padStart(2)} actual=${String(actual).padStart(2)}`
            );

            if (!ok) fail++;
        }

        console.log("");
        console.log("Validaciones funcionales:");

        const users = await pg.query(`
            SELECT COUNT(*)::int AS total,
                   COUNT(DISTINCT LOWER(email))::int AS emails_unicos
            FROM usuarios
        `);

        const emailsOk =
            users.rows[0].total === users.rows[0].emails_unicos;

        console.log(
            `${emailsOk ? "✅" : "❌"} Emails de Usuarios sin duplicados`
        );
        if (!emailsOk) fail++;

        const orphanResult = await pg.query(`
            SELECT
                (
                    SELECT COUNT(*)
                    FROM perfilesusuario p
                    LEFT JOIN usuarios u ON u.id_usuario = p.id_usuario
                    WHERE u.id_usuario IS NULL
                ) +
                (
                    SELECT COUNT(*)
                    FROM alertas a
                    LEFT JOIN usuarios u ON u.id_usuario = a.id_usuario
                    WHERE u.id_usuario IS NULL
                ) +
                (
                    SELECT COUNT(*)
                    FROM favoritos f
                    LEFT JOIN usuarios u ON u.id_usuario = f.id_usuario
                    WHERE u.id_usuario IS NULL
                ) +
                (
                    SELECT COUNT(*)
                    FROM notificaciones n
                    LEFT JOIN usuarios u ON u.id_usuario = n.id_usuario
                    WHERE u.id_usuario IS NULL
                ) AS huerfanos
        `);

        const orphans = Number(orphanResult.rows[0].huerfanos);
        console.log(
            `${orphans === 0 ? "✅" : "❌"} Relaciones principales sin huérfanos (${orphans})`
        );
        if (orphans !== 0) fail++;

        console.log("--------------------------------------------------------");

        if (fail === 0) {
            console.log("RESULTADO: DATOS MIGRADOS Y VALIDADOS ✅");
            process.exitCode = 0;
        } else {
            console.log(`RESULTADO: REVISAR — ${fail} problema(s) ❌`);
            process.exitCode = 1;
        }
    } catch (error) {
        console.error("❌ ERROR:", error.message);
        process.exitCode = 1;
    } finally {
        await pg.end().catch(() => {});
    }
})();
