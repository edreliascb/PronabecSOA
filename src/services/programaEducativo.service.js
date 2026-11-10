const integracionPronabec =
    require("./integracionPronabec.service");

const {
    extraerArreglo,
    valorTexto,
    normalizarTexto
} =
    require("./catalogoDerivado.helper");


const RECURSO =
    "CarrerasElegiblesNacional";


/* =========================================================
   CONSTRUIR PROGRAMAS

   Un programa no se duplica por cada sede.
   Las sedes, modalidades y convocatorias se agrupan.
========================================================= */

function agregarUnico(
    arreglo,
    valor
) {

    if (!valor) {
        return;
    }


    const clave =
        normalizarTexto(
            valor
        );


    const existe =
        arreglo.some(
            actual =>
                normalizarTexto(
                    actual
                ) ===
                clave
        );


    if (!existe) {

        arreglo.push(
            valor
        );

    }

}


function construirProgramas(
    registros
) {

    const mapa =
        new Map();


    registros.forEach(
        registro => {

            const nombre =
                valorTexto(
                    registro,
                    [
                        "PROGRAMA",
                        "NOMBRE_PROGRAMA",
                        "PROGRAMA_ESTUDIO",
                        "PROGRAMA_EDUCATIVO",
                        "CARRERA",
                        "NOMBRE_CARRERA",
                        "CARRERA_ELEGIBLE"
                    ]
                );


            if (!nombre) {
                return;
            }


            const clave =
                normalizarTexto(
                    nombre
                );


            if (
                !mapa.has(
                    clave
                )
            ) {

                mapa.set(
                    clave,
                    {
                        nombre,

                        instituciones:
                            [],

                        sedes:
                            [],

                        modalidades:
                            [],

                        convocatorias:
                            []
                    }
                );

            }


            const programa =
                mapa.get(
                    clave
                );


            agregarUnico(
                programa.instituciones,
                valorTexto(
                    registro,
                    [
                        "IES",
                        "NOMBRE_IES",
                        "NOMBRE_INSTITUCION",
                        "NOMBRE_INSTITUCIÓN",
                        "INSTITUCION",
                        "INSTITUCIÓN",
                        "UNIVERSIDAD",
                        "ENTIDAD"
                    ]
                )
            );


            agregarUnico(
                programa.sedes,
                valorTexto(
                    registro,
                    [
                        "SEDE",
                        "NOMBRE_SEDE",
                        "SEDE_ESTUDIO",
                        "CAMPUS",
                        "FILIAL"
                    ]
                )
            );


            const modalidad =
                valorTexto(
                    registro,
                    [
                        "MODALIDAD",
                        "MODALIDAD_ESTUDIO",
                        "TIPO_MODALIDAD"
                    ]
                );


            if (
                modalidad &&
                !normalizarTexto(
                    modalidad
                )
                    .includes(
                        "NO HABILITADO"
                    )
            ) {

                agregarUnico(
                    programa.modalidades,
                    modalidad
                );

            }


            agregarUnico(
                programa.convocatorias,
                valorTexto(
                    registro,
                    [
                        "CONVOCATORIA",
                        "CONCURSO",
                        "BECA"
                    ]
                )
            );

        }
    );


    return [
        ...mapa.values()
    ]
        .sort(
            (
                a,
                b
            ) =>
                a.nombre.localeCompare(
                    b.nombre,
                    "es"
                )
        )
        .map(
            (
                item,
                indice
            ) => ({
                id:
                    indice + 1,

                ...item
            })
        );

}


async function listarProgramas() {

    try {

        const respuesta =
            await integracionPronabec
                .consultarFuenteOficial(
                    RECURSO
                );


        const datos =
            construirProgramas(
                extraerArreglo(
                    respuesta
                )
            );


        return {

            servicio:
                "ProgramaEducativoService",

            tipo:
                "Servicio de Entidad",

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
                "ProgramaEducativoService",

            tipo:
                "Servicio de Entidad",

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


async function obtenerProgramaPorId(
    id
) {

    const resultado =
        await listarProgramas();


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

    listarProgramas,

    obtenerProgramaPorId

};
