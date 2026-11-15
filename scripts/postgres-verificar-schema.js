const { Client } = require("pg");

const connectionString = process.env.RENDER_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Falta RENDER_DATABASE_URL o DATABASE_URL.");
  process.exit(1);
}

const expected = [
  "alertas",
  "auditoriaeventos",
  "authtokens",
  "configuracionsistema",
  "documentosusuario",
  "favoritos",
  "historialconsultas",
  "notificaciones",
  "perfilesusuario",
  "seguimientospostulacion",
  "usuarioemailestado",
  "usuarios"
];

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    await client.connect();

    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const found = new Set(result.rows.map(r => r.table_name));

    console.log("");
    console.log("======================================================");
    console.log(" EDUPERÚ - VERIFICAR ESQUEMA POSTGRESQL");
    console.log("======================================================");

    let missing = 0;

    for (const table of expected) {
      const ok = found.has(table);
      console.log(`${ok ? "✅" : "❌"} ${table}`);
      if (!ok) missing++;
    }

    const counts = await client.query(`
      SELECT 'usuarios' AS tabla, COUNT(*)::bigint AS filas FROM usuarios
      UNION ALL SELECT 'perfilesusuario', COUNT(*)::bigint FROM perfilesusuario
      UNION ALL SELECT 'alertas', COUNT(*)::bigint FROM alertas
      UNION ALL SELECT 'auditoriaeventos', COUNT(*)::bigint FROM auditoriaeventos
      UNION ALL SELECT 'authtokens', COUNT(*)::bigint FROM authtokens
      UNION ALL SELECT 'configuracionsistema', COUNT(*)::bigint FROM configuracionsistema
      UNION ALL SELECT 'documentosusuario', COUNT(*)::bigint FROM documentosusuario
      UNION ALL SELECT 'favoritos', COUNT(*)::bigint FROM favoritos
      UNION ALL SELECT 'historialconsultas', COUNT(*)::bigint FROM historialconsultas
      UNION ALL SELECT 'notificaciones', COUNT(*)::bigint FROM notificaciones
      UNION ALL SELECT 'seguimientospostulacion', COUNT(*)::bigint FROM seguimientospostulacion
      UNION ALL SELECT 'usuarioemailestado', COUNT(*)::bigint FROM usuarioemailestado
      ORDER BY tabla
    `);

    console.log("");
    console.log("Filas actuales en Render:");
    console.table(counts.rows);

    if (missing === 0) {
      console.log("✅ ESQUEMA POSTGRESQL COMPLETO");
      process.exitCode = 0;
    } else {
      console.log(`❌ Faltan ${missing} tabla(s).`);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
})();
