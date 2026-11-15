/* =========================================================
   EDUPERÚ - TOTALES REALES PRONABEC SINCRONIZADOS
   Corrige KPI usando los endpoints ya operativos.
========================================================= */

(function () {

    "use strict";

    const endpoints = {

        kpiConvocatorias:
            "/api/convocatorias?page=1&rows=1",

        kpiCarreras:
            "/api/carreras?page=1&rows=1",

        kpiConvenios:
            "/api/convenios?page=1&rows=1",

        kpiPostulaciones:
            "/api/postulaciones?page=1&rows=1"

    };


    const totales =
        {};


    function esNumeroValido(
        valor
    ) {

        if (
            valor === null ||
            valor === undefined ||
            valor === ""
        ) {

            return false;

        }


        const numero =
            Number(
                valor
            );


        return Number.isFinite(
            numero
        );

    }


    function buscarTotal(
        objeto,
        profundidad = 0
    ) {

        if (
            profundidad > 8 ||
            objeto === null ||
            objeto === undefined
        ) {

            return null;

        }


        if (
            typeof objeto !==
            "object"
        ) {

            return null;

        }


        const clavesPrioridad = [

            "total",
            "totalRows",
            "total_rows",
            "totalRegistros",
            "total_registros",
            "cantidadTotal",
            "cantidad_total",
            "cantidad"

        ];


        for (
            const clave
            of clavesPrioridad
        ) {

            if (
                Object.prototype
                    .hasOwnProperty
                    .call(
                        objeto,
                        clave
                    ) &&
                esNumeroValido(
                    objeto[clave]
                )
            ) {

                return Number(
                    objeto[clave]
                );

            }

        }


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
                String(
                    clave
                )
                    .toLowerCase()
                    .replace(
                        /[^a-z0-9]/g,
                        ""
                    );


            if (
                (
                    claveNormalizada ===
                        "total" ||
                    claveNormalizada ===
                        "totalrows" ||
                    claveNormalizada ===
                        "totalregistros" ||
                    claveNormalizada ===
                        "cantidadtotal"
                ) &&
                esNumeroValido(
                    valor
                )
            ) {

                return Number(
                    valor
                );

            }

        }


        for (
            const valor
            of Object.values(
                objeto
            )
        ) {

            if (
                valor &&
                typeof valor ===
                    "object" &&
                !Array.isArray(
                    valor
                )
            ) {

                const encontrado =
                    buscarTotal(
                        valor,
                        profundidad + 1
                    );


                if (
                    encontrado !==
                    null
                ) {

                    return encontrado;

                }

            }

        }


        return null;

    }


    async function obtenerTotal(
        url
    ) {

        const respuesta =
            await fetch(
                url,
                {
                    headers: {
                        Accept:
                            "application/json"
                    },
                    cache:
                        "no-store"
                }
            );


        if (!respuesta.ok) {

            throw new Error(
                `${url}: HTTP ${respuesta.status}`
            );

        }


        const datos =
            await respuesta.json();


        const total =
            buscarTotal(
                datos
            );


        if (
            total ===
            null
        ) {

            throw new Error(
                `No se encontró total en ${url}`
            );

        }


        return total;

    }


    function aplicarTotales() {

        for (
            const [
                id,
                total
            ]
            of Object.entries(
                totales
            )
        ) {

            const elemento =
                document.getElementById(
                    id
                );


            if (!elemento) {
                continue;
            }


            const texto =
                Number(
                    total
                )
                    .toLocaleString(
                        "es-PE"
                    );


            if (
                elemento.textContent
                    .trim() !==
                texto
            ) {

                elemento.textContent =
                    texto;

            }

        }

    }


    async function cargarTotales() {

        const resultados =
            await Promise.allSettled(

                Object.entries(
                    endpoints
                )
                    .map(
                        async (
                            [id, url]
                        ) => {

                            const total =
                                await obtenerTotal(
                                    url
                                );


                            return {
                                id,
                                total
                            };

                        }
                    )

            );


        for (
            const resultado
            of resultados
        ) {

            if (
                resultado.status ===
                "fulfilled"
            ) {

                totales[
                    resultado.value.id
                ] =
                    resultado.value.total;

            } else {

                console.warn(
                    "[Dashboard totales]",
                    resultado.reason
                        ?.message ||
                    resultado.reason
                );

            }

        }


        aplicarTotales();

    }


    function observarKpis() {

        const ids =
            Object.keys(
                endpoints
            );


        for (
            const id
            of ids
        ) {

            const elemento =
                document.getElementById(
                    id
                );


            if (!elemento) {
                continue;
            }


            const observer =
                new MutationObserver(
                    () => {

                        if (
                            totales[id] !==
                            undefined
                        ) {

                            const correcto =
                                Number(
                                    totales[id]
                                )
                                    .toLocaleString(
                                        "es-PE"
                                    );


                            if (
                                elemento.textContent
                                    .trim() !==
                                correcto
                            ) {

                                elemento.textContent =
                                    correcto;

                            }

                        }

                    }
                );


            observer.observe(
                elemento,
                {
                    childList:
                        true,
                    characterData:
                        true,
                    subtree:
                        true
                }
            );

        }

    }


    function iniciar() {

        observarKpis();

        cargarTotales();


        document
            .getElementById(
                "refreshButton"
            )
            ?.addEventListener(
                "click",
                () => {

                    setTimeout(
                        cargarTotales,
                        500
                    );

                }
            );


        setTimeout(
            cargarTotales,
            2500
        );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciar
        );

    } else {

        iniciar();

    }

})();
