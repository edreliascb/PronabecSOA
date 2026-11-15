/* =========================================================
   EDUPERÚ - CONSTRUIR CATÁLOGO NORMALIZADO PARA EL PORTAL
   Usa los datos ya almacenados en pronabec_catalogo.
========================================================= */

require("dotenv").config();

const crypto =
    require("crypto");

const { Pool } =
    require("pg");


const DATABASE_URL =
    process.env.PRONABEC_SYNC_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "";


if (!DATABASE_URL) {

    console.error(
        "❌ Falta PRONABEC_SYNC_DATABASE_URL o DATABASE_URL."
    );

    process.exit(
        1
    );

}


const READ_BATCH =
    2000;


const INSERT_BATCH =
    500;


const pool =
    new Pool({

        connectionString:
            DATABASE_URL,

        max:
            2,

        ssl:
            DATABASE_URL.includes(
                "localhost"
            )
                ? false
                : {
                    rejectUnauthorized:
                        false
                }

    });


function limpiar(
    valor
) {

    return String(
        valor ??
        ""
    )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


function clave(
    valor
) {

    return limpiar(
        valor
    )
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            ""
        );

}


function buscar(
    fila,
    grupos
) {

    const entradas =
        Object.entries(
            fila ||
            {}
        )
            .map(
                (
                    [nombre, valor]
                ) => ({
                    nombre,
                    k:
                        clave(
                            nombre
                        ),
                    valor:
                        limpiar(
                            valor
                        )
                })
            )
            .filter(
                item =>
                    item.valor
            );


    for (
        const grupo
        of grupos
    ) {

        const tokens =
            grupo.map(
                clave
            );


        const candidatos =
            entradas
                .filter(
                    item =>
                        tokens.every(
                            token =>
                                item.k.includes(
                                    token
                                )
                        )
                )
                .sort(
                    (a, b) => {

                        const score =
                            item => {

                                let s =
                                    0;


                                if (
                                    item.k.includes(
                                        "nombre"
                                    )
                                ) {
                                    s +=
                                        3;
                                }


                                if (
                                    item.k.includes(
                                        "descripcion"
                                    )
                                ) {
                                    s -=
                                        1;
                                }


                                return s;

                            };


                        return (
                            score(b) -
                            score(a)
                        );

                    }
                );


        if (
            candidatos.length
        ) {

            return candidatos[0]
                .valor;

        }

    }


    return "";

}


function normalizar(
    recurso,
    fila
) {

    const convocatoria =
        buscar(
            fila,
            [
                [
                    "nombre",
                    "convocatoria"
                ],
                [
                    "convocatoria"
                ],
                [
                    "beca"
                ],
                [
                    "programa"
                ]
            ]
        );


    const carrera =
        buscar(
            fila,
            [
                [
                    "nombre",
                    "carrera"
                ],
                [
                    "carrera"
                ],
                [
                    "programa",
                    "estudio"
                ],
                [
                    "programa",
                    "academico"
                ],
                [
                    "especialidad"
                ]
            ]
        );


    const institucion =
        buscar(
            fila,
            [
                [
                    "nombre",
                    "institucion"
                ],
                [
                    "institucion"
                ],
                [
                    "nombre",
                    "ies"
                ],
                [
                    "universidad"
                ],
                [
                    "instituto"
                ],
                [
                    "entidad"
                ],
                [
                    "organizacion"
                ],
                [
                    "razon",
                    "social"
                ]
            ]
        );


    const region =
        buscar(
            fila,
            [
                [
                    "departamento"
                ],
                [
                    "region"
                ]
            ]
        );


    const sede =
        buscar(
            fila,
            [
                [
                    "sede"
                ],
                [
                    "campus"
                ],
                [
                    "provincia"
                ],
                [
                    "distrito"
                ],
                [
                    "ubicacion"
                ]
            ]
        );


    const estado =
        buscar(
            fila,
            [
                [
                    "estado"
                ],
                [
                    "vigencia"
                ],
                [
                    "situacion"
                ]
            ]
        );


    const modalidad =
        buscar(
            fila,
            [
                [
                    "modalidad"
                ],
                [
                    "tipo",
                    "estudio"
                ]
            ]
        );


    const convenio =
        buscar(
            fila,
            [
                [
                    "nombre",
                    "convenio"
                ],
                [
                    "convenio"
                ],
                [
                    "objeto",
                    "convenio"
                ],
                [
                    "objeto"
                ]
            ]
        );


    const tipoConvenio =
        buscar(
            fila,
            [
                [
                    "tipo",
                    "convenio"
                ],
                [
                    "tipo",
                    "entidad"
                ],
                [
                    "tipo"
                ]
            ]
        );


    const descripcion =
        buscar(
            fila,
            [
                [
                    "descripcion"
                ],
                [
                    "detalle"
                ],
                [
                    "observacion"
                ],
                [
                    "beneficio"
                ]
            ]
        );


    let titulo =
        convocatoria ||
        carrera ||
        convenio ||
        institucion ||
        "Registro PRONABEC";


    if (
        recurso ===
        "CarrerasElegiblesNacional"
    ) {

        titulo =
            carrera ||
            convocatoria ||
            "Carrera elegible";

    }


    if (
        recurso ===
        "Convenio"
    ) {

        titulo =
            convenio ||
            institucion ||
            "Convenio PRONABEC";

    }


    if (
        recurso ===
        "PostulacionesVigentes"
    ) {

        titulo =
            carrera ||
            convocatoria ||
            "Postulación vigente";

    }


    return {

        titulo,

        convocatoria,

        carrera,

        institucion,

        region,

        sede,

        estado:
            estado ||
            (
                recurso ===
                "ConvocatoriaCarreraVigentes"
                    ? "Vigente"
                    : ""
            ),

        modalidad,

        convenio,

        tipo_convenio:
            tipoConvenio,

        descripcion

    };

}


