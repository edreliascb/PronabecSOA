const {
    obtenerPool,
    sql
} =
    require("../config/database");

const requisitoService =
    require("./requisitoElegibilidad.service");

const convocatoriaService =
    require("./convocatoria.service");

const {
    normalizarTexto,
    valorTexto,
    extraerArreglo
} =
    require("./serviciosEmpresariales.helper");



function ejecutarConTimeout(
    promesa,
    milisegundos,
    valorFallback
) {

    return new Promise(
        resolve => {

            let finalizado =
                false;

            const terminar = valor => {

                if (finalizado) {
                    return;
                }

                finalizado =
                    true;

                clearTimeout(
                    temporizador
                );

                resolve(
                    valor
                );

            };


            const temporizador =
                setTimeout(
                    () => {

                        terminar({
                            ...valorFallback,
                            timeout:
                                true,
                            motivo:
                                valorFallback?.motivo ||
                                `La fuente superó el tiempo máximo de ${milisegundos} ms.`
                        });

                    },
                    milisegundos
                );


            Promise.resolve(
                promesa
            )
                .then(
                    terminar
                )
                .catch(
                    error => {

                        terminar({
                            ...valorFallback,
                            disponible:
                                false,
                            error:
                                true,
                            motivo:
                                error?.message ||
                                "La fuente oficial no respondió correctamente."
                        });

                    }
                );

        }
    );

}

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


function limpiarTexto(
    valor,
    maximo = 180
) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return null;

    }


    const texto =
        String(
            valor
        )
            .trim();


    if (!texto) {

        return null;

    }


    return texto.slice(
        0,
        maximo
    );

}


function limpiarNumero(
    valor,
    minimo,
    maximo
) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return null;

    }


    const numero =
        Number(
            String(
                valor
            )
                .replace(
                    ",",
                    "."
                )
        );


    if (
        !Number.isFinite(
            numero
        ) ||
        numero < minimo ||
        numero > maximo
    ) {

        return null;

    }


    return numero;

}


function construirPerfilSimulacion(
    perfilGuardado,
    datos = {}
) {

    return {

        edad:
            limpiarNumero(
                datos.edad,
                12,
                100
            ),

        departamento:
            limpiarTexto(
                datos.departamento
            ) ||
            perfilGuardado?.departamento ||
            null,

        provincia:
            limpiarTexto(
                datos.provincia
            ) ||
            perfilGuardado?.provincia ||
            null,

        distrito:
            limpiarTexto(
                datos.distrito
            ) ||
            perfilGuardado?.distrito ||
            null,

        carrera_interes:
            limpiarTexto(
                datos.carrera_interes ??
                datos.carrera
            ) ||
            perfilGuardado?.carrera_interes ||
            null,

        nivel_estudio:
            limpiarTexto(
                datos.nivel_estudio ??
                datos.nivelEstudio
            ) ||
            perfilGuardado?.nivel_estudio ||
            null,

        institucion:
            limpiarTexto(
                datos.institucion
            ) ||
            perfilGuardado?.institucion ||
            null,

        promedio:
            limpiarNumero(
                datos.promedio,
                0,
                20
            ),

        situacion_economica:
            limpiarTexto(
                datos.situacion_economica ??
                datos.situacionEconomica
            )

    };

}


function normalizarClave(
    valor
) {

    return normalizarTexto(
        valor ||
        ""
    )
        .toUpperCase()
        .replace(
            /[^A-Z0-9]+/g,
            "_"
        )
        .replace(
            /^_+|_+$/g,
            ""
        );

}


function buscarCampo(
    objeto,
    aliases
) {

    if (
        !objeto ||
        typeof objeto !==
        "object"
    ) {

        return null;

    }


    const aliasesNormalizados =
        aliases.map(
            normalizarClave
        );


    for (
        const [
            clave,
            valor
        ]
        of Object.entries(
            objeto
        )
    ) {

        const claveNormalizada =
            normalizarClave(
                clave
            );


        if (
            aliasesNormalizados.includes(
                claveNormalizada
            )
        ) {

            if (
                valor === null ||
                valor === undefined ||
                String(
                    valor
                )
                    .trim() ===
                ""
            ) {

                continue;

            }


            return {

                clave,

                claveNormalizada,

                valor:
                    String(
                        valor
                    )
                        .trim()

            };

        }

    }


    return null;

}


