const integracionPronabec =
    require("./integracionPronabec.service");

const {
    extraerArreglo,
    valorTexto,
    unicosPorClave,
    buscarEnRegistros
} =
    require("./catalogoDerivado.helper");


const RECURSO =
    "CarrerasElegiblesNacional";


function construirCarreras(
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
                        "CARRERA",
                        "Carrera",
                        "carrera",
                        "NOMBRE_CARRERA",
                        "nombre_carrera",
                        "CARRERA_ELEGIBLE",
                        "carrera_elegible",
                        "PROGRAMA_ESTUDIO",
                        "programa_estudio",
                        "ESPECIALIDAD",
                        "especialidad"
                    ]
                );


            if (!nombre) {
                return;
            }


            candidatos.push({

                id:
                    indice + 1,

                nombre,

                institucion:
                    valorTexto(
                        registro,
                        [
                            "IES",
                            "NOMBRE_IES",
                            "INSTITUCION",
                            "INSTITUCIÓN",
                            "UNIVERSIDAD",
                            "ENTIDAD",
                            "INSTITUCION_EDUCATIVA"
                        ]
                    ),

                sede:
                    valorTexto(
                        registro,
                        [
                            "SEDE",
                            "NOMBRE_SEDE",
                            "SEDE_ESTUDIO",
                            "CAMPUS",
                            "FILIAL"
                        ]
                    ),

                departamento:
                    valorTexto(
                        registro,
                        [
                            "DEPARTAMENTO",
                            "REGION",
                            "REGIÓN",
                            "DEPARTAMENTO_SEDE",
                            "REGION_SEDE"
                        ]
                    ),

                provincia:
                    valorTexto(
                        registro,
                        [
                            "PROVINCIA",
                            "PROVINCIA_SEDE"
                        ]
                    ),

                distrito:
                    valorTexto(
                        registro,
                        [
                            "DISTRITO",
                            "DISTRITO_SEDE"
                        ]
                    ),

                modalidad:
                    valorTexto(
                        registro,
                        [
                            "MODALIDAD",
                            "MODALIDAD_ESTUDIO",
                            "TIPO_MODALIDAD"
                        ]
                    ),

                convocatoria:
                    valorTexto(
                        registro,
                        [
                            "CONVOCATORIA",
                            "CONCURSO",
                            "BECA",
                            "NOMBRE_CONVOCATORIA"
                        ]
                    )

            });

        }
    );


    return unicosPorClave(
        candidatos,
        item =>
            `${item.nombre}|${item.institucion || ""}|${item.sede || ""}`
    )
        .map(
            (item, indice) => ({
                ...item,
                id:
                    indice + 1
            })
        );

}


async function listarCarreras() {

    try {

        const respuesta =
            await integracionPronabec
                .consultarFuenteOficial(
                    RECURSO
                );


        const datos =
            construirCarreras(
                extraerArreglo(
                    respuesta
                )
            );


        return {

            servicio:
                "CarreraService",

            tipo:
                "Servicio de Catálogo",

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
                "CarreraService",

            tipo:
                "Servicio de Catálogo",

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


async function buscarCarreras(
    texto
) {

    const resultado =
        await listarCarreras();


    const datos =
        buscarEnRegistros(
            resultado.datos,
            texto
        );


    return {

        ...resultado,

        total:
            datos.length,

        datos

    };

}


module.exports = {

    listarCarreras,

    buscarCarreras

};
