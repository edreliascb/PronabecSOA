require("dotenv").config();

process.env.DB_ENGINE =
    "postgres";

const {
    probarConexion,
    obtenerPool,
    obtenerMotor,
    sql
} =
    require("../src/config/database");

(async () => {
    try {
        console.log("");
        console.log("========================================================");
        console.log(" EDUPERÚ - POSTGRES COMPAT SMOKE TEST");
        console.log("========================================================");

        console.log(
            "Motor:",
            obtenerMotor()
        );

        const db =
            await probarConexion();

        console.log(
            "✅ Database health:",
            db.baseDatos
        );

        const pool =
            await obtenerPool();

        const usuarios =
            await pool
                .request()
                .query(`
                    SELECT TOP 1
                        id_usuario,
                        email,
                        activo
                    FROM dbo.Usuarios
                    ORDER BY id_usuario
                `);

        if (!usuarios.recordset.length) {
            throw new Error(
                "No hay usuarios migrados en PostgreSQL."
            );
        }

        const idUsuario =
            usuarios.recordset[0].id_usuario;

        console.log(
            "✅ TOP + dbo + booleanos"
        );

        const perfil =
            await pool
                .request()
                .input(
                    "idUsuario",
                    sql.Int,
                    idUsuario
                )
                .query(`
                    SELECT TOP 1
                        id_perfil,
                        id_usuario,
                        departamento
                    FROM dbo.PerfilesUsuario
                    WHERE id_usuario = @idUsuario
                `);

        console.log(
            "✅ Parámetros @nombre:",
            perfil.recordset.length >= 0
        );

        const multi =
            await pool
                .request()
                .query(`
                    SELECT COUNT(*) AS total_usuarios
                    FROM dbo.Usuarios;

                    SELECT COUNT(*) AS total_alertas
                    FROM dbo.Alertas;

                    SELECT DB_NAME() AS base_datos,
                           SYSDATETIME() AS fecha_servidor;
                `);

        if (
            !multi.recordsets ||
            multi.recordsets.length !== 3
        ) {
            throw new Error(
                "Los múltiples recordsets no se comportan como MSSQL."
            );
        }

        console.log(
            "✅ Múltiples recordsets"
        );

        const hist =
            await pool
                .request()
                .input(
                    "idUsuario",
                    sql.Int,
                    idUsuario
                )
                .query(`
                    SELECT TOP 100
                        id_historial,
                        tipo_consulta,
                        fecha_consulta
                    FROM dbo.HistorialConsultas
                    WHERE id_usuario = @idUsuario
                    ORDER BY fecha_consulta DESC
                `);

        console.log(
            "✅ TOP 100 + parámetros:",
            hist.recordset.length
        );

        console.log("--------------------------------------------------------");
        console.log("RESULTADO: COMPATIBILIDAD BASE OK ✅");

    } catch (error) {
        console.error("");
        console.error(
            "❌ COMPATIBILIDAD POSTGRES FALLÓ:",
            error.message
        );

        process.exitCode = 1;
    }
})();