function compararTexto(
    requerido,
    valorUsuario
) {

    if (!valorUsuario) {

        return {
            estado:
                "REQUIERE_VALIDACION",
            cumple:
                null
        };

    }


    const esperado =
        normalizarTexto(
            requerido
        );

    const actual =
        normalizarTexto(
            valorUsuario
        );


    const cumple =
        esperado.includes(
            actual
        ) ||
        actual.includes(
            esperado
        );


    return {
        estado:
            cumple
                ? "CUMPLE"
                : "NO_CUMPLE",
        cumple
    };

}


function extraerNumeros(
    valor
) {

    const coincidencias =
        String(
            valor ||
            ""
        )
            .replace(
                /,/g,
                "."
            )
            .match(
                /\d+(?:\.\d+)?/g
            ) ||
        [];


    return coincidencias
        .map(
            Number
        )
        .filter(
            Number.isFinite
        );

}


function compararNumero(
    campo,
    requerido,
    valorUsuario
) {

    if (
        valorUsuario === null ||
        valorUsuario === undefined
    ) {

        return {
            estado:
                "REQUIERE_VALIDACION",
            cumple:
                null,
            criterio:
                "FALTA_DATO_USUARIO"
        };

    }


    const numeros =
        extraerNumeros(
            requerido
        );


    if (
        numeros.length ===
        0
    ) {

        return {
            estado:
                "REQUIERE_VALIDACION",
            cumple:
                null,
            criterio:
                "REGLA_NO_INTERPRETABLE"
        };

    }


    const clave =
        normalizarClave(
            campo
        );


    if (
        clave.includes(
            "MIN"
        ) ||
        clave.includes(
            "MINIMA"
        ) ||
        clave.includes(
            "MINIMO"
        )
    ) {

        const cumple =
            Number(
                valorUsuario
            ) >=
            numeros[0];


        return {
            estado:
                cumple
                    ? "CUMPLE"
                    : "NO_CUMPLE",
            cumple,
            criterio:
                "MINIMO"
        };

    }


    if (
        clave.includes(
            "MAX"
        ) ||
        clave.includes(
            "MAXIMA"
        ) ||
        clave.includes(
            "MAXIMO"
        )
    ) {

        const cumple =
            Number(
                valorUsuario
            ) <=
            numeros[0];


        return {
            estado:
                cumple
                    ? "CUMPLE"
                    : "NO_CUMPLE",
            cumple,
            criterio:
                "MAXIMO"
        };

    }


    if (
        numeros.length >=
        2
    ) {

        const minimo =
            Math.min(
                numeros[0],
                numeros[1]
            );

        const maximo =
            Math.max(
                numeros[0],
                numeros[1]
            );

        const cumple =
            Number(
                valorUsuario
            ) >= minimo &&
            Number(
                valorUsuario
            ) <= maximo;


        return {
            estado:
                cumple
                    ? "CUMPLE"
                    : "NO_CUMPLE",
            cumple,
            criterio:
                "RANGO"
        };

    }


    return {
        estado:
            "REQUIERE_VALIDACION",
        cumple:
            null,
        criterio:
            "REGLA_NUMERICA_AMBIGUA"
    };

}


