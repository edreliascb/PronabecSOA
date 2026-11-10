const convocatoriaService =
    require("./convocatoria.service");

const {
    extraerArreglo,
    valorTexto,
    dividirValores,
    unicosPorClave
} =
    require("./catalogoDerivado.helper");


function construirBeneficios(
    registros
) {

    const salida = [];


    registros.forEach(
        (registro, indice) => {

            /*
               Solo se publican beneficios cuando la fuente real
               contiene un campo explícito de beneficio/cobertura/
               subvención. No se infieren ni se inventan.
            */

            const texto =
                valorTexto(
                    registro,
                    [
                        "BENEFICIO",
                        "BENEFICIOS",
                        "COBERTURA",
                        "FINANCIAMIENTO",
                        "SUBVENCION",
                        "SUBVENCIÓN",
                        "CONCEPTO_SUBVENCION",
                        "CONCEPTO_SUBVENCIÓN"
                    ]
                );


            if (!texto) {
                return;
            }


            const valores =
                dividirValores(
                    texto
                );


            valores.forEach(
                (nombre, subindice) => {

                    salida.push({

                        id:
                            `${indice + 1}-${subindice + 1}`,

                        nombre,

                        oportunidadId:
                            indice + 1,

                        convocatoria:
                            valorTexto(
                                registro,
                                [
                                    "CONCURSO",
                                    "CONVOCATORIA",
                                    "BECA",
                                    "NOMBRE_CONVOCATORIA"
                                ]
                            )

                    });

                }
            );

        }
    );


    return unicosPorClave(
        salida,
        item =>
            `${item.nombre}|${item.oportunidadId}`
    );

}


async function listarBeneficios() {

    try {

        const respuesta =
            await convocatoriaService
                .listarConvocatorias(
                    1,
                    200
                );


        const datos =
            construirBeneficios(
                extraerArreglo(
                    respuesta
                )
            );


        return {

            servicio:
                "BeneficioService",

            tipo:
                "Servicio de Entidad",

            fuente:
                respuesta?.datos?.fuente ||
                respuesta?.fuente ||
                "ConvocatoriaService",

            fuenteOficial:
                respuesta?.datos?.fuenteOficial ??
                respuesta?.fuenteOficial ??
                true,

            disponible:
                respuesta?.datos?.disponible ??
                respuesta?.disponible ??
                true,

            derivadoDe:
                "ConvocatoriaService",

            total:
                datos.length,

            datos,

            observacion:
                datos.length === 0
                    ? "La publicación oficial de convocatorias consultada no contiene campos explícitos de beneficios o subvenciones."
                    : null

        };

    } catch (error) {

        return {

            servicio:
                "BeneficioService",

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


async function listarBeneficiosPorOportunidad(
    id
) {

    const resultado =
        await listarBeneficios();


    const datos =
        resultado.datos.filter(
            item =>
                String(
                    item.oportunidadId
                ) ===
                String(
                    id
                )
        );


    return {

        ...resultado,

        total:
            datos.length,

        datos

    };

}


module.exports = {

    listarBeneficios,

    listarBeneficiosPorOportunidad

};
