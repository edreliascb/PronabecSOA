/* =========================================================
   EDUPERÚ - PUENTE GLOBAL DE DATOS PRONABEC V2
   Hace que todas las páginas de catálogo usen PostgreSQL.
========================================================= */

(function () {

    "use strict";


    async function pedir(
        url,
        opciones = {}
    ) {

        const response =
            await fetch(
                url,
                {
                    ...opciones,
                    headers: {
                        Accept:
                            "application/json",
                        ...(
                            opciones.headers ||
                            {}
                        )
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
                body?.message ||
                `HTTP ${response.status}`
            );

        }


        return body;

    }


    function parametros(
        objeto = {}
    ) {

        const qs =
            new URLSearchParams();


        for (
            const [
                clave,
                valor
            ]
            of Object.entries(
                objeto
            )
        ) {

            if (
                valor === undefined ||
                valor === null ||
                String(valor).trim() ===
                    ""
            ) {

                continue;

            }


            qs.set(
                clave,
                String(valor)
            );

        }


        const texto =
            qs.toString();


        return texto
            ? `?${texto}`
            : "";

    }


    const Catalogo = {

        resumen() {

            return pedir(
                "/api/portal/resumen"
            );

        },


        estadisticas() {

            return pedir(
                "/api/portal/estadisticas"
            );

        },


        consultaGeneral() {

            return pedir(
                "/api/portal/consulta-general"
            );

        },


        oportunidades(
            opciones = {}
        ) {

            return pedir(
                "/api/portal/oportunidades" +
                parametros(
                    opciones
                )
            );

        },


        convocatorias(
            opciones = {}
        ) {

            return pedir(
                "/api/portal/convocatorias" +
                parametros(
                    opciones
                )
            );

        },


        carreras(
            opciones = {}
        ) {

            return pedir(
                "/api/portal/carreras" +
                parametros(
                    opciones
                )
            );

        },


        instituciones(
            opciones = {}
        ) {

            return pedir(
                "/api/portal/instituciones" +
                parametros(
                    opciones
                )
            );

        },


        convenios(
            opciones = {}
        ) {

            return pedir(
                "/api/portal/convenios" +
                parametros(
                    opciones
                )
            );

        },


        postulaciones(
            opciones = {}
        ) {

            return pedir(
                "/api/portal/postulaciones" +
                parametros(
                    opciones
                )
            );

        }

    };


    window.EduPeruCatalogo =
        Catalogo;


    function instalarEnEduPeruAPI() {

        if (
            typeof window.EduPeruAPI ===
            "undefined"
        ) {

            return false;

        }


        const api =
            window.EduPeruAPI;


        /*
           Módulos generales:
           Dashboard, Oportunidades, Carreras,
           Instituciones, Convenios, Explorar Perú.
        */
        api.obtenerConsultaGeneral =
            () =>
                Catalogo
                    .consultaGeneral();


        api.obtenerEstadisticas =
            () =>
                Catalogo
                    .estadisticas();


        api.obtenerInstituciones =
            opciones =>
                Catalogo
                    .instituciones(
                        opciones ||
                        {}
                    );


        api.obtenerCarreras =
            opciones =>
                Catalogo
                    .carreras(
                        opciones ||
                        {}
                    );


        api.obtenerConvenios =
            (
                pagina = 1,
                filas = 5000,
                extra = {}
            ) =>
                Catalogo
                    .convenios({
                        page:
                            pagina,
                        rows:
                            Math.min(
                                Number(
                                    filas
                                ) ||
                                5000,
                                5000
                            ),
                        ...extra
                    });


        api.obtenerConvocatorias =
            (
                pagina = 1,
                filas = 200,
                extra = {}
            ) =>
                Catalogo
                    .convocatorias({
                        page:
                            pagina,
                        rows:
                            filas,
                        ...extra
                    });


        api.obtenerPostulaciones =
            (
                pagina = 1,
                filas = 200,
                extra = {}
            ) =>
                Catalogo
                    .postulaciones({
                        page:
                            pagina,
                        rows:
                            filas,
                        ...extra
                    });


        api.obtenerOportunidades =
            opciones =>
                Catalogo
                    .oportunidades(
                        opciones ||
                        {}
                    );


        api.buscarOportunidades =
            (
                texto,
                opciones = {}
            ) =>
                Catalogo
                    .oportunidades({
                        q:
                            texto ||
                            "",
                        ...opciones
                    });


        /*
           Herramientas:
           no reemplazamos la lógica personal de Simulador,
           Seguimiento o Documentos. Les dejamos un catálogo
           real disponible para seleccionar una oportunidad.
        */
        api.obtenerCatalogoPronabec =
            opciones =>
                Catalogo
                    .oportunidades(
                        opciones ||
                        {}
                    );


        api.obtenerCatalogoComparador =
            opciones =>
                Catalogo
                    .oportunidades(
                        opciones ||
                        {}
                    );


        api.obtenerCatalogoCalendario =
            opciones =>
                Catalogo
                    .convocatorias(
                        opciones ||
                        {}
                    );


        api.obtenerCatalogoRequisitos =
            opciones =>
                Catalogo
                    .oportunidades(
                        opciones ||
                        {}
                    );


        console.log(
            "[EduPerú] PostgreSQL conectado a todas las pestañas."
        );


        return true;

    }


    /*
       api.js puede estar antes o después de este archivo.
       Reintentamos brevemente sin bloquear la página.
    */
    if (
        !instalarEnEduPeruAPI()
    ) {

        let intentos =
            0;


        const timer =
            setInterval(
                () => {

                    intentos++;


                    if (
                        instalarEnEduPeruAPI() ||
                        intentos >= 40
                    ) {

                        clearInterval(
                            timer
                        );

                    }

                },
                50
            );

    }

})();