function evaluarCamposEstructurados(
    requisito,
    perfil
) {

    const fuente =
        requisito.fuenteRegistro ||
        {};


    const definiciones = [

        {
            campo:
                "Departamento",
            aliases:
                [
                    "departamento",
                    "region",
                    "región"
                ],
            valorUsuario:
                perfil.departamento,
            tipo:
                "texto"
        },

        {
            campo:
                "Provincia",
            aliases:
                [
                    "provincia"
                ],
            valorUsuario:
                perfil.provincia,
            tipo:
                "texto"
        },

        {
            campo:
                "Distrito",
            aliases:
                [
                    "distrito"
                ],
            valorUsuario:
                perfil.distrito,
            tipo:
                "texto"
        },

        {
            campo:
                "Carrera",
            aliases:
                [
                    "carrera",
                    "carrera_interes",
                    "programa_estudio",
                    "programa_academico"
                ],
            valorUsuario:
                perfil.carrera_interes,
            tipo:
                "texto"
        },

        {
            campo:
                "Nivel de estudio",
            aliases:
                [
                    "nivel_estudio",
                    "nivel",
                    "nivel_educativo"
                ],
            valorUsuario:
                perfil.nivel_estudio,
            tipo:
                "texto"
        },

        {
            campo:
                "Institución",
            aliases:
                [
                    "institucion",
                    "institución",
                    "ies",
                    "institucion_educativa"
                ],
            valorUsuario:
                perfil.institucion,
            tipo:
                "texto"
        },

        {
            campo:
                "Edad",
            aliases:
                [
                    "edad",
                    "edad_minima",
                    "edad_mínima",
                    "edad_maxima",
                    "edad_máxima",
                    "edad_min",
                    "edad_max"
                ],
            valorUsuario:
                perfil.edad,
            tipo:
                "numero"
        },

        {
            campo:
                "Promedio",
            aliases:
                [
                    "promedio",
                    "promedio_minimo",
                    "promedio_mínimo",
                    "nota_promedio",
                    "nota_minima",
                    "nota_mínima"
                ],
            valorUsuario:
                perfil.promedio,
            tipo:
                "numero"
        },

        {
            campo:
                "Situación económica",
            aliases:
                [
                    "situacion_economica",
                    "situación_económica",
                    "clasificacion_socioeconomica",
                    "clasificación_socioeconómica",
                    "condicion_socioeconomica",
                    "condición_socioeconómica",
                    "sisfoh"
                ],
            valorUsuario:
                perfil.situacion_economica,
            tipo:
                "texto"
        }

    ];


    const evaluadas =
        [];


    for (
        const definicion
        of definiciones
    ) {

        const encontrado =
            buscarCampo(
                fuente,
                definicion.aliases
            );


        if (!encontrado) {

            continue;

        }


        const comparacion =
            definicion.tipo ===
            "numero"
                ? compararNumero(
                    encontrado.clave,
                    encontrado.valor,
                    definicion.valorUsuario
                )
                : compararTexto(
                    encontrado.valor,
                    definicion.valorUsuario
                );


        evaluadas.push({

            campo:
                definicion.campo,

            campoFuente:
                encontrado.clave,

            requerido:
                encontrado.valor,

            valorUsuario:
                definicion.valorUsuario ??
                null,

            estado:
                comparacion.estado,

            cumple:
                comparacion.cumple,

            criterio:
                comparacion.criterio ||
                "COINCIDENCIA_TEXTO"

        });

    }


    return evaluadas;

}


function evaluarRequisito(
    requisito,
    perfil
) {

    const reglas =
        evaluarCamposEstructurados(
            requisito,
            perfil
        );


    if (
        reglas.length ===
        0
    ) {

        return {

            requisitoId:
                requisito.id,

            requisito:
                requisito.nombre,

            descripcion:
                requisito.descripcion ||
                null,

            obligatorio:
                requisito.obligatorio ||
                null,

            estado:
                "REQUIERE_VALIDACION",

            reglas:
                []

        };

    }


    const noCumple =
        reglas.some(
            regla =>
                regla.estado ===
                "NO_CUMPLE"
        );

    const requiereValidacion =
        reglas.some(
            regla =>
                regla.estado ===
                "REQUIERE_VALIDACION"
        );


    const estado =
        noCumple
            ? "NO_CUMPLE"
            : requiereValidacion
                ? "REQUIERE_VALIDACION"
                : "CUMPLE";


    return {

        requisitoId:
            requisito.id,

        requisito:
            requisito.nombre,

        descripcion:
            requisito.descripcion ||
            null,

        obligatorio:
            requisito.obligatorio ||
            null,

        estado,

        reglas

    };

}


function requisitoPerteneceAOportunidad(
    requisito,
    nombreOportunidad
) {

    if (!nombreOportunidad) {

        return false;

    }


    const nombre =
        normalizarTexto(
            nombreOportunidad
        );


    if (!nombre) {

        return false;

    }


    const convocatoria =
        normalizarTexto(
            requisito.convocatoria ||
            ""
        );


    if (
        convocatoria &&
        (
            convocatoria.includes(
                nombre
            ) ||
            nombre.includes(
                convocatoria
            )
        )
    ) {

        return true;

    }


    const fuente =
        normalizarTexto(
            JSON.stringify(
                requisito.fuenteRegistro ||
                {}
            )
        );


    return Boolean(
        fuente &&
        fuente.includes(
            nombre
        )
    );

}


