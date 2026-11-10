const {
    obtenerPool,
    sql
} =
    require("../config/database");

const requisitoService =
    require("./requisitoElegibilidad.service");

const {
    normalizarTexto,
    valorTexto
} =
    require("./serviciosEmpresariales.helper");


async function obtenerPerfil(
    idUsuario
) {

    const pool =
        await obtenerPool();


    const resultado =
        await pool
            .request()

            .input(
                "idUsuario",
                sql.Int,
                Number(
                    idUsuario
                )
            )

            .query(
                `
                SELECT TOP 1
                    departamento,
                    provincia,
                    distrito,
                    carrera_interes,
                    nivel_estudio,
                    institucion
                FROM dbo.PerfilesUsuario
                WHERE id_usuario = @idUsuario
                `
            );


    return resultado.recordset[0] ||
        null;

}


function evaluarCamposEstructurados(
    requisito,
    perfil
) {

    const fuente =
        requisito.fuenteRegistro ||
        {};


    const reglas = [

        {
            aliases:
                [
                    "departamento",
                    "region",
                    "región"
                ],
            valorUsuario:
                perfil.departamento,
            campo:
                "Departamento"
        },

        {
            aliases:
                [
                    "provincia"
                ],
            valorUsuario:
                perfil.provincia,
            campo:
                "Provincia"
        },

        {
            aliases:
                [
                    "distrito"
                ],
            valorUsuario:
                perfil.distrito,
            campo:
                "Distrito"
        },

        {
            aliases:
                [
                    "carrera",
                    "carrera_interes",
                    "programa_estudio"
                ],
            valorUsuario:
                perfil.carrera_interes,
            campo:
                "Carrera"
        },

        {
            aliases:
                [
                    "nivel_estudio",
                    "nivel"
                ],
            valorUsuario:
                perfil.nivel_estudio,
            campo:
                "Nivel de estudio"
        }

    ];


    const evaluadas =
        [];


    for (
        const regla
        of reglas
    ) {

        const requerido =
            valorTexto(
                fuente,
                regla.aliases
            );


        if (!requerido) {

            continue;

        }


        const cumple =
            Boolean(
                regla.valorUsuario
            ) &&
            normalizarTexto(
                requerido
            )
                .includes(
                    normalizarTexto(
                        regla.valorUsuario
                    )
                );


        evaluadas.push({

            campo:
                regla.campo,

            requerido,

            valorUsuario:
                regla.valorUsuario ||
                null,

            cumple

        });

    }


    return evaluadas;

}


async function evaluarElegibilidad(
    idUsuario,
    oportunidadId
) {

    const perfil =
        await obtenerPerfil(
            idUsuario
        );


    if (!perfil) {

        return {

            servicio:
                "EvaluacionElegibilidadService",

            estado:
                "PERFIL_INCOMPLETO",

            disponible:
                true,

            oportunidadId:
                String(
                    oportunidadId
                ),

            mensaje:
                "Completa tu perfil antes de realizar la preevaluación."

        };

    }


    const requisitos =
        await requisitoService
            .listarRequisitosPorOportunidad(
                oportunidadId
            );


    if (
        requisitos.datos.length ===
        0
    ) {

        return {

            servicio:
                "EvaluacionElegibilidadService",

            estado:
                "NO_DETERMINABLE",

            disponible:
                true,

            oportunidadId:
                String(
                    oportunidadId
                ),

            oportunidad:
                requisitos.oportunidad,

            perfil,

            requisitosEvaluados:
                0,

            evaluaciones:
                [],

            mensaje:
                "La fuente oficial no contiene reglas estructuradas suficientes para determinar elegibilidad automáticamente.",

            advertencia:
                "La decisión oficial de elegibilidad corresponde a PRONABEC."

        };

    }


    const evaluaciones =
        requisitos.datos.map(
            requisito => {

                const reglas =
                    evaluarCamposEstructurados(
                        requisito,
                        perfil
                    );


                const estado =
                    reglas.length ===
                    0
                        ? "REQUIERE_VALIDACION"
                        : reglas.every(
                            regla =>
                                regla.cumple
                        )
                            ? "CUMPLE"
                            : "NO_CUMPLE";


                return {

                    requisitoId:
                        requisito.id,

                    requisito:
                        requisito.nombre,

                    estado,

                    reglas

                };

            }
        );


    const noCumple =
        evaluaciones.filter(
            item =>
                item.estado ===
                "NO_CUMPLE"
        )
            .length;


    const requiereValidacion =
        evaluaciones.filter(
            item =>
                item.estado ===
                "REQUIERE_VALIDACION"
        )
            .length;


    const estado =
        noCumple > 0
            ? "NO_CUMPLE"
            : requiereValidacion > 0
                ? "REQUIERE_VALIDACION"
                : "CUMPLE_PREEVALUACION";


    return {

        servicio:
            "EvaluacionElegibilidadService",

        estado,

        disponible:
            true,

        oportunidadId:
            String(
                oportunidadId
            ),

        oportunidad:
            requisitos.oportunidad,

        perfil,

        requisitosEvaluados:
            evaluaciones.length,

        resumen: {

            cumple:
                evaluaciones.filter(
                    item =>
                        item.estado ===
                        "CUMPLE"
                )
                    .length,

            noCumple,

            requiereValidacion

        },

        evaluaciones,

        advertencia:
            "Esta es una preevaluación informativa. La decisión oficial corresponde a PRONABEC."

    };

}


module.exports = {

    evaluarElegibilidad

};