async function asegurarTablas() {

    await pool.query(
        `
        CREATE TABLE IF NOT EXISTS pronabec_portal_builds
        (
            recurso VARCHAR(120) PRIMARY KEY,
            active_build_id UUID NULL,
            total_rows BIGINT NOT NULL DEFAULT 0,
            built_at TIMESTAMPTZ NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
            last_error TEXT NULL
        );

        CREATE TABLE IF NOT EXISTS pronabec_portal
        (
            id BIGSERIAL PRIMARY KEY,
            recurso VARCHAR(120) NOT NULL,
            build_id UUID NOT NULL,
            ordinal BIGINT NOT NULL,
            titulo TEXT NULL,
            convocatoria TEXT NULL,
            carrera TEXT NULL,
            institucion TEXT NULL,
            region TEXT NULL,
            sede TEXT NULL,
            estado TEXT NULL,
            modalidad TEXT NULL,
            convenio TEXT NULL,
            tipo_convenio TEXT NULL,
            descripcion TEXT NULL,
            creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS ix_pronabec_portal_recurso_build_ordinal
            ON pronabec_portal(recurso, build_id, ordinal);

        CREATE INDEX IF NOT EXISTS ix_pronabec_portal_carrera
            ON pronabec_portal(carrera);

        CREATE INDEX IF NOT EXISTS ix_pronabec_portal_institucion
            ON pronabec_portal(institucion);

        CREATE INDEX IF NOT EXISTS ix_pronabec_portal_region
            ON pronabec_portal(region);
        `
    );

}


async function insertar(
    recurso,
    buildId,
    filas
) {

    if (!filas.length) {
        return;
    }


    const valores =
        [];

    const groups =
        [];


    for (
        const item
        of filas
    ) {

        const base =
            valores.length;


        valores.push(
            recurso,
            buildId,
            item.ordinal,
            item.titulo,
            item.convocatoria,
            item.carrera,
            item.institucion,
            item.region,
            item.sede,
            item.estado,
            item.modalidad,
            item.convenio,
            item.tipo_convenio,
            item.descripcion
        );


        groups.push(
            `(
                $${base + 1},
                $${base + 2},
                $${base + 3},
                $${base + 4},
                $${base + 5},
                $${base + 6},
                $${base + 7},
                $${base + 8},
                $${base + 9},
                $${base + 10},
                $${base + 11},
                $${base + 12},
                $${base + 13},
                $${base + 14}
            )`
        );

    }


    await pool.query(
        `
        INSERT INTO pronabec_portal
        (
            recurso,
            build_id,
            ordinal,
            titulo,
            convocatoria,
            carrera,
            institucion,
            region,
            sede,
            estado,
            modalidad,
            convenio,
            tipo_convenio,
            descripcion
        )
        VALUES
            ${groups.join(",")}
        `,
        valores
    );

}


