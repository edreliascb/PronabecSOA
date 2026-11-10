const convocatoriaService =
    require("./convocatoria.service");

const {
    extraerArreglo,
    valorTexto,
    crearError
} =
    require("./serviciosEmpresariales.helper");


function transformar(
    registros
) {

    return registros
        .map(
            (
                registro,
                indice
            ) => {

                const convocatoria =
                    valorTexto(
                        registro,
                        [
                            "Concurso",
                            "Convocatoria",
                            "Nombre_Convocatoria",
                            "Beca"
                        ]
                    );


                const etapa =
                    valorTexto(
                        registro,
                        [
                            "Momento",
                            "Etapa",
                            "Fase"
                        ]
                    );


                const fechaInicio =
                    valorTexto(
                        registro,
                        [
                            "Fecha_Inicio",
                            "FechaInicio",
                            "Inicio"
                        ]
                    );


                const fechaFin =
                    valorTexto(
                        registro,
                        [
                            "Fecha_Fin",
                            "FechaFin",
                            "Fin"
                        ]
                    );


                if (
                    !convocatoria &&
                    !etapa &&
                    !fechaInicio &&
                    !fechaFin
                ) {

                    return null;

                }


                return {

                    id:
                        indice + 1,

                    convocatoria,

                    etapa,

                    fechaInicio,

                    fechaFin,

                    bases:
                        valorTexto(
                            registro,
                            [
                                "Bases"
                            ]
                        ),

                    documentacionCronograma:
                        valorTexto(
                            registro,
                            [
                                "DocumentacionCronograma",
                                "Documentacion_Cronograma",
                                "DocumentoCronograma"
                            ]
                        )

                };

            }
        )
        .filter(Boolean);

}


async function listarCronogramas() {

    const respuesta =
        await convocatoriaService
            .listarConvocatorias(
                1,
                200
            );


    const datos =
        transformar(
            extraerArreglo(
                respuesta
            )
        );


    return {

        servicio:
            "CronogramaConvocatoriaService",

        tipo:
            "Servicio de Entidad / Calendario",

        fuente:
            respuesta?.datos?.fuente ||
            respuesta?.fuente ||
            "ConvocatoriaService",

        fuenteOficial:
            respuesta?.datos?.fuenteOficial ??
            respuesta?.fuenteOficial ??
            true,

        disponible:
            respuesta?.datos?.disponible ??
            respuesta?.disponible ??
            true,

        total:
            datos.length,

        datos

    };

}


async function obtenerPorConvocatoria(
    id
) {

    const resultado =
        await listarCronogramas();


    const indice =
        Number(
            id
        ) -
        1;


    if (
        !Number.isInteger(
            indice
        ) ||
        indice < 0 ||
        indice >=
        resultado.datos.length
    ) {

        throw crearError(
            "Convocatoria no encontrada.",
            404
        );

    }


    const referencia =
        resultado.datos[
            indice
        ];


    const etapas =
        resultado.datos.filter(
            item =>
                item.convocatoria ===
                referencia.convocatoria
        );


    return {

        servicio:
            "CronogramaConvocatoriaService",

        convocatoria:
            referencia.convocatoria,

        totalEtapas:
            etapas.length,

        etapas

    };

}


module.exports = {

    listarCronogramas,

    obtenerPorConvocatoria

};
