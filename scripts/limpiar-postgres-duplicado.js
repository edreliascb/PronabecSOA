require("dotenv").config();

const { Pool } =
    require("pg");


const url =
    process.env.PRONABEC_SYNC_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "";


if (!url) {

    console.error(
        "❌ Falta PRONABEC_SYNC_DATABASE_URL."
    );

    process.exit(
        1
    );

}


const pool =
    new Pool({

        connectionString:
            url,

        max:
            1,

        ssl:
            url.includes(
                "localhost"
            )
                ? false
                : {
                    rejectUnauthorized:
                        false
                }

    });


function formatoMB(
    bytes
) {

    return (
        Number(
            bytes ||
            0
        ) /
        1024 /
        1024
    )
        .toFixed(
            1
        ) +
        " MB";

}


async function main() {

    console.log("");
    console.log("======================================================");
    console.log(" EDUPERÚ - LIBERAR ESPACIO POSTGRESQL");
    console.log("======================================================");


    const antes =
        await pool.query(
            `
            SELECT
                pg_database_size(
                    current_database()
                ) AS bytes
            `
        );


    console.log(
        "Tamaño antes:",
        formatoMB(
            antes.rows[0]
                ?.bytes
        )
    );


    /*
       Estas tablas son COPIAS auxiliares creadas por el intento
       anterior. Los datos originales permanecen en:
       pronabec_sync + pronabec_catalogo
    */
    await pool.query(
        `
        DROP TABLE IF EXISTS
            pronabec_portal
        CASCADE;

        DROP TABLE IF EXISTS
            pronabec_portal_builds
        CASCADE;
        `
    );


    console.log(
        "✅ Copia parcial pronabec_portal eliminada"
    );


    const original =
        await pool.query(
            `
            SELECT
                COUNT(*)::bigint AS total
            FROM pronabec_catalogo
            `
        );


    console.log(
        "✅ Registros originales conservados:",
        Number(
            original.rows[0]
                ?.total ||
            0
        )
            .toLocaleString(
                "es-PE"
            )
    );


    const despues =
        await pool.query(
            `
            SELECT
                pg_database_size(
                    current_database()
                ) AS bytes
            `
        );


    console.log(
        "Tamaño después:",
        formatoMB(
            despues.rows[0]
                ?.bytes
        )
    );


    console.log("");
    console.log(
        "ESPACIO LIBERADO Y DATOS ORIGINALES CONSERVADOS ✅"
    );

}


main()
    .catch(
        error => {

            console.error("");
            console.error(
                "❌ No se pudo liberar espacio."
            );

            console.error(
                error
            );

            process.exitCode =
                1;

        }
    )
    .finally(
        async () => {

            await pool.end();

        }
    );
