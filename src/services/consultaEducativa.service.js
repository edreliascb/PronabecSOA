const convocatoriaService = require(
    "./convocatoria.service"
);

const postulacionService = require(
    "./postulacion.service"
);

const documentoService = require(
    "./documentoRequisito.service"
);

const convenioService = require(
    "./convenio.service"
);


// ======================================================
// CONSULTA COMPLETA ORQUESTADA
// ======================================================

async function realizarConsultaCompleta() {

    try {

        // Ejecutar todos los servicios en paralelo
        const [
            convocatorias,
            postulaciones,
            documentos,
            convenios
        ] = await Promise.all([

            convocatoriaService.listarConvocatorias(
                1,
                10
            ),

            postulacionService.listarPostulaciones(
                1,
                10
            ),

            documentoService.listarDocumentos(
                1,
                10
            ),

            convenioService.listarConvenios(
                1,
                10
            )

        ]);


        // ===============================================
        // ESTADO DE LOS SERVICIOS
        // ===============================================

        const estadoServicios = {

            convocatorias:
                convocatorias.disponible
                    ? "API disponible"
                    : "Modo respaldo",

            postulaciones:
                postulaciones.disponible
                    ? "API disponible"
                    : "Modo respaldo",

            documentos:
                documentos.disponible
                    ? "API disponible"
                    : "Modo respaldo",

            convenios:
                convenios.disponible
                    ? "API disponible"
                    : "Modo respaldo",

            plataforma:
                "Operativa"

        };


        // ===============================================
        // RESPUESTA CONSOLIDADA
        // ===============================================

        return {

            servicio:
                "ConsultaEducativaService",

            tipo:
                "Servicio Orquestador",

            descripcion:
                "Integra convocatorias, postulaciones, documentos y convenios de PRONABEC",

            estadoServicios:
                estadoServicios,

            convocatorias:
                convocatorias,

            postulaciones:
                postulaciones,

            documentos:
                documentos,

            convenios:
                convenios

        };

    } catch (error) {

        console.error(
            "ERROR DEL ORQUESTADOR:",
            error.message
        );

        throw new Error(
            "No se pudo completar la consulta educativa."
        );
    }
}


// ======================================================
// EXPORTAR
// ======================================================

module.exports = {
    realizarConsultaCompleta
};