function obtenerNombreOportunidad(
    registro,
    indice
) {

    return valorTexto(
        registro,
        [
            "Concurso",
            "Convocatoria",
            "Beca",
            "Nombre",
            "nombre_convocatoria",
            "nombre_beca"
        ]
    ) ||
    `Oportunidad ${indice + 1}`;

}


function esBeca(
    registro
) {

    return normalizarTexto(
        JSON.stringify(
            registro
        )
    )
        .includes(
            "BECA"
        );

}


function obtenerFuente(
    respuesta,
    porDefecto
) {

    return respuesta?.datos?.fuente ||
        respuesta?.fuente ||
        porDefecto;

}


function obtenerDisponibilidad(
    respuesta
) {

    return respuesta?.datos?.disponible ??
        respuesta?.disponible ??
        true;

}


function resumirEvaluaciones(
    evaluaciones
) {

    const reglas =
        evaluaciones.flatMap(
            item =>
                item.reglas ||
                []
        );


    return {

        requisitos:
            evaluaciones.length,

        reglasAutomatizadas:
            reglas.length,

        cumple:
            reglas.filter(
                item =>
                    item.estado ===
                    "CUMPLE"
            )
                .length,

        noCumple:
            reglas.filter(
                item =>
                    item.estado ===
                    "NO_CUMPLE"
            )
                .length,

        requiereValidacion:
            reglas.filter(
                item =>
                    item.estado ===
                    "REQUIERE_VALIDACION"
            )
                .length,

        requisitosManuales:
            evaluaciones.filter(
                item =>
                    (
                        item.reglas ||
                        []
                    )
                        .length ===
                    0
            )
                .length

    };

}


function determinarEstadoOportunidad(
    resumen
) {

    if (
        resumen.reglasAutomatizadas ===
        0
    ) {

        return "NO_DETERMINABLE";

    }


    if (
        resumen.noCumple >
        0
    ) {

        return "NO_CUMPLE_PREEVALUACION";

    }


    if (
        resumen.requiereValidacion >
        0 ||
        resumen.requisitosManuales >
        0
    ) {

        return "REQUIERE_VALIDACION";

    }


    return "CUMPLE_PREEVALUACION";

}


function puntajeOrientativo(
    estado,
    resumen
) {

    if (
        resumen.reglasAutomatizadas ===
        0
    ) {

        return null;

    }


    const porcentaje =
        Math.round(
            (
                resumen.cumple /
                resumen.reglasAutomatizadas
            ) *
            100
        );


    if (
        estado ===
        "NO_CUMPLE_PREEVALUACION"
    ) {

        return Math.min(
            porcentaje,
            49
        );

    }


    return porcentaje;

}


async function evaluarElegibilidad(
    idUsuario,
    oportunidadId
) {

    const perfil =
        await obtenerPerfil(
            idUsuario
        );


    if (!perfil) {

        return {

            servicio:
                "EvaluacionElegibilidadService",

            estado:
                "PERFIL_INCOMPLETO",

            disponible:
                true,

            oportunidadId:
                String(
                    oportunidadId
                ),

            mensaje:
                "Completa tu perfil antes de realizar la preevaluación."

        };

    }


    const requisitos =
        await requisitoService
            .listarRequisitosPorOportunidad(
                oportunidadId
            );


    if (
        requisitos.datos.length ===
        0
    ) {

        return {

            servicio:
                "EvaluacionElegibilidadService",

            estado:
                "NO_DETERMINABLE",

            disponible:
                true,

            oportunidadId:
                String(
                    oportunidadId
                ),

            oportunidad:
                requisitos.oportunidad,

            perfil,

            requisitosEvaluados:
                0,

            evaluaciones:
                [],

            mensaje:
                "La fuente oficial no contiene reglas estructuradas suficientes para determinar elegibilidad automáticamente.",

            advertencia:
                "La decisión oficial de elegibilidad corresponde a PRONABEC."

        };

    }


    const evaluaciones =
        requisitos.datos.map(
            requisito =>
                evaluarRequisito(
                    requisito,
                    perfil
                )
        );


    const resumen =
        resumirEvaluaciones(
            evaluaciones
        );

    const estado =
        determinarEstadoOportunidad(
            resumen
        );


    return {

        servicio:
            "EvaluacionElegibilidadService",

        estado,

        disponible:
            true,

        oportunidadId:
            String(
                oportunidadId
            ),

        oportunidad:
            requisitos.oportunidad,

        perfil,

        requisitosEvaluados:
            evaluaciones.length,

        resumen,

        evaluaciones,

        advertencia:
            "Esta es una preevaluación informativa. La decisión oficial corresponde a PRONABEC."

    };

}


