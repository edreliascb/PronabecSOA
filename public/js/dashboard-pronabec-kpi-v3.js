/* =========================================================
   EDUPERÚ - KPI REALES DESDE PRONABEC_SYNC
========================================================= */

(function () {

    "use strict";

    const RECURSOS = {

        ConvocatoriaCarreraVigentes:
            "kpiConvocatorias",

        CarrerasElegiblesNacional:
            "kpiCarreras",

        Convenio:
            "kpiConvenios",

        PostulacionesVigentes:
            "kpiPostulaciones"

    };


    const totales =
        {};


    function formatear(
        valor
    ) {

        return Number(
            valor || 0
        )
            .toLocaleString(
                "es-PE"
            );

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


            const correcto =
                formatear(
                    total
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


    async function cargarTotalesReales() {

        try {

            const response =
                await fetch(
                    "/api/pronabec-sync/resumen",
                    {
                        headers: {
                            Accept:
                                "application/json"
                        },
                        cache:
                            "no-store"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }


            const body =
                await response.json();


            const filas =
                body?.resultado ||
                body?.datos ||
                [];


            if (
                !Array.isArray(
                    filas
                )
            ) {

                throw new Error(
                    "Formato de resumen PRONABEC inválido."
                );

            }


            for (
                const fila
                of filas
            ) {

                const id =
                    RECURSOS[
                        fila.recurso
                    ];


                if (!id) {
                    continue;
                }


                const total =
                    Number(
                        fila.total_rows ??
                        fila.totalRows ??
                        fila.total ??
                        0
                    );


                if (
                    Number.isFinite(
                        total
                    )
                ) {

                    totales[id] =
                        total;

                }

            }


            aplicarTotales();


            console.log(
                "[EduPerú] KPI PRONABEC sincronizados:",
                totales
            );

        } catch (
            error
        ) {

            console.warn(
                "[EduPerú] No se pudieron leer KPI reales:",
                error.message
            );

        }

    }


    function protegerKpis() {

        for (
            const id
            of Object.values(
                RECURSOS
            )
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
                            Object.prototype
                                .hasOwnProperty
                                .call(
                                    totales,
                                    id
                                )
                        ) {

                            const correcto =
                                formatear(
                                    totales[id]
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

        protegerKpis();

        cargarTotalesReales();


        document
            .getElementById(
                "refreshButton"
            )
            ?.addEventListener(
                "click",
                () => {

                    setTimeout(
                        cargarTotalesReales,
                        350
                    );

                }
            );


        setTimeout(
            cargarTotalesReales,
            1800
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
