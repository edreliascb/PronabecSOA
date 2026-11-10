const regiones =
    require(
        "../data/peru-regiones.json"
    );


// ======================================================
// NORMALIZAR
// ======================================================

function normalizar(texto) {

    return String(
        texto || ""
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toUpperCase()
        .trim();

}


// ======================================================
// LISTAR REGIONES
// ======================================================

async function listarRegiones() {

    return {

        servicio:
            "RegionService",

        tipo:
            "Servicio de Catálogo",

        descripcion:
            "Catálogo territorial departamental utilizado por EduPerú.",

        nivel:
            "Departamento",

        fuente:
            "Catálogo territorial local de EduPerú",

        total:
            regiones.length,

        datos:
            regiones

    };

}


// ======================================================
// BUSCAR REGIÓN
// ======================================================

async function buscarRegiones(
    texto
) {

    const criterio =
        normalizar(
            texto
        );


    const encontrados =
        regiones.filter(
            region => {

                return (
                    normalizar(
                        region.nombre
                    ).includes(
                        criterio
                    )

                    ||

                    region.codigo ===
                    String(texto)
                        .trim()
                );

            }
        );


    return {

        servicio:
            "RegionService",

        tipo:
            "Servicio de Catálogo",

        operacion:
            "buscarRegiones",

        criterio:
            texto,

        total:
            encontrados.length,

        datos:
            encontrados

    };

}


// ======================================================
// OBTENER REGIÓN
// ======================================================

async function obtenerRegion(
    codigo
) {

    const region =
        regiones.find(
            item =>
                item.codigo ===
                String(codigo)
                    .padStart(
                        2,
                        "0"
                    )
        );


    if (!region) {

        throw new Error(
            "La región solicitada no existe."
        );

    }


    return {

        servicio:
            "RegionService",

        tipo:
            "Servicio de Catálogo",

        datos:
            region

    };

}


// ======================================================
// EXPORTAR
// ======================================================

module.exports = {

    listarRegiones,

    buscarRegiones,

    obtenerRegion

};