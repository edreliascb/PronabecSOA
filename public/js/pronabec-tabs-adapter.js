/* =========================================================
   EDUPERÚ - ADAPTADOR DE DATOS PARA TODAS LAS PESTAÑAS
========================================================= */

(function () {

    "use strict";


    async function pedir(
        url
    ) {

        const response =
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


        let body =
            {};


        try {

            body =
                await response.json();

        } catch {
            body = {};
        }


        if (!response.ok) {

            throw new Error(
                body?.mensaje ||
                `HTTP ${response.status}`
            );

        }


        return body;

    }


    function activar() {

        if (
            typeof EduPeruAPI ===
            "undefined"
        ) {

            console.warn(
                "[EduPerú Portal] EduPeruAPI no disponible."
            );

            return;

        }


        EduPeruAPI.obtenerConsultaGeneral =
            async function () {

                return pedir(
                    "/api/portal/consulta-general"
                );

            };


        EduPeruAPI.obtenerEstadisticas =
            async function () {

                return pedir(
                    "/api/portal/estadisticas"
                );

            };


        EduPeruAPI.obtenerConvenios =
            async function (
                pagina = 1,
                filas = 100
            ) {

                /*
                   Convenios tiene 2,291 registros.
                   Cargarlos completos es razonable para la UI actual.
                */
                return pedir(
                    "/api/portal/convenios?page=1&rows=5000"
                );

            };


        EduPeruAPI.obtenerInstituciones =
            async function () {

                return pedir(
                    "/api/portal/instituciones"
                );

            };


        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    EduPeruAPI,
                    "obtenerCarreras"
                ) ||
            typeof EduPeruAPI.obtenerCarreras ===
                "function"
        ) {

            EduPeruAPI.obtenerCarreras =
                async function () {

                    return pedir(
                        "/api/portal/carreras"
                    );

                };

        }


        console.log(
            "[EduPerú Portal] Datos PostgreSQL activos en todas las pestañas."
        );

    }


    activar();

})();
