const {
    obtenerPool,
    sql
} =
    require("../config/database");

const documentoUsuarioService =
    require("./documentoUsuario.service");


function crearError(
    mensaje,
    statusCode
) {

    const error =
        new Error(
            mensaje
        );


    error.statusCode =
        statusCode;


    return error;

}


async function validar(
    idUsuario,
    idDocumento
) {

    const documento =
        await documentoUsuarioService
            .obtenerPorId(
                idUsuario,
                idDocumento
            );


    if (!documento) {

        throw crearError(
            "Documento no encontrado.",
            404
        );

    }


    const hoy =
        new Date();


    let estado =
        "VALIDO";


    const observaciones =
        [];


    if (
        !documento.tipo_documento ||
        !documento.nombre_archivo
    ) {

        estado =
            "INCOMPLETO";


        observaciones.push(
            "Faltan metadatos obligatorios."
        );

    }


    if (
        documento.fecha_vencimiento
    ) {

        const vencimiento =
            new Date(
                documento.fecha_vencimiento
            );


        if (
            !Number.isNaN(
                vencimiento.getTime()
            ) &&
            vencimiento <
            hoy
        ) {

            estado =
                "VENCIDO";


            observaciones.push(
                "La fecha de vencimiento ya pasó."
            );

        }

    }


    if (
        documento.fecha_emision &&
        documento.fecha_vencimiento
    ) {

        const emision =
            new Date(
                documento.fecha_emision
            );


        const vencimiento =
            new Date(
                documento.fecha_vencimiento
            );


        if (
            !Number.isNaN(
                emision.getTime()
            ) &&
            !Number.isNaN(
                vencimiento.getTime()
            ) &&
            vencimiento <
            emision
        ) {

            estado =
                "INCONSISTENTE";


            observaciones.push(
                "La fecha de vencimiento es anterior a la fecha de emisión."
            );

        }

    }


    const observacion =
        observaciones.length
            ? observaciones.join(
                " "
            )
            : "Metadatos básicos válidos.";


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

            .input(
                "idDocumento",
                sql.Int,
                Number(
                    idDocumento
                )
            )

            .input(
                "estado",
                sql.NVarChar(40),
                estado
            )

            .input(
                "observacion",
                sql.NVarChar(500),
                observacion
            )

            .query(
                `
                UPDATE dbo.DocumentosUsuario
                SET
                    estado_validacion = @estado,
                    observacion_validacion = @observacion,
                    fecha_actualizacion = SYSDATETIME()

                OUTPUT
                    INSERTED.*

                WHERE
                    id_documento_usuario = @idDocumento
                    AND id_usuario = @idUsuario
                `
            );


    return {

        servicio:
            "ValidacionDocumentoService",

        estado,

        observacion,

        documento:
            resultado.recordset[0]

    };

}


module.exports = {

    validar

};
