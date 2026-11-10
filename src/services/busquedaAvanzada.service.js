const convocatoriaService =
    require("./convocatoria.service");

const carreraService =
    require("./carrera.service");

const institucionService =
    require("./institucion.service");

const regionService =
    require("./region.service");


function normalizar(
    texto
) {

    return String(
        texto ??
        ""
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toUpperCase()
        .trim();

}


function coincide(
    objeto,
    termino
) {

    if (!termino) {
        return true;
    }


    let texto;


    try {

        texto =
            JSON.stringify(
                objeto
            );

    } catch {

        texto =
            String(
                objeto ??
                ""
            );

    }


    return normalizar(
        texto
    )
        .includes(
            normalizar(
                termino
            )
        );

}


function extraerDatos(
    respuesta
) {

    if (
        Array.isArray(
            respuesta
        )
    ) {

        return respuesta;

    }


    if (
        Array.isArray(
            respuesta?.datos
        )
    ) {

        return respuesta.datos;

    }


    if (
        Array.isArray(
            respuesta?.resultado
        )
    ) {

        return respuesta.resultado;

    }


    if (
        Array.isArray(
            respuesta?.resultado?.datos
        )
    ) {

        return respuesta.resultado.datos;

    }


    return [];

}


async function buscar(
    filtros = {}
) {

    const texto =
        String(
            filtros.texto ??
            ""
        )
            .trim();


    const tipo =
        normalizar(
            filtros.tipo ??
            "TODOS"
        );


    const region =
        String(
            filtros.region ??
            ""
        )
            .trim();


    const [
        convocatorias,
        carreras,
        instituciones,
        regiones
    ] =
        await Promise.all([
            convocatoriaService
                .listarConvocatorias(
                    1,
                    200
                ),
            carreraService
                .listarCarreras(),
            institucionService
                .listarInstituciones(),
            regionService
                .listarRegiones()
        ]);


    const fuentes = [

        {
            tipo:
                "CONVOCATORIA",
            datos:
                extraerDatos(
                    convocatorias
                )
        },

        {
            tipo:
                "CARRERA",
            datos:
                extraerDatos(
                    carreras
                )
        },

        {
            tipo:
                "INSTITUCION",
            datos:
                extraerDatos(
                    instituciones
                )
        },

        {
            tipo:
                "REGION",
            datos:
                extraerDatos(
                    regiones
                )
        }

    ];


    const resultados =
        [];


    for (
        const fuente
        of fuentes
    ) {

        if (
            tipo !==
            "TODOS" &&
            tipo !==
            fuente.tipo
        ) {

            continue;

        }


        fuente.datos
            .forEach(
                (
                    item,
                    indice
                ) => {

                    if (
                        texto &&
                        !coincide(
                            item,
                            texto
                        )
                    ) {

                        return;

                    }


                    if (
                        region &&
                        !coincide(
                            item,
                            region
                        )
                    ) {

                        return;

                    }


                    resultados.push({

                        tipo:
                            fuente.tipo,

                        id:
                            item.id ??
                            item.id_convocatoria ??
                            item.codigo ??
                            indice + 1,

                        titulo:
                            item.nombre ??
                            item.Concurso ??
                            item.convocatoria ??
                            item.carrera ??
                            item.institucion ??
                            item.departamento ??
                            `Registro ${indice + 1}`,

                        datos:
                            item

                    });

                }
            );

    }


    return {

        servicio:
            "BusquedaAvanzadaService",

        filtros: {

            texto:
                texto ||
                null,

            tipo,

            region:
                region ||
                null

        },

        total:
            resultados.length,

        datos:
            resultados.slice(
                0,
                100
            ),

        limite:
            100

    };

}


module.exports = {

    buscar

};
