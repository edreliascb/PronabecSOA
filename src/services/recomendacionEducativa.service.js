const {
    obtenerPool,
    sql
} =
    require("../config/database");

const convocatoriaService =
    require("./convocatoria.service");

const carreraService =
    require("./carrera.service");

const {
    normalizarTexto,
    extraerArreglo,
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


function puntuar(
    texto,
    perfil
) {

    const contenido =
        normalizarTexto(
            texto
        );


    let puntos =
        0;


    const coincidencias =
        [];


    const criterios = [

        {
            nombre:
                "Carrera de interés",
            valor:
                perfil.carrera_interes,
            puntos:
                5
        },

        {
            nombre:
                "Departamento",
            valor:
                perfil.departamento,
            puntos:
                3
        },

        {
            nombre:
                "Provincia",
            valor:
                perfil.provincia,
            puntos:
                2
        },

        {
            nombre:
                "Distrito",
            valor:
                perfil.distrito,
            puntos:
                2
        },

        {
            nombre:
                "Nivel de estudio",
            valor:
                perfil.nivel_estudio,
            puntos:
                1
        },

        {
            nombre:
                "Institución",
            valor:
                perfil.institucion,
            puntos:
                1
        }

    ];


    criterios.forEach(
        criterio => {

            const valor =
                normalizarTexto(
                    criterio.valor
                );


            if (
                valor &&
                contenido.includes(
                    valor
                )
            ) {

                puntos +=
                    criterio.puntos;


                coincidencias.push(
                    criterio.nombre
                );

            }

        }
    );


    return {

        puntos,

        coincidencias

    };

}


async function obtenerRecomendaciones(
    idUsuario
) {

    const perfil =
        await obtenerPerfil(
            idUsuario
        );


    if (!perfil) {

        return {

            servicio:
                "RecomendacionEducativaService",

            estado:
                "PERFIL_INCOMPLETO",

            total:
                0,

            datos:
                [],

            mensaje:
                "Completa tu perfil para obtener recomendaciones personalizadas."

        };

    }


    const [
        convocatorias,
        carreras
    ] =
        await Promise.all([
            convocatoriaService
                .listarConvocatorias(
                    1,
                    200
                ),
            carreraService
                .listarCarreras()
        ]);


    const recomendaciones =
        [];


    extraerArreglo(
        convocatorias
    )
        .forEach(
            (
                registro,
                indice
            ) => {

                const texto =
                    JSON.stringify(
                        registro
                    );


                const score =
                    puntuar(
                        texto,
                        perfil
                    );


                if (
                    score.puntos >
                    0
                ) {

                    recomendaciones.push({

                        tipo:
                            "CONVOCATORIA",

                        id:
                            indice + 1,

                        titulo:
                            valorTexto(
                                registro,
                                [
                                    "Concurso",
                                    "Convocatoria",
                                    "Beca",
                                    "Nombre"
                                ]
                            ) ||
                            `Convocatoria ${indice + 1}`,

                        puntaje:
                            score.puntos,

                        coincidencias:
                            score.coincidencias,

                        fuente:
                            "ConvocatoriaService"

                    });

                }

            }
        );


    extraerArreglo(
        carreras
    )
        .forEach(
            carrera => {

                const score =
                    puntuar(
                        JSON.stringify(
                            carrera
                        ),
                        perfil
                    );


                if (
                    score.puntos >
                    0
                ) {

                    recomendaciones.push({

                        tipo:
                            "CARRERA",

                        id:
                            carrera.id,

                        titulo:
                            carrera.nombre,

                        puntaje:
                            score.puntos,

                        coincidencias:
                            score.coincidencias,

                        fuente:
                            "CarreraService"

                    });

                }

            }
        );


    recomendaciones.sort(
        (
            a,
            b
        ) =>
            b.puntaje -
            a.puntaje
    );


    const datos =
        recomendaciones
            .slice(
                0,
                20
            );


    return {

        servicio:
            "RecomendacionEducativaService",

        estado:
            "OPERATIVO",

        perfilUtilizado:
            perfil,

        total:
            datos.length,

        datos,

        observacion:
            "Las recomendaciones se generan por coincidencia de perfil con información oficial disponible; no constituyen una decisión de PRONABEC."

    };

}


module.exports = {

    obtenerRecomendaciones

};
