const convenioService = require(
    "./convenio.service"
);


// ======================================================
// EXTRAER REGISTROS
// ======================================================

function extraerRegistros(servicio) {

    if (!servicio) {
        return [];
    }


    const datos =
        servicio.datos;


    if (Array.isArray(datos)) {
        return datos;
    }


    if (!datos) {
        return [];
    }


    const candidatos = [

        datos.data,
        datos.rows,
        datos.records,
        datos.result?.records,
        datos.result?.data

    ];


    for (const candidato of candidatos) {

        if (Array.isArray(candidato)) {
            return candidato;
        }

    }


    for (const propiedad in datos) {

        if (Array.isArray(datos[propiedad])) {
            return datos[propiedad];
        }

    }


    return [];
}


// ======================================================
// OBTENER VALOR
// ======================================================

function obtenerValor(
    objeto,
    campos,
    defecto = null
) {

    for (const campo of campos) {

        if (
            objeto?.[campo] !== undefined &&
            objeto?.[campo] !== null &&
            String(objeto[campo]).trim() !== ""
        ) {

            return objeto[campo];

        }

    }


    return defecto;
}


// ======================================================
// NORMALIZAR TEXTO
// ======================================================

function normalizar(texto) {

    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .trim();

}


// ======================================================
// TRANSFORMAR CONVENIO EN INSTITUCIÓN
// ======================================================

function transformarInstitucion(
    registro,
    indice
) {

    const nombre =
        obtenerValor(
            registro,
            [
                "entidad",
                "ENTIDAD",
                "institucion",
                "INSTITUCION",
                "nombreInstitucion",
                "NOMBRE_INSTITUCION",
                "nombre",
                "NOMBRE"
            ],
            `Institución ${indice + 1}`
        );


    const tipo =
        obtenerValor(
            registro,
            [
                "tipoEntidad",
                "TIPO_ENTIDAD",
                "tipo_entidad",
                "tipoInstitucion",
                "TIPO_INSTITUCION"
            ],
            "Entidad educativa"
        );


    const ubicacion =
        obtenerValor(
            registro,
            [
                "ubicacion",
                "UBICACION",
                "region",
                "REGION",
                "departamento",
                "DEPARTAMENTO",
                "sede",
                "SEDE"
            ],
            "No especificada"
        );


    const convenio =
        obtenerValor(
            registro,
            [
                "tipoConvenio",
                "TIPO_CONVENIO",
                "tipo_convenio",
                "convenio",
                "CONVENIO"
            ],
            "Convenio educativo"
        );


    const estado =
        obtenerValor(
            registro,
            [
                "estado",
                "ESTADO"
            ],
            "Vigente"
        );


    return {

        id:
            indice + 1,

        nombre:
            nombre,

        tipo:
            tipo,

        ubicacion:
            ubicacion,

        convenio:
            convenio,

        estado:
            estado,

        origen:
            "ConvenioService",

        registroOriginal:
            registro

    };
}


// ======================================================
// LISTAR INSTITUCIONES
// ======================================================

async function listarInstituciones() {

    const respuestaConvenios =
        await convenioService
            .listarConvenios(
                1,
                100
            );


    const registros =
        extraerRegistros(
            respuestaConvenios
        );


    const instituciones =
        registros.map(
            transformarInstitucion
        );


    // ==================================================
    // ELIMINAR DUPLICADOS
    // ==================================================

    const mapa =
        new Map();


    instituciones.forEach(
        institucion => {

            const clave =
                `${normalizar(institucion.nombre)}|${normalizar(institucion.ubicacion)}`;


            if (!mapa.has(clave)) {

                mapa.set(
                    clave,
                    institucion
                );

            }

        }
    );


    const datos =
        Array.from(
            mapa.values()
        )
        .map(
            (institucion, indice) => ({
                ...institucion,
                id: indice + 1
            })
        );


    return {

        servicio:
            "InstitucionService",

        tipo:
            "Servicio de Catálogo / Composición",

        descripcion:
            "Construye un catálogo institucional a partir de la información disponible en ConvenioService.",

        fuentePrincipal:
            "ConvenioService",

        modo:
            respuestaConvenios.modo,

        disponible:
            respuestaConvenios.disponible,

        total:
            datos.length,

        datos:
            datos

    };
}


// ======================================================
// BUSCAR INSTITUCIONES
// ======================================================

async function buscarInstituciones(
    texto
) {

    const resultado =
        await listarInstituciones();


    const consulta =
        normalizar(
            texto
        );


    const encontrados =
        resultado.datos.filter(
            institucion => {

                const contenido =
                    normalizar(
                        `
                        ${institucion.nombre}
                        ${institucion.tipo}
                        ${institucion.ubicacion}
                        ${institucion.convenio}
                        ${institucion.estado}
                        `
                    );


                return contenido.includes(
                    consulta
                );

            }
        );


    return {

        ...resultado,

        operacion:
            "buscarInstituciones",

        criterio:
            texto,

        total:
            encontrados.length,

        datos:
            encontrados

    };
}


// ======================================================
// OBTENER DETALLE
// ======================================================

async function obtenerInstitucion(
    id
) {

    const resultado =
        await listarInstituciones();


    const institucion =
        resultado.datos.find(
            item =>
                item.id ===
                Number(id)
        );


    if (!institucion) {

        throw new Error(
            "La institución solicitada no existe."
        );

    }


    return {

        servicio:
            "InstitucionService",

        tipo:
            "Servicio de Catálogo / Composición",

        modo:
            resultado.modo,

        fuentePrincipal:
            resultado.fuentePrincipal,

        datos:
            institucion

    };
}


// ======================================================
// EXPORTAR
// ======================================================

module.exports = {

    listarInstituciones,

    buscarInstituciones,

    obtenerInstitucion

};