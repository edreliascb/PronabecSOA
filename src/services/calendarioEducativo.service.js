const {
    obtenerPool,
    sql
} =
    require("../config/database");

const cronogramaService =
    require("./cronogramaConvocatoria.service");


function fechaISODesdeTexto(
    valor
) {

    if (!valor) {
        return null;
    }


    if (
        valor instanceof
        Date
    ) {

        return valor.toISOString();

    }


    const texto =
        String(
            valor
        )
            .trim();


    const formatoPeru =
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
            .exec(
                texto
            );


    if (
        formatoPeru
    ) {

        const [
            ,
            dia,
            mes,
            anio
        ] =
            formatoPeru;


        return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}T00:00:00.000Z`;

    }


    const fecha =
        new Date(
            texto
        );


    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return null;

    }


    return fecha.toISOString();

}


function ordenarEventos(
    eventos
) {

    return eventos.sort(
        (
            a,
            b
        ) => {

            const fechaA =
                a.fecha
                    ? new Date(
                        a.fecha
                    ).getTime()
                    : Number.MAX_SAFE_INTEGER;


            const fechaB =
                b.fecha
                    ? new Date(
                        b.fecha
                    ).getTime()
                    : Number.MAX_SAFE_INTEGER;


            return fechaA -
                fechaB;

        }
    );

}


async function obtenerCalendario(
    idUsuario
) {

    const [
        cronogramas,
        datosLocales
    ] =
        await Promise.all([

            cronogramaService
                .listarCronogramas(),

            (async () => {

                const pool =
                    await obtenerPool();


                const [
                    alertas,
                    seguimientos
                ] =
                    await Promise.all([

                        pool
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
                                SELECT TOP 100 *
                                FROM dbo.Alertas
                                WHERE id_usuario = @idUsuario
                                ORDER BY id_alerta DESC
                                `
                            ),

                        pool
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
                                SELECT TOP 100
                                    id_seguimiento,
                                    id_postulacion,
                                    titulo,
                                    estado,
                                    fecha_creacion,
                                    fecha_actualizacion
                                FROM dbo.SeguimientosPostulacion
                                WHERE id_usuario = @idUsuario
                                ORDER BY fecha_actualizacion DESC
                                `
                            )

                    ]);


                return {

                    alertas:
                        alertas.recordset,

                    seguimientos:
                        seguimientos.recordset

                };

            })()

        ]);


    const eventos =
        [];


    (
        cronogramas.datos ||
        []
    )
        .forEach(
            item => {

                if (
                    item.fechaInicio
                ) {

                    eventos.push({

                        tipo:
                            "CRONOGRAMA_INICIO",

                        origen:
                            "CronogramaConvocatoriaService",

                        titulo:
                            item.convocatoria,

                        detalle:
                            item.etapa,

                        fecha:
                            fechaISODesdeTexto(
                                item.fechaInicio
                            ),

                        fechaOriginal:
                            item.fechaInicio

                    });

                }


                if (
                    item.fechaFin
                ) {

                    eventos.push({

                        tipo:
                            "CRONOGRAMA_FIN",

                        origen:
                            "CronogramaConvocatoriaService",

                        titulo:
                            item.convocatoria,

                        detalle:
                            item.etapa,

                        fecha:
                            fechaISODesdeTexto(
                                item.fechaFin
                            ),

                        fechaOriginal:
                            item.fechaFin

                    });

                }

            }
        );


    datosLocales.alertas
        .forEach(
            alerta => {

                eventos.push({

                    tipo:
                        "ALERTA",

                    origen:
                        "AlertaService",

                    id:
                        alerta.id_alerta,

                    titulo:
                        alerta.titulo ||
                        alerta.nombre ||
                        alerta.tipo ||
                        "Alerta",

                    detalle:
                        alerta.descripcion ||
                        alerta.mensaje ||
                        alerta.criterio ||
                        null,

                    fecha:
                        fechaISODesdeTexto(
                            alerta.fecha_alerta ||
                            alerta.fecha_envio ||
                            alerta.fecha_creacion ||
                            alerta.fecha_actualizacion
                        ),

                    activa:
                        alerta.activa ??
                        null

                });

            }
        );


    datosLocales.seguimientos
        .forEach(
            seguimiento => {

                eventos.push({

                    tipo:
                        "SEGUIMIENTO_POSTULACION",

                    origen:
                        "SeguimientoPostulacionService",

                    id:
                        seguimiento.id_seguimiento,

                    titulo:
                        seguimiento.titulo,

                    detalle:
                        seguimiento.estado,

                    fecha:
                        fechaISODesdeTexto(
                            seguimiento.fecha_actualizacion ||
                            seguimiento.fecha_creacion
                        ),

                    idPostulacion:
                        seguimiento.id_postulacion

                });

            }
        );


    return {

        servicio:
            "CalendarioEducativoService",

        total:
            eventos.length,

        datos:
            ordenarEventos(
                eventos
            ),

        fuentes: [

            "CronogramaConvocatoriaService",

            "AlertaService",

            "SeguimientoPostulacionService"

        ],

        observacion:
            "Las fechas de convocatorias provienen de información oficial disponible. Alertas y seguimientos corresponden a datos del usuario."

    };

}


module.exports = {

    obtenerCalendario

};
