const recomendacionService =
    require("./recomendacionEducativa.service");

const cronogramaService =
    require("./cronogramaConvocatoria.service");

const requisitoService =
    require("./requisitoElegibilidad.service");


async function obtenerOrientacion(
    idUsuario
) {

    const [
        recomendaciones,
        cronogramas,
        requisitos
    ] =
        await Promise.all([

            recomendacionService
                .obtenerRecomendaciones(
                    idUsuario
                ),

            cronogramaService
                .listarCronogramas(),

            requisitoService
                .listarRequisitos()

        ]);


    const acciones =
        [];


    if (
        recomendaciones.estado ===
        "PERFIL_INCOMPLETO"
    ) {

        acciones.push({

            prioridad:
                1,

            accion:
                "COMPLETAR_PERFIL",

            mensaje:
                "Completa tu perfil para mejorar la personalización de las recomendaciones."

        });

    } else if (
        recomendaciones.total >
        0
    ) {

        acciones.push({

            prioridad:
                1,

            accion:
                "REVISAR_RECOMENDACIONES",

            mensaje:
                `Revisa las ${Math.min(
                    recomendaciones.total,
                    5
                )} primeras recomendaciones con mayor coincidencia.`

        });

    }


    if (
        cronogramas.total >
        0
    ) {

        acciones.push({

            prioridad:
                2,

            accion:
                "REVISAR_CRONOGRAMA",

            mensaje:
                "Consulta las fechas oficiales de las convocatorias antes de iniciar una postulación."

        });

    }


    if (
        requisitos.total >
        0
    ) {

        acciones.push({

            prioridad:
                3,

            accion:
                "REVISAR_REQUISITOS",

            mensaje:
                "Verifica los requisitos oficiales disponibles para la oportunidad de interés."

        });

    } else {

        acciones.push({

            prioridad:
                3,

            accion:
                "VERIFICAR_FUENTE_OFICIAL",

            mensaje:
                "No hay reglas estructuradas suficientes para validar requisitos automáticamente; revisa la documentación oficial de PRONABEC."

        });

    }


    return {

        servicio:
            "OrientacionEducativaService",

        estado:
            "OPERATIVO",

        perfilUtilizado:
            recomendaciones.perfilUtilizado ||
            null,

        resumen: {

            recomendaciones:
                recomendaciones.total ||
                0,

            eventosCronograma:
                cronogramas.total ||
                0,

            requisitosEstructurados:
                requisitos.total ||
                0

        },

        recomendaciones:
            (
                recomendaciones.datos ||
                []
            )
                .slice(
                    0,
                    5
                ),

        proximasAcciones:
            acciones,

        advertencia:
            "La orientación es informativa y no reemplaza la evaluación ni la decisión oficial de PRONABEC."

    };

}


module.exports = {

    obtenerOrientacion

};