async function construir(
    sync
) {

    const recurso =
        sync.recurso;


    const buildId =
        crypto.randomUUID();


    console.log("");
    console.log(
        `▶ ${recurso}`
    );


    await pool.query(
        `
        INSERT INTO pronabec_portal_builds
        (
            recurso,
            status,
            last_error
        )
        VALUES
        (
            $1,
            'CONSTRUYENDO',
            NULL
        )
        ON CONFLICT(recurso)
        DO UPDATE SET
            status = 'CONSTRUYENDO',
            last_error = NULL
        `,
        [
            recurso
        ]
    );


    let ultimoOrdinal =
        0;

    let total =
        0;


    try {

        while (
            true
        ) {

            const result =
                await pool.query(
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
                        recurso,
                        sync.active_sync_id,
                        ultimoOrdinal,
                        READ_BATCH
                    ]
                );


            if (
                !result.rows.length
            ) {

                break;

            }


            const normalizados =
                result.rows.map(
                    fila => ({

                        ordinal:
                            Number(
                                fila.ordinal
                            ),

                        ...normalizar(
                            recurso,
                            fila.fila_json
                        )

                    })
                );


            for (
                let i = 0;
                i < normalizados.length;
                i += INSERT_BATCH
            ) {

                await insertar(
                    recurso,
                    buildId,
                    normalizados.slice(
                        i,
                        i + INSERT_BATCH
                    )
                );

            }


            ultimoOrdinal =
                Number(
                    result.rows[
                        result.rows.length -
                        1
                    ].ordinal
                );


            total +=
                result.rows.length;


            if (
                total %
                10000 ===
                0
            ) {

                console.log(
                    `   ${total.toLocaleString("es-PE")} registros normalizados`
                );

            }

        }


        await pool.query(
            `
            INSERT INTO pronabec_portal_builds
            (
                recurso,
                active_build_id,
                total_rows,
                built_at,
                status,
                last_error
            )
            VALUES
            (
                $1,
                $2,
                $3,
                NOW(),
                'COMPLETADO',
                NULL
            )
            ON CONFLICT(recurso)
            DO UPDATE SET
                active_build_id = EXCLUDED.active_build_id,
                total_rows = EXCLUDED.total_rows,
                built_at = EXCLUDED.built_at,
                status = 'COMPLETADO',
                last_error = NULL
            `,
            [
                recurso,
                buildId,
                total
            ]
        );


        await pool.query(
            `
            DELETE FROM pronabec_portal
            WHERE
                recurso = $1
                AND build_id <> $2
            `,
            [
                recurso,
                buildId
            ]
        );


        console.log(
            `✅ ${recurso}: ${total.toLocaleString("es-PE")}`
        );

    } catch (
        error
    ) {

        await pool.query(
            `
            DELETE FROM pronabec_portal
            WHERE
                recurso = $1
                AND build_id = $2
            `,
            [
                recurso,
                buildId
            ]
        );


        await pool.query(
            `
            UPDATE pronabec_portal_builds
            SET
                status = 'ERROR',
                last_error = $2
            WHERE recurso = $1
            `,
            [
                recurso,
                String(
                    error.message ||
                    error
                )
                    .slice(
                        0,
                        4000
                    )
            ]
        );


        throw error;

    }

}


async function main() {

    console.log("");
    console.log("========================================================");
    console.log(" EDUPERÚ - CATÁLOGO NORMALIZADO PARA TODAS LAS PESTAÑAS");
    console.log("========================================================");


    await asegurarTablas();


    const syncs =
        await pool.query(
            `
            SELECT
                recurso,
                active_sync_id,
                total_rows
            FROM pronabec_sync
            WHERE
                status = 'COMPLETADO'
                AND active_sync_id IS NOT NULL
            ORDER BY recurso
            `
        );


    if (
        !syncs.rows.length
    ) {

        throw new Error(
            "No existen datasets PRONABEC sincronizados."
        );

    }


    for (
        const sync
        of syncs.rows
    ) {

        await construir(
            sync
        );

    }


    console.log("");
    console.log(
        "CATÁLOGO PARA TODAS LAS PESTAÑAS FINALIZADO ✅"
    );

}


main()
    .catch(
        error => {

            console.error("");
            console.error(
                "❌ No se pudo construir el catálogo."
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
