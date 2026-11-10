const convocatoriaService =
    require("./convocatoria.service");

const {
    normalizarTexto,
    extraerArreglo,
    valorTexto,
    buscarEnRegistros,
    unicosPorClave
} =
    require("./catalogoDerivado.helper");


/* =========================================================
   BECA SERVICE

   Adaptado al formato REAL recuperado desde PRONABEC:

   Concurso
   Bases
   Momento
   Fecha_Inicio
   Fecha_Fin
   DocumentacionCronograma

   No inventa datos.
========================================================= */


/* =========================================================
   TRANSFORMAR REGISTROS
========================================================= */

function transformarBecas(
    registros
) {

    const candidatos = [];


    registros.forEach(
        (registro, indice) => {

            const concurso =
                valorTexto(
                    registro,
                    [
                        "Concurso",
                        "concurso",
                        "beca",
                        "nombre_beca",
                        "convocatoria",
                        "nombre_convocatoria",
                        "nombre"
                    ]
                );


            if (!concurso) {

                return;

            }


            const contenido =
                normalizarTexto(
                    JSON.stringify(
                        registro
                    )
                );


            /*
               Clasificamos como beca solo cuando el registro
               oficial contiene explícitamente la palabra BECA.
            */

            if (
                !contenido.includes(
                    "BECA"
                )
            ) {

                return;

            }


            candidatos.push({

                id:
                    indice + 1,

                nombre:
                    concurso,

                concurso,

                bases:
                    valorTexto(
                        registro,
                        [
                            "Bases",
                            "bases"
                        ]
                    ),

                momento:
                    valorTexto(
                        registro,
                        [
                            "Momento",
                            "momento"
                        ]
                    ),

                fechaInicio:
                    valorTexto(
                        registro,
                        [
                            "Fecha_Inicio",
                            "fecha_inicio",
                            "fechaInicio"
                        ]
                    ),

                fechaFin:
                    valorTexto(
                        registro,
                        [
                            "Fecha_Fin",
                            "fecha_fin",
                            "fechaFin"
                        ]
                    ),

                documentacionCronograma:
                    valorTexto(
                        registro,
                        [
                            "DocumentacionCronograma",
                            "documentacion_cronograma",
                            "documentación_cronograma"
                        ]
                    ),

                fuenteRegistro:
                    registro

            });

        }
    );


    /*
       PRONABEC puede publicar más de una etapa/momento
       para la misma beca. Agrupamos por "Concurso".
    */

    const grupos =
        new Map();


    candidatos.forEach(
        item => {

            const clave =
                normalizarTexto(
                    item.nombre
                );


            if (
                !grupos.has(
                    clave
                )
            ) {

                grupos.set(
                    clave,
                    {
                        id:
                            grupos.size + 1,

                        nombre:
                            item.nombre,

                        concurso:
                            item.concurso,

                        bases:
                            item.bases,

                        momentos:
                            [],

                        fuente:
                            "PRONABEC - Plataforma Nacional de Datos Abiertos"
                    }
                );

            }


            const beca =
                grupos.get(
                    clave
                );


            beca.momentos.push({

                momento:
                    item.momento,

                fechaInicio:
                    item.fechaInicio,

                fechaFin:
                    item.fechaFin,

                documentacionCronograma:
                    item.documentacionCronograma

            });

        }
    );


    return [
        ...grupos.values()
    ];

}


/* =========================================================
   LISTAR BECAS
========================================================= */

async function listarBecas() {

    const respuesta =
        await convocatoriaService
            .listarConvocatorias(
                1,
                200
            );


    const registros =
        extraerArreglo(
            respuesta
        );


    const datos =
        transformarBecas(
            registros
        );


    return {

        servicio:
            "BecaService",

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

        datos

    };

}


/* =========================================================
   BUSCAR BECAS
========================================================= */

async function buscarBecas(
    texto
) {

    const resultado =
        await listarBecas();


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


/* =========================================================
   OBTENER POR ID
========================================================= */

async function obtenerBecaPorId(
    id
) {

    const resultado =
        await listarBecas();


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


/* =========================================================
   EXPORTAR
========================================================= */

module.exports = {

    listarBecas,

    buscarBecas,

    obtenerBecaPorId

};
