const integracionPronabec =
    require("./integracionPronabec.service");

const {
    extraerArreglo,
    valorTexto,
    unicosPorClave
} =
    require("./catalogoDerivado.helper");


const RECURSO =
    "CarrerasElegiblesNacional";


function construirSedes(
    registros
) {

    const candidatos =
        [];


    registros.forEach(
        (registro, indice) => {

            const nombre =
                valorTexto(
                    registro,
                    [
                        "SEDE",
                        "NOMBRE_SEDE",
                        "SEDE_ESTUDIO",
                        "CAMPUS",
                        "FILIAL"
                    ]
                );


            /*
               Algunos datasets no traen un campo llamado SEDE,
               pero sí una combinación territorial. En ese caso
               usamos únicamente valores que existen realmente
               en el registro para construir la etiqueta.
            */

            const departamento =
                valorTexto(
                    registro,
                    [
                        "DEPARTAMENTO",
                        "REGION",
                        "REGIÓN",
                        "DEPARTAMENTO_SEDE",
                        "REGION_SEDE"
                    ]
                );


            const provincia =
                valorTexto(
                    registro,
                    [
                        "PROVINCIA",
                        "PROVINCIA_SEDE"
                    ]
                );


            const distrito =
                valorTexto(
                    registro,
                    [
                        "DISTRITO",
                        "DISTRITO_SEDE"
                    ]
                );


            const etiqueta =
                nombre ||
                [
                    distrito,
                    provincia,
                    departamento
                ]
                    .filter(Boolean)
                    .join(" - ");


            if (!etiqueta) {
                return;
            }


            candidatos.push({

                id:
                    indice + 1,

                nombre:
                    etiqueta,

                institucion:
                    valorTexto(
                        registro,
                        [
                            "IES",
                            "NOMBRE_IES",
                            "INSTITUCION",
                            "INSTITUCIÓN",
                            "UNIVERSIDAD",
                            "ENTIDAD"
                        ]
                    ),

                departamento,

                provincia,

                distrito,

                carrera:
                    valorTexto(
                        registro,
                        [
                            "CARRERA",
                            "NOMBRE_CARRERA",
                            "CARRERA_ELEGIBLE"
                        ]
                    ),

                convocatoria:
                    valorTexto(
                        registro,
                        [
                            "CONVOCATORIA",
                            "CONCURSO",
                            "BECA"
                        ]
                    )

            });

        }
    );


    return unicosPorClave(
        candidatos,
        item =>
            `${item.nombre}|${item.institucion || ""}`
    )
        .map(
            (item, indice) => ({
                ...item,
                id:
                    indice + 1
            })
        );

}


async function listarSedes() {

    try {

        const respuesta =
            await integracionPronabec
                .consultarFuenteOficial(
                    RECURSO
                );


        const datos =
            construirSedes(
                extraerArreglo(
                    respuesta
                )
            );


        return {

            servicio:
                "SedeEducativaService",

            tipo:
                "Servicio de Entidad / Catálogo",

            fuente:
                respuesta.fuente,

            fuenteOficial:
                true,

            disponible:
                true,

            urlFuente:
                respuesta.urlFuente,

            derivadoDe:
                "Convocatorias - Carreras elegibles nacional - PRONABEC",

            total:
                datos.length,

            datos

        };

    } catch (error) {

        return {

            servicio:
                "SedeEducativaService",

            tipo:
                "Servicio de Entidad / Catálogo",

            fuente:
                "PRONABEC - Fuentes oficiales",

            fuenteOficial:
                true,

            disponible:
                false,

            motivo:
                error.message,

            total:
                0,

            datos:
                []

        };

    }

}


async function obtenerSedePorId(
    id
) {

    const resultado =
        await listarSedes();


    return resultado.datos.find(
        item =>
            String(
                item.id
            ) ===
            String(
                id
            )
    ) || null;

}


module.exports = {

    listarSedes,

    obtenerSedePorId

};