async function simularElegibilidad(
    idUsuario,
    datos = {}
) {

    const perfilGuardado =
        await obtenerPerfil(
            idUsuario
        );

    const perfil =
        construirPerfilSimulacion(
            perfilGuardado,
            datos
        );


    /*
       Las fuentes gubernamentales pueden tardar o quedar bloqueadas.
       El simulador no debe quedarse esperando indefinidamente.
       Cada fuente se limita de forma independiente y la evaluación
       continúa con la información oficial que sí esté disponible.
    */

    const [
        convocatorias,
        requisitos
    ] =
        await Promise.all([

            ejecutarConTimeout(
                convocatoriaService
                    .listarConvocatorias(
                        1,
                        100
                    ),
                12000,
                {
                    modo:
                        "NO_DISPONIBLE",
                    fuente:
                        "ConvocatoriaService",
                    fuenteOficial:
                        true,
                    disponible:
                        false,
                    total:
                        0,
                    datos:
                        [],
                    motivo:
                        "ConvocatoriaService no respondió dentro del tiempo esperado."
                }
            ),

            ejecutarConTimeout(
                requisitoService
                    .listarRequisitos(),
                8000,
                {
                    servicio:
                        "RequisitoElegibilidadService",
                    fuente:
                        "DocumentoRequisitoService",
                    fuenteOficial:
                        true,
                    disponible:
                        false,
                    total:
                        0,
                    datos:
                        [],
                    motivo:
                        "Los requisitos oficiales no respondieron dentro del tiempo esperado."
                }
            )

        ]);


    const listaConvocatorias =
        extraerArreglo(
            convocatorias
        );


    const fuenteConvocatorias =
        obtenerFuente(
            convocatorias,
            "ConvocatoriaService"
        );

    const fuenteRequisitos =
        obtenerFuente(
            requisitos,
            "RequisitoElegibilidadService"
        );

    const listaRequisitos =
        Array.isArray(
            requisitos?.datos
        )
            ? requisitos.datos
            : [];


    if (
        !obtenerDisponibilidad(
            convocatorias
        ) ||
        listaConvocatorias.length ===
        0
    ) {

        return {

            servicio:
                "EvaluacionElegibilidadService",

            modo:
                "SIMULADOR",

            estado:
                "NO_DISPONIBLE",

            disponible:
                false,

            perfilEvaluado:
                perfil,

            fuente:
                fuenteConvocatorias,

            total:
                0,

            oportunidades:
                [],

            mensaje:
                convocatorias?.motivo ||
                "No hay convocatorias oficiales disponibles para ejecutar la preevaluación en este momento.",

            diagnostico: {
                convocatoriasTimeout:
                    Boolean(convocatorias?.timeout),
                requisitosTimeout:
                    Boolean(requisitos?.timeout),
                requisitosDisponibles:
                    obtenerDisponibilidad(
                        requisitos
                    )
            },

            advertencia:
                "EduPerú no genera oportunidades ni requisitos ficticios."

        };

    }


    const textoFiltro =
        normalizarTexto(
            datos.texto ||
            datos.beca ||
            ""
        );


    let oportunidades =
        listaConvocatorias
            .map(
                (
                    registro,
                    indice
                ) => ({

                    id:
                        indice + 1,

                    nombre:
                        obtenerNombreOportunidad(
                            registro,
                            indice
                        ),

                    registro

                })
            )
            .filter(
                item =>
                    esBeca(
                        item.registro
                    )
            );


    if (textoFiltro) {

        oportunidades =
            oportunidades.filter(
                item =>
                    normalizarTexto(
                        JSON.stringify(
                            item.registro
                        )
                    )
                        .includes(
                            textoFiltro
                        )
            );

    }


    oportunidades =
        oportunidades.slice(
            0,
            25
        );


    const resultados =
        oportunidades.map(
            oportunidad => {

                const requisitosOportunidad =
                    listaRequisitos.filter(
                        requisito =>
                            requisitoPerteneceAOportunidad(
                                requisito,
                                oportunidad.nombre
                            )
                    );


                const evaluaciones =
                    requisitosOportunidad.map(
                        requisito =>
                            evaluarRequisito(
                                requisito,
                                perfil
                            )
                    );


                const resumen =
                    resumirEvaluaciones(
                        evaluaciones
                    );

                const estado =
                    determinarEstadoOportunidad(
                        resumen
                    );


                return {

                    oportunidadId:
                        String(
                            oportunidad.id
                        ),

                    nombre:
                        oportunidad.nombre,

                    estado,

                    puntajeOrientativo:
                        puntajeOrientativo(
                            estado,
                            resumen
                        ),

                    resumen,

                    evaluaciones,

                    fuente:
                        fuenteConvocatorias,

                    fuenteRequisitos,

                    mensaje:
                        estado ===
                        "NO_DETERMINABLE"
                            ? "No existen reglas oficiales estructuradas suficientes para automatizar esta elegibilidad."
                            : null

                };

            }
        );


    const orden = {
        CUMPLE_PREEVALUACION:
            1,
        REQUIERE_VALIDACION:
            2,
        NO_DETERMINABLE:
            3,
        NO_CUMPLE_PREEVALUACION:
            4
    };


    resultados.sort(
        (
            a,
            b
        ) =>
            (
                orden[a.estado] ||
                99
            ) -
            (
                orden[b.estado] ||
                99
            )
    );


    const resumenGeneral = {

        total:
            resultados.length,

        cumplePreevaluacion:
            resultados.filter(
                item =>
                    item.estado ===
                    "CUMPLE_PREEVALUACION"
            )
                .length,

        requiereValidacion:
            resultados.filter(
                item =>
                    item.estado ===
                    "REQUIERE_VALIDACION"
            )
                .length,

        noDeterminable:
            resultados.filter(
                item =>
                    item.estado ===
                    "NO_DETERMINABLE"
            )
                .length,

        noCumplePreevaluacion:
            resultados.filter(
                item =>
                    item.estado ===
                    "NO_CUMPLE_PREEVALUACION"
            )
                .length

    };


    const estadoGeneral =
        resultados.length ===
        0
            ? "SIN_RESULTADOS"
            : "COMPLETADA";


    return {

        servicio:
            "EvaluacionElegibilidadService",

        modo:
            "SIMULADOR",

        estado:
            estadoGeneral,

        disponible:
            true,

        perfilEvaluado:
            perfil,

        fuentes: {

            oportunidades:
                fuenteConvocatorias,

            requisitos:
                fuenteRequisitos,

            requisitosDisponibles:
                obtenerDisponibilidad(
                    requisitos
                ),

            requisitosEstructurados:
                requisitos.total ||
                0

        },

        resumen:
            resumenGeneral,

        total:
            resultados.length,

        oportunidades:
            resultados,

        diagnostico: {

            convocatoriasTimeout:
                Boolean(
                    convocatorias?.timeout
                ),

            requisitosTimeout:
                Boolean(
                    requisitos?.timeout
                ),

            requisitosDisponibles:
                obtenerDisponibilidad(
                    requisitos
                ),

            motivoRequisitos:
                requisitos?.motivo ||
                null

        },

        advertencia:
            !obtenerDisponibilidad(
                requisitos
            )
                ? "Las oportunidades oficiales fueron analizadas, pero los requisitos estructurados no estuvieron disponibles. Por ello, la elegibilidad puede aparecer como NO_DETERMINABLE. La decisión oficial corresponde a PRONABEC."
                : "Resultado orientativo. No constituye una decisión oficial de elegibilidad ni reemplaza la revisión de las bases de PRONABEC."

    };

}


module.exports = {

    evaluarElegibilidad,

    simularElegibilidad

};
