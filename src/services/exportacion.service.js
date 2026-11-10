const busquedaAvanzadaService =
    require("./busquedaAvanzada.service");

const reporteService =
    require("./reporte.service");


function escaparCSV(
    valor
) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "";

    }


    let texto;


    if (
        typeof valor ===
        "object"
    ) {

        texto =
            JSON.stringify(
                valor
            );

    } else {

        texto =
            String(
                valor
            );

    }


    if (
        texto.includes(",") ||
        texto.includes("\"") ||
        texto.includes("\n") ||
        texto.includes("\r")
    ) {

        return `"${texto.replace(/"/g, "\"\"")}"`;

    }


    return texto;

}


function arregloACSV(
    datos
) {

    if (
        !Array.isArray(
            datos
        ) ||
        datos.length ===
        0
    ) {

        return "";

    }


    const columnas =
        Array.from(
            datos.reduce(
                (
                    acumulado,
                    item
                ) => {

                    Object.keys(
                        item ||
                        {}
                    )
                        .forEach(
                            clave =>
                                acumulado.add(
                                    clave
                                )
                        );


                    return acumulado;

                },
                new Set()
            )
        );


    const lineas = [

        columnas
            .map(
                escaparCSV
            )
            .join(",")

    ];


    datos.forEach(
        item => {

            lineas.push(

                columnas
                    .map(
                        columna =>
                            escaparCSV(
                                item?.[columna]
                            )
                    )
                    .join(",")

            );

        }
    );


    return lineas.join(
        "\r\n"
    );

}


async function exportarBusqueda(
    filtros = {},
    formato = "json"
) {

    const resultado =
        await busquedaAvanzadaService
            .buscar(
                filtros
            );


    if (
        String(
            formato
        )
            .toLowerCase() ===
        "csv"
    ) {

        return {

            servicio:
                "ExportacionService",

            formato:
                "csv",

            nombreArchivo:
                "busqueda_eduperu.csv",

            contenido:
                arregloACSV(
                    resultado.datos
                )

        };

    }


    return {

        servicio:
            "ExportacionService",

        formato:
            "json",

        nombreArchivo:
            "busqueda_eduperu.json",

        contenido:
            resultado

    };

}


async function exportarReporteResumen(
    formato = "json"
) {

    const resultado =
        await reporteService
            .obtenerResumen();


    if (
        String(
            formato
        )
            .toLowerCase() ===
        "csv"
    ) {

        return {

            servicio:
                "ExportacionService",

            formato:
                "csv",

            nombreArchivo:
                "reporte_resumen_eduperu.csv",

            contenido:
                arregloACSV([
                    resultado.resumen
                ])

        };

    }


    return {

        servicio:
            "ExportacionService",

        formato:
            "json",

        nombreArchivo:
            "reporte_resumen_eduperu.json",

        contenido:
            resultado

    };

}


module.exports = {

    exportarBusqueda,

    exportarReporteResumen,

    arregloACSV

};
