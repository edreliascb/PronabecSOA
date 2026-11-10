const documentoService =
    require("./documentoRequisito.service");

const convocatoriaService =
    require("./convocatoria.service");

const {
    extraerArreglo,
    valorTexto,
    contieneTexto
} =
    require("./serviciosEmpresariales.helper");


function transformarRequisitos(
    registros
) {

    return registros
        .map(
            (
                registro,
                indice
            ) => {

                const nombre =
                    valorTexto(
                        registro,
                        [
                            "Requisito",
                            "Documento",
                            "NombreDocumento",
                            "Nombre_Documento",
                            "Nombre",
                            "Descripcion",
                            "Descripción"
                        ]
                    );


                if (!nombre) {

                    return null;

                }


                return {

                    id:
                        indice + 1,

                    nombre,

                    descripcion:
                        valorTexto(
                            registro,
                            [
                                "Descripcion",
                                "Descripción",
                                "Detalle",
                                "Observacion",
                                "Observación"
                            ]
                        ),

                    obligatorio:
                        valorTexto(
                            registro,
                            [
                                "Obligatorio",
                                "EsObligatorio",
                                "Requerido"
                            ]
                        ),

                    convocatoria:
                        valorTexto(
                            registro,
                            [
                                "Convocatoria",
                                "Concurso",
                                "Beca",
                                "Programa"
                            ]
                        ),

                    fuenteRegistro:
                        registro

                };

            }
        )
        .filter(Boolean);

}


async function listarRequisitos() {

    const respuesta =
        await documentoService
            .listarDocumentos(
                1,
                200
            );


    const datos =
        transformarRequisitos(
            extraerArreglo(
                respuesta
            )
        );


    return {

        servicio:
            "RequisitoElegibilidadService",

        tipo:
            "Servicio de Reglas de Negocio",

        fuente:
            respuesta?.datos?.fuente ||
            respuesta?.fuente ||
            "DocumentoRequisitoService",

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

        datos,

        observacion:
            datos.length ===
            0
                ? "La fuente oficial consultada no contiene requisitos estructurados utilizables."
                : null

    };

}


async function listarRequisitosPorOportunidad(
    oportunidadId
) {

    const [
        requisitos,
        convocatorias
    ] =
        await Promise.all([
            listarRequisitos(),
            convocatoriaService
                .listarConvocatorias(
                    1,
                    200
                )
        ]);


    const lista =
        extraerArreglo(
            convocatorias
        );


    const indice =
        Number(
            oportunidadId
        ) -
        1;


    const oportunidad =
        Number.isInteger(
            indice
        ) &&
        indice >= 0
            ? lista[indice] ||
                null
            : null;


    const nombreOportunidad =
        oportunidad
            ? valorTexto(
                oportunidad,
                [
                    "Concurso",
                    "Convocatoria",
                    "Beca",
                    "Nombre"
                ]
            )
            : null;


    let datos =
        requisitos.datos;


    if (
        nombreOportunidad
    ) {

        datos =
            datos.filter(
                item =>
                    contieneTexto(
                        item,
                        nombreOportunidad
                    )
            );

    }


    return {

        ...requisitos,

        oportunidadId:
            String(
                oportunidadId
            ),

        oportunidad:
            nombreOportunidad,

        total:
            datos.length,

        datos,

        observacion:
            datos.length ===
            0
                ? "La fuente oficial no publicó requisitos vinculados de forma identificable con esta oportunidad."
                : null

    };

}


module.exports = {

    listarRequisitos,

    listarRequisitosPorOportunidad

};
