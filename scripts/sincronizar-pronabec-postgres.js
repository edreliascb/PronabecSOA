/* =========================================================
   EDUPERÚ - SINCRONIZAR DATASETS PRONABEC A POSTGRESQL

   Se recomienda ejecutarlo desde una PC con suficiente RAM.
   El CSV se procesa como STREAM y se inserta por lotes.
========================================================= */

require("dotenv").config();

const crypto =
    require("crypto");

const { Pool } =
    require("pg");

const { TextDecoder } =
    require("util");


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


const DATASETS = [

    {
        recurso:
            "ConvocatoriaCarreraVigentes",

        nombre:
            "Convocatorias Vigentes",

        tipo:
            "csv",

        paginas: [
            "https://www.datosabiertos.gob.pe/dataset/convocatorias-vigentes/resource/0be16455-3bf1-4927-b2cd-31de6d2f9adf",
            "https://www.datosabiertos.gob.pe/dataset/convocatorias-vigentes-pronabec"
        ]
    },

    {
        recurso:
            "CarrerasElegiblesNacional",

        nombre:
            "Carreras Elegibles Nacional",

        tipo:
            "csv",

        paginas: [
            "https://www.datosabiertos.gob.pe/dataset/convocatorias-carreras-elegibles-nacional-pronabec/resource/a7bab7ae-1213-4ad4-a5e5",
            "https://www.datosabiertos.gob.pe/dataset/convocatorias-carreras-elegibles-nacional-pronabec"
        ]
    },

    {
        recurso:
            "PostulacionesVigentes",

        nombre:
            "Postulaciones Vigentes",

        tipo:
            "csv",

        paginas: [
            "https://www.datosabiertos.gob.pe/dataset/postulaciones-vigentes-pronabec/resource/004e6380-e5dd-47d4-8ea6-21014a388d95",
            "https://www.datosabiertos.gob.pe/dataset/postulaciones-vigentes-pronabec"
        ]
    },

    {
        recurso:
            "Convenio",

        nombre:
            "Convenios interinstitucionales",

        tipo:
            "csv",

        paginas: [
            "https://www.datosabiertos.gob.pe/dataset/convenios-interinstitucionales-del-pronabec/resource/9fa99d9f-4d35-4f35-8162-0ecf8d9696a7",
            "https://www.datosabiertos.gob.pe/dataset/convenios-interinstitucionales-del-pronabec"
        ]
    },

    {
        recurso:
            "DocumentosSolicitadosABecarios",

        nombre:
            "Documentos solicitados a becarios",

        tipo:
            "html",

        paginas: [
            "https://datosabiertos.pronabec.gob.pe/dataset/DocumentosSolicitadosABecarios",
            "https://www.datosabiertos.gob.pe/dataset/documentos-solicitados-becarios-pronabec"
        ],

        opcional:
            true
    }

];


const BATCH_SIZE =
    Math.max(
        50,
        Math.min(
            500,
            Number(
                process.env.PRONABEC_SYNC_BATCH_SIZE ||
                200
            )
        )
    );



const STREAM_TIMEOUT_MS =
    Math.max(
        5 * 60 * 1000,
        Number(
            process.env.PRONABEC_SYNC_STREAM_TIMEOUT_MS ||
            60 * 60 * 1000
        )
    );


const USER_AGENT =
    "EduPeruSOA-Sync/1.0";


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


async function asegurarEsquema() {

    await pool.query(
        `
        CREATE TABLE IF NOT EXISTS pronabec_sync
        (
            recurso VARCHAR(120) PRIMARY KEY,
            active_sync_id UUID NULL,
            total_rows BIGINT NOT NULL DEFAULT 0,
            fuente_url TEXT NULL,
            synced_at TIMESTAMPTZ NULL,
            status VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
            last_error TEXT NULL
        );

        CREATE TABLE IF NOT EXISTS pronabec_catalogo
        (
            id BIGSERIAL PRIMARY KEY,
            recurso VARCHAR(120) NOT NULL,
            sync_id UUID NOT NULL,
            ordinal BIGINT NOT NULL,
            fila_json JSONB NOT NULL,
            imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS
            ix_pronabec_catalogo_recurso_sync
        ON pronabec_catalogo
            (recurso, sync_id, ordinal);
        `
    );

}


