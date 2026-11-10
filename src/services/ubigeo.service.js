const ubigeo =
    require(
        "../data/peru-ubigeo.json"
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
// INFORMACIÓN GENERAL
// ======================================================

async function obtenerResumen() {

    const departamentos =
        ubigeo.departamentos || [];


    const provincias =
        departamentos
            .flatMap(
                departamento =>
                    departamento.provincias || []
            );


    const distritos =
        provincias
            .flatMap(
                provincia =>
                    provincia.distritos || []
            );


    return {

        servicio:
            "UbigeoService",

        tipo:
            "Servicio de Catálogo Territorial",

        version:
            ubigeo.version,

        cobertura:
            ubigeo.cobertura,

        descripcion:
            ubigeo.descripcion,

        resumen: {

            departamentos:
                departamentos.length,

            provincias:
                provincias.length,

            distritos:
                distritos.length

        }

    };

}


// ======================================================
// DEPARTAMENTOS DISPONIBLES
// ======================================================

async function listarDepartamentos() {

    const datos =
        ubigeo.departamentos.map(
            departamento => ({

                codigo:
                    departamento.codigo,

                nombre:
                    departamento.nombre,

                totalProvincias:
                    departamento
                        .provincias
                        ?.length || 0

            })
        );


    return {

        servicio:
            "UbigeoService",

        nivel:
            "DEPARTAMENTO",

        cobertura:
            ubigeo.cobertura,

        total:
            datos.length,

        datos:
            datos

    };

}


// ======================================================
// PROVINCIAS POR DEPARTAMENTO
// ======================================================

async function listarProvincias(
    codigoDepartamento
) {

    const departamento =
        ubigeo.departamentos.find(
            item =>
                item.codigo ===
                String(
                    codigoDepartamento
                ).padStart(
                    2,
                    "0"
                )
        );


    if (!departamento) {

        throw new Error(
            "El departamento solicitado no está disponible en la base territorial actual."
        );

    }


    const provincias =
        (
            departamento.provincias ||
            []
        ).map(
            provincia => ({

                codigo:
                    provincia.codigo,

                nombre:
                    provincia.nombre,

                codigoDepartamento:
                    departamento.codigo,

                departamento:
                    departamento.nombre,

                totalDistritos:
                    provincia
                        .distritos
                        ?.length || 0

            })
        );


    return {

        servicio:
            "UbigeoService",

        nivel:
            "PROVINCIA",

        cobertura:
            ubigeo.cobertura,

        departamento: {

            codigo:
                departamento.codigo,

            nombre:
                departamento.nombre

        },

        total:
            provincias.length,

        datos:
            provincias

    };

}


// ======================================================
// DISTRITOS POR PROVINCIA
// ======================================================

async function listarDistritos(
    codigoProvincia
) {

    let departamentoEncontrado =
        null;


    let provinciaEncontrada =
        null;


    for (
        const departamento
        of ubigeo.departamentos
    ) {

        const provincia =
            (
                departamento.provincias ||
                []
            ).find(
                item =>
                    item.codigo ===
                    String(
                        codigoProvincia
                    ).padStart(
                        4,
                        "0"
                    )
            );


        if (provincia) {

            departamentoEncontrado =
                departamento;


            provinciaEncontrada =
                provincia;


            break;

        }

    }


    if (!provinciaEncontrada) {

        throw new Error(
            "La provincia solicitada no está disponible en la base territorial actual."
        );

    }


    const distritos =
        (
            provinciaEncontrada.distritos ||
            []
        ).map(
            distrito => ({

                codigo:
                    distrito.codigo,

                nombre:
                    distrito.nombre,

                codigoProvincia:
                    provinciaEncontrada.codigo,

                provincia:
                    provinciaEncontrada.nombre,

                codigoDepartamento:
                    departamentoEncontrado.codigo,

                departamento:
                    departamentoEncontrado.nombre

            })
        );


    return {

        servicio:
            "UbigeoService",

        nivel:
            "DISTRITO",

        cobertura:
            ubigeo.cobertura,

        departamento: {

            codigo:
                departamentoEncontrado.codigo,

            nombre:
                departamentoEncontrado.nombre

        },

        provincia: {

            codigo:
                provinciaEncontrada.codigo,

            nombre:
                provinciaEncontrada.nombre

        },

        total:
            distritos.length,

        datos:
            distritos

    };

}


// ======================================================
// BUSCAR EN TODO EL UBIGEO
// ======================================================

async function buscar(
    texto
) {

    const criterio =
        normalizar(
            texto
        );


    const resultados =
        [];


    ubigeo.departamentos.forEach(
        departamento => {

            if (
                normalizar(
                    departamento.nombre
                ).includes(
                    criterio
                )

                ||

                departamento.codigo ===
                String(texto).trim()
            ) {

                resultados.push({

                    nivel:
                        "DEPARTAMENTO",

                    codigo:
                        departamento.codigo,

                    nombre:
                        departamento.nombre,

                    departamento:
                        departamento.nombre

                });

            }


            (
                departamento.provincias ||
                []
            ).forEach(
                provincia => {

                    if (
                        normalizar(
                            provincia.nombre
                        ).includes(
                            criterio
                        )

                        ||

                        provincia.codigo ===
                        String(texto).trim()
                    ) {

                        resultados.push({

                            nivel:
                                "PROVINCIA",

                            codigo:
                                provincia.codigo,

                            nombre:
                                provincia.nombre,

                            departamento:
                                departamento.nombre

                        });

                    }


                    (
                        provincia.distritos ||
                        []
                    ).forEach(
                        distrito => {

                            if (
                                normalizar(
                                    distrito.nombre
                                ).includes(
                                    criterio
                                )

                                ||

                                distrito.codigo ===
                                String(texto).trim()
                            ) {

                                resultados.push({

                                    nivel:
                                        "DISTRITO",

                                    codigo:
                                        distrito.codigo,

                                    nombre:
                                        distrito.nombre,

                                    provincia:
                                        provincia.nombre,

                                    departamento:
                                        departamento.nombre

                                });

                            }

                        }
                    );

                }
            );

        }
    );


    return {

        servicio:
            "UbigeoService",

        operacion:
            "buscar",

        cobertura:
            ubigeo.cobertura,

        criterio:
            texto,

        total:
            resultados.length,

        datos:
            resultados

    };

}


// ======================================================
// DETALLE POR CÓDIGO
// ======================================================

async function obtenerPorCodigo(
    codigo
) {

    const codigoTexto =
        String(
            codigo
        ).trim();


    // Departamento
    if (
        codigoTexto.length === 2
    ) {

        const departamento =
            ubigeo.departamentos.find(
                item =>
                    item.codigo ===
                    codigoTexto
            );


        if (departamento) {

            return {

                servicio:
                    "UbigeoService",

                nivel:
                    "DEPARTAMENTO",

                datos: {

                    codigo:
                        departamento.codigo,

                    nombre:
                        departamento.nombre

                }

            };

        }

    }


    // Provincia
    if (
        codigoTexto.length === 4
    ) {

        for (
            const departamento
            of ubigeo.departamentos
        ) {

            const provincia =
                (
                    departamento.provincias ||
                    []
                ).find(
                    item =>
                        item.codigo ===
                        codigoTexto
                );


            if (provincia) {

                return {

                    servicio:
                        "UbigeoService",

                    nivel:
                        "PROVINCIA",

                    datos: {

                        codigo:
                            provincia.codigo,

                        nombre:
                            provincia.nombre,

                        departamento: {

                            codigo:
                                departamento.codigo,

                            nombre:
                                departamento.nombre

                        }

                    }

                };

            }

        }

    }


    // Distrito
    if (
        codigoTexto.length === 6
    ) {

        for (
            const departamento
            of ubigeo.departamentos
        ) {

            for (
                const provincia
                of departamento.provincias || []
            ) {

                const distrito =
                    (
                        provincia.distritos ||
                        []
                    ).find(
                        item =>
                            item.codigo ===
                            codigoTexto
                    );


                if (distrito) {

                    return {

                        servicio:
                            "UbigeoService",

                        nivel:
                            "DISTRITO",

                        datos: {

                            codigo:
                                distrito.codigo,

                            nombre:
                                distrito.nombre,

                            provincia: {

                                codigo:
                                    provincia.codigo,

                                nombre:
                                    provincia.nombre

                            },

                            departamento: {

                                codigo:
                                    departamento.codigo,

                                nombre:
                                    departamento.nombre

                            }

                        }

                    };

                }

            }

        }

    }


    throw new Error(
        "El código territorial solicitado no está disponible."
    );

}


// ======================================================
// EXPORTAR
// ======================================================

module.exports = {

    obtenerResumen,

    listarDepartamentos,

    listarProvincias,

    listarDistritos,

    buscar,

    obtenerPorCodigo

};