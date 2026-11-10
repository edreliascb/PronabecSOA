/* =========================================================
   EDUPERÚ SOA
   SQL SERVER DATABASE CONFIG
========================================================= */

const sql =
    require("mssql");


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const databaseConfig = {

    server:
        process.env.DB_SERVER ||
        "localhost",

    user:
        process.env.DB_USER,

    password:
        process.env.DB_PASSWORD,

    database:
        process.env.DB_NAME ||
        "EduPeruDB",

    options: {

        encrypt:
            String(
                process.env.DB_ENCRYPT ||
                "false"
            )
                .toLowerCase() ===
            "true",

        trustServerCertificate:
            String(
                process.env
                    .DB_TRUST_SERVER_CERTIFICATE ||
                "true"
            )
                .toLowerCase() ===
            "true"

    },

    pool: {

        max:
            10,

        min:
            0,

        idleTimeoutMillis:
            30000

    },

    connectionTimeout:
        15000,

    requestTimeout:
        15000

};


/* =========================================================
   INSTANCIA SQL EXPRESS
========================================================= */

if (
    process.env.DB_INSTANCE
) {

    databaseConfig.options.instanceName =
        process.env.DB_INSTANCE;

} else {

    const puerto =
        Number(
            process.env.DB_PORT
        );


    if (
        Number.isFinite(
            puerto
        ) &&
        puerto > 0
    ) {

        databaseConfig.port =
            puerto;

    }

}


/* =========================================================
   POOL
========================================================= */

let poolPromise =
    null;


/* =========================================================
   CONECTAR
========================================================= */

async function conectarDB() {

    if (
        poolPromise
    ) {

        return poolPromise;

    }


    try {

        const pool =
            new sql.ConnectionPool(
                databaseConfig
            );


        pool.on(
            "error",
            error => {

                console.error(
                    "SQL Pool Error:",
                    error.message
                );

                poolPromise =
                    null;

            }
        );


        poolPromise =
            pool.connect();


        const conexion =
            await poolPromise;


        console.log(
            "SQL Server conectado correctamente."
        );


        return conexion;

    } catch (error) {

        poolPromise =
            null;


        console.error(
            "Error conectando con SQL Server:",
            error.message
        );


        throw error;

    }

}


/* =========================================================
   OBTENER POOL
========================================================= */

async function obtenerPool() {

    return await conectarDB();

}


/* =========================================================
   PROBAR CONEXIÓN
========================================================= */

async function probarConexion() {

    const pool =
        await obtenerPool();


    const resultado =
        await pool
            .request()
            .query(
                `
                SELECT
                    DB_NAME() AS baseDatos,
                    SYSDATETIME() AS fechaServidor
                `
            );


    return (
        resultado.recordset[0] ||
        {}
    );

}


/* =========================================================
   EXPORTAR
========================================================= */

module.exports = {

    sql,

    conectarDB,

    obtenerPool,

    probarConexion

};