async function fetchSeguro(
    url,
    opciones = {}
) {

    const respuesta =
        await fetch(
            url,
            {
                redirect:
                    "follow",

                headers: {
                    "User-Agent":
                        USER_AGENT,

                    Accept:
                        opciones.accept ||
                        "*/*"
                },

                signal:
                    AbortSignal.timeout(
                        opciones.timeout ||
                        30000
                    )
            }
        );


    if (!respuesta.ok) {

        throw new Error(
            `HTTP ${respuesta.status} en ${url}`
        );

    }


    return respuesta;

}


function limpiarHtml(
    texto
) {

    return String(
        texto ||
        ""
    )
        .replace(
            /<script\b[\s\S]*?<\/script>/gi,
            " "
        )
        .replace(
            /<style\b[\s\S]*?<\/style>/gi,
            " "
        )
        .replace(
            /<[^>]+>/g,
            " "
        )
        .replace(
            /&nbsp;/gi,
            " "
        )
        .replace(
            /&amp;/gi,
            "&"
        )
        .replace(
            /&quot;/gi,
            '"'
        )
        .replace(
            /&#39;/gi,
            "'"
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


function extraerEnlaces(
    html,
    baseUrl
) {

    const enlaces =
        [];


    const regex =
        /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;


    let match;


    while (
        (
            match =
                regex.exec(
                    html
                )
        )
    ) {

        try {

            const url =
                new URL(
                    match[1]
                        .replace(
                            /&amp;/g,
                            "&"
                        ),
                    baseUrl
                )
                    .toString();


            enlaces.push({

                url,

                texto:
                    limpiarHtml(
                        match[2]
                    )

            });

        } catch {
            // Ignorar enlaces no válidos.
        }

    }


    return enlaces;

}


async function descubrirCsv(
    urlInicial,
    visitadas = new Set(),
    profundidad = 0
) {

    if (
        !urlInicial ||
        visitadas.has(
            urlInicial
        ) ||
        profundidad >
        3
    ) {

        return null;

    }


    visitadas.add(
        urlInicial
    );


    if (
        /\.csv(?:$|\?)/i.test(
            urlInicial
        )
    ) {

        return urlInicial;

    }


    const respuesta =
        await fetchSeguro(
            urlInicial,
            {
                accept:
                    "text/html,*/*",
                timeout:
                    30000
            }
        );


    const html =
        await respuesta.text();


    const enlaces =
        extraerEnlaces(
            html,
            respuesta.url
        );


    const csvDirecto =
        enlaces.find(
            item =>
                /\.csv(?:$|\?)/i
                    .test(
                        item.url
                    )
        );


    if (csvDirecto) {
        return csvDirecto.url;
    }


    const candidatos =
        enlaces.filter(
            item => {

                const texto =
                    item.texto
                        .toLowerCase();


                return (
                    texto.includes(
                        "descargar"
                    ) ||
                    texto.includes(
                        "download"
                    ) ||
                    item.url.includes(
                        "/download"
                    ) ||
                    item.url.includes(
                        "/resource/"
                    )
                );

            }
        );


    for (
        const candidato
        of candidatos.slice(
            0,
            12
        )
    ) {

        try {

            const encontrado =
                await descubrirCsv(
                    candidato.url,
                    visitadas,
                    profundidad + 1
                );


            if (encontrado) {
                return encontrado;
            }

        } catch {
            // Continuar con otro candidato.
        }

    }


    return null;

}


function detectarSeparador(
    cabecera
) {

    const candidatos =
        [",", ";", "\t", "|"];


    let mejor =
        ",";


    let mayor =
        -1;


    for (
        const separador
        of candidatos
    ) {

        let cantidad =
            0;

        let comillas =
            false;


        for (
            let i = 0;
            i < cabecera.length;
            i++
        ) {

            const c =
                cabecera[i];


            if (
                c ===
                '"'
            ) {

                if (
                    comillas &&
                    cabecera[i + 1] ===
                    '"'
                ) {

                    i++;
                    continue;

                }


                comillas =
                    !comillas;

                continue;

            }


            if (
                !comillas &&
                c ===
                    separador
            ) {

                cantidad++;

            }

        }


        if (
            cantidad >
            mayor
        ) {

            mayor =
                cantidad;

            mejor =
                separador;

        }

    }


    return mejor;

}


function parsearFila(
    filaTexto,
    separador
) {

    const salida =
        [];

    let campo =
        "";

    let comillas =
        false;


    for (
        let i = 0;
        i < filaTexto.length;
        i++
    ) {

        const c =
            filaTexto[i];


        if (
            c ===
            '"'
        ) {

            if (
                comillas &&
                filaTexto[i + 1] ===
                    '"'
            ) {

                campo +=
                    '"';

                i++;

            } else {

                comillas =
                    !comillas;

            }


            continue;

        }


        if (
            !comillas &&
            c ===
                separador
        ) {

            salida.push(
                campo
            );

            campo =
                "";

            continue;

        }


        campo +=
            c;

    }


    salida.push(
        campo
    );


    return salida;

}


async function* filasCsvStream(
    body
) {

    const reader =
        body.getReader();


    const decoder =
        new TextDecoder(
            "utf-8",
            {
                fatal:
                    false
            }
        );


    let buffer =
        "";

    let fila =
        "";

    let comillas =
        false;


    while (
        true
    ) {

        const {
            value,
            done
        } =
            await reader.read();


        if (done) {
            break;
        }


        buffer +=
            decoder.decode(
                value,
                {
                    stream:
                        true
                }
            );


        let inicio =
            0;


        for (
            let i = 0;
            i < buffer.length;
            i++
        ) {

            const c =
                buffer[i];


            if (
                c ===
                '"'
            ) {

                if (
                    comillas &&
                    buffer[i + 1] ===
                        '"'
                ) {

                    i++;
                    continue;

                }


                comillas =
                    !comillas;

            }


            if (
                !comillas &&
                (
                    c ===
                        "\n" ||
                    c ===
                        "\r"
                )
            ) {

                fila +=
                    buffer.slice(
                        inicio,
                        i
                    );


                if (
                    fila.length >
                    0
                ) {

                    yield fila;

                }


                fila =
                    "";


                if (
                    c ===
                        "\r" &&
                    buffer[i + 1] ===
                        "\n"
                ) {

                    i++;

                }


                inicio =
                    i + 1;

            }

        }


        fila +=
            buffer.slice(
                inicio
            );


        /*
           Si estamos dentro de comillas, el contenido forma
           parte de una fila multilinea. Si no, fila contiene
           únicamente el fragmento de la última línea.
        */
        buffer =
            "";

    }


    fila +=
        decoder.decode();


    if (
        fila.trim()
    ) {

        yield fila;

    }

}


function normalizarCabeceras(
    valores
) {

    const usadas =
        new Map();


    return valores.map(
        (
            valor,
            indice
        ) => {

            let base =
                String(
                    valor ||
                    `CAMPO_${indice + 1}`
                )
                    .replace(
                        /^\uFEFF/,
                        ""
                    )
                    .trim();


            if (!base) {

                base =
                    `CAMPO_${indice + 1}`;

            }


            const clave =
                base.toLowerCase();


            const cantidad =
                usadas.get(
                    clave
                ) ||
                0;


            usadas.set(
                clave,
                cantidad + 1
            );


            return cantidad
                ? `${base}_${cantidad + 1}`
                : base;

        }
    );

}


async function insertarLote(
    recurso,
    syncId,
    inicioOrdinal,
    filas
) {

    if (
        filas.length ===
        0
    ) {

        return;

    }


    const valores =
        [];

    const placeholders =
        [];


    filas.forEach(
        (
            fila,
            indice
        ) => {

            const base =
                valores.length;


            valores.push(
                recurso,
                syncId,
                inicioOrdinal +
                    indice,
                JSON.stringify(
                    fila
                )
            );


            placeholders.push(
                `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}::jsonb)`
            );

        }
    );


    await pool.query(
        `
        INSERT INTO pronabec_catalogo
            (
                recurso,
                sync_id,
                ordinal,
                fila_json
            )
        VALUES
            ${placeholders.join(",")}
        `,
        valores
    );

}


async function importarCsv(
    dataset,
    csvUrl,
    syncId
) {

    const respuesta =
        await fetchSeguro(
            csvUrl,
            {
                accept:
                    "text/csv,*/*",
                timeout:
                    STREAM_TIMEOUT_MS
            }
        );


    if (!respuesta.body) {

        throw new Error(
            "La respuesta CSV no tiene stream."
        );

    }


    let cabeceras =
        null;

    let separador =
        null;

    let lote =
        [];

    let total =
        0;


    for await (
        const filaTexto
        of filasCsvStream(
            respuesta.body
        )
    ) {

        if (
            !cabeceras
        ) {

            separador =
                detectarSeparador(
                    filaTexto
                );


            cabeceras =
                normalizarCabeceras(
                    parsearFila(
                        filaTexto,
                        separador
                    )
                );


            continue;

        }


        const valores =
            parsearFila(
                filaTexto,
                separador
            );


        if (
            valores.every(
                valor =>
                    String(valor)
                        .trim() ===
                    ""
            )
        ) {

            continue;

        }


        const objeto =
            {};


        cabeceras.forEach(
            (
                clave,
                indice
            ) => {

                objeto[clave] =
                    String(
                        valores[indice] ??
                        ""
                    )
                        .trim();

            }
        );


        lote.push(
            objeto
        );


        if (
            lote.length >=
            BATCH_SIZE
        ) {

            await insertarLote(
                dataset.recurso,
                syncId,
                total + 1,
                lote
            );


            total +=
                lote.length;


            if (
                total %
                5000 ===
                0
            ) {

                console.log(
                    `   ${dataset.nombre}: ${total.toLocaleString("es-PE")} filas`
                );

            }


            lote =
                [];

        }

    }


    if (
        lote.length
    ) {

        await insertarLote(
            dataset.recurso,
            syncId,
            total + 1,
            lote
        );


        total +=
            lote.length;

    }


    return total;

}


function parsearTablaHtml(
    html
) {

    const tabla =
        String(
            html ||
            ""
        )
            .match(
                /<table\b[^>]*>([\s\S]*?)<\/table>/i
            );


    if (!tabla) {
        return [];
    }


    const filasHtml =
        [
            ...tabla[1]
                .matchAll(
                    /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
                )
        ]
            .map(
                match =>
                    match[1]
            );


    if (
        filasHtml.length <
        2
    ) {

        return [];

    }


    const celdas =
        fila =>
            [
                ...fila.matchAll(
                    /<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi
                )
            ]
                .map(
                    match =>
                        limpiarHtml(
                            match[1]
                        )
                );


    const cabeceras =
        normalizarCabeceras(
            celdas(
                filasHtml[0]
            )
        );


    return filasHtml
        .slice(
            1
        )
        .map(
            fila => {

                const valores =
                    celdas(
                        fila
                    );


                const objeto =
                    {};


                cabeceras.forEach(
                    (
                        clave,
                        indice
                    ) => {

                        objeto[clave] =
                            valores[indice] ||
                            "";

                    }
                );


                return objeto;

            }
        )
        .filter(
            fila =>
                Object.values(
                    fila
                )
                    .some(
                        valor =>
                            String(valor)
                                .trim()
                    )
        );

}


async function importarHtml(
    dataset,
    url,
    syncId
) {

    const respuesta =
        await fetchSeguro(
            url,
            {
                accept:
                    "text/html,*/*",
                timeout:
                    30000
            }
        );


    const html =
        await respuesta.text();


    const filas =
        parsearTablaHtml(
            html
        );


    if (
        filas.length ===
        0
    ) {

        throw new Error(
            "La publicación no contiene una tabla estructurada utilizable."
        );

    }


    let total =
        0;


    for (
        let i = 0;
        i < filas.length;
        i += BATCH_SIZE
    ) {

        const lote =
            filas.slice(
                i,
                i + BATCH_SIZE
            );


        await insertarLote(
            dataset.recurso,
            syncId,
            total + 1,
            lote
        );


        total +=
            lote.length;

    }


    return total;

}


async function resolverFuente(
    dataset
) {

    if (
        dataset.tipo ===
        "html"
    ) {

        for (
            const pagina
            of dataset.paginas
        ) {

            try {

                const respuesta =
                    await fetchSeguro(
                        pagina,
                        {
                            accept:
                                "text/html,*/*",
                            timeout:
                                30000
                        }
                    );


                return {
                    tipo:
                        "html",
                    url:
                        respuesta.url
                };

            } catch {
                // Probar siguiente.
            }

        }


        return null;

    }


    for (
        const pagina
        of dataset.paginas
    ) {

        try {

            const csv =
                await descubrirCsv(
                    pagina
                );


            if (csv) {

                return {
                    tipo:
                        "csv",
                    url:
                        csv
                };

            }

        } catch (
            error
        ) {

            console.warn(
                `   No se pudo resolver ${pagina}: ${error.message}`
            );

        }

    }


    return null;

}


async function sincronizarDataset(
    dataset
) {

    console.log("");
    console.log(
        `▶ ${dataset.nombre}`
    );


    const syncId =
        crypto.randomUUID();


    await pool.query(
        `
        INSERT INTO pronabec_sync
            (
                recurso,
                status,
                last_error
            )
        VALUES
            ($1, 'SINCRONIZANDO', NULL)
        ON CONFLICT (recurso)
        DO UPDATE SET
            status = 'SINCRONIZANDO',
            last_error = NULL
        `,
        [
            dataset.recurso
        ]
    );


    try {

        const fuente =
            await resolverFuente(
                dataset
            );


        if (!fuente) {

            throw new Error(
                "No se pudo localizar una fuente estructurada oficial."
            );

        }


        console.log(
            `   Fuente: ${fuente.url}`
        );


        const total =
            fuente.tipo ===
                "csv"
                ? await importarCsv(
                    dataset,
                    fuente.url,
                    syncId
                )
                : await importarHtml(
                    dataset,
                    fuente.url,
                    syncId
                );


        await pool.query(
            `
            UPDATE pronabec_sync
            SET
                active_sync_id = $2,
                total_rows = $3,
                fuente_url = $4,
                synced_at = NOW(),
                status = 'COMPLETADO',
                last_error = NULL
            WHERE recurso = $1
            `,
            [
                dataset.recurso,
                syncId,
                total,
                fuente.url
            ]
        );


        await pool.query(
            `
            DELETE FROM pronabec_catalogo
            WHERE
                recurso = $1
                AND sync_id <> $2
            `,
            [
                dataset.recurso,
                syncId
            ]
        );


        console.log(
            `✅ ${dataset.nombre}: ${total.toLocaleString("es-PE")} registros sincronizados`
        );


        return {
            recurso:
                dataset.recurso,
            total,
            ok:
                true
        };

    } catch (
        error
    ) {

        await pool.query(
            `
            DELETE FROM pronabec_catalogo
            WHERE
                recurso = $1
                AND sync_id = $2
            `,
            [
                dataset.recurso,
                syncId
            ]
        );


        await pool.query(
            `
            UPDATE pronabec_sync
            SET
                status = 'ERROR',
                last_error = $2
            WHERE recurso = $1
            `,
            [
                dataset.recurso,
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


        if (
            dataset.opcional
        ) {

            console.warn(
                `⚠️ ${dataset.nombre}: ${error.message}`
            );


            return {
                recurso:
                    dataset.recurso,
                total:
                    0,
                ok:
                    false,
                opcional:
                    true
            };

        }


        throw error;

    }

}


async function main() {

    console.log("");
    console.log("========================================================");
    console.log(" EDUPERÚ - SINCRONIZACIÓN PRONABEC -> POSTGRESQL");
    console.log("========================================================");
    console.log("");
    console.log(
        `Lote: ${BATCH_SIZE} registros`
    );

    console.log(
        `Timeout stream: ${Math.round(STREAM_TIMEOUT_MS / 60000)} minutos`
    );


    await asegurarEsquema();


    const resultados =
        [];


    for (
        const dataset
        of DATASETS
    ) {

        resultados.push(
            await sincronizarDataset(
                dataset
            )
        );

    }


    console.log("");
    console.log("========================================================");
    console.log(" RESUMEN");
    console.log("========================================================");


    for (
        const resultado
        of resultados
    ) {

        console.log(
            `${resultado.ok ? "✅" : "⚠️"} ${resultado.recurso}: ${resultado.total.toLocaleString("es-PE")}`
        );

    }


    console.log("");
    console.log(
        "SINCRONIZACIÓN FINALIZADA ✅"
    );

}


main()
    .catch(
        error => {

            console.error("");
            console.error(
                "❌ SINCRONIZACIÓN DETENIDA"
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
