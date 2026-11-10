/* =========================================================
   EDUPERÚ SOA
   CAPA CENTRAL DE COMUNICACIÓN CON EL BACKEND
========================================================= */


const EduPeruAPI = {


    baseURL:
        "/api",


    // =====================================================
    // PETICIÓN GENERAL
    // =====================================================

    async request(
        endpoint,
        options = {}
    ) {

        const controller =
            new AbortController();


        const timeout =
            setTimeout(
                () =>
                    controller.abort(),
                20000
            );


        try {

            const respuesta =
                await fetch(

                    `${this.baseURL}${endpoint}`,

                    {

                        ...options,

                        headers: {

                            "Content-Type":
                                "application/json",

                            ...(
                                options.headers ||
                                {}
                            )

                        },

                        signal:
                            controller.signal

                    }

                );


            if (
                !respuesta.ok
            ) {

                let detalle =
                    "Error del servidor";


                try {

                    const errorJSON =
                        await respuesta.json();


                    detalle =
                        errorJSON.mensaje ||
                        errorJSON.detalle ||
                        errorJSON.error ||
                        detalle;

                } catch {

                    // Respuesta no JSON

                }


                throw new Error(

                    `${respuesta.status} - ${detalle}`

                );

            }


            return await respuesta.json();

        } catch (error) {

            if (
                error.name ===
                "AbortError"
            ) {

                throw new Error(
                    "La solicitud tardó demasiado en responder."
                );

            }


            throw error;

        } finally {

            clearTimeout(
                timeout
            );

        }

    },


    // =====================================================
    // API PRINCIPAL
    // =====================================================

    async obtenerAPIPrincipal() {

        return await this.request(
            ""
        );

    },


    // =====================================================
    // HEALTH CHECK
    // =====================================================

    async obtenerHealth() {

        return await this.request(
            "/health"
        );

    },


    // =====================================================
    // CONSULTA GENERAL
    // =====================================================

    async obtenerConsultaGeneral() {

        return await this.request(
            "/consulta"
        );

    },


    // =====================================================
    // ESTADÍSTICAS
    // =====================================================

    async obtenerEstadisticas() {

        return await this.request(
            "/estadisticas"
        );

    },


    // =====================================================
    // CONVOCATORIAS
    // =====================================================

    async obtenerConvocatorias(
        pagina = 1,
        filas = 10
    ) {

        return await this.request(

            `/convocatorias?page=${pagina}&rows=${filas}`

        );

    },


    async buscarConvocatorias(
        texto
    ) {

        return await this.request(

            `/convocatorias/buscar?texto=${encodeURIComponent(texto)}`

        );

    },


    // =====================================================
    // POSTULACIONES
    // =====================================================

    async obtenerPostulaciones(
        pagina = 1,
        filas = 10
    ) {

        return await this.request(

            `/postulaciones?page=${pagina}&rows=${filas}`

        );

    },


    async buscarPostulaciones(
        texto
    ) {

        return await this.request(

            `/postulaciones/buscar?texto=${encodeURIComponent(texto)}`

        );

    },


    // =====================================================
    // DOCUMENTOS
    // =====================================================

    async obtenerDocumentos(
        pagina = 1,
        filas = 10
    ) {

        return await this.request(

            `/documentos?page=${pagina}&rows=${filas}`

        );

    },


    async buscarDocumentos(
        texto
    ) {

        return await this.request(

            `/documentos/buscar?texto=${encodeURIComponent(texto)}`

        );

    },


    // =====================================================
    // CONVENIOS
    // =====================================================

    async obtenerConvenios(
        pagina = 1,
        filas = 10
    ) {

        return await this.request(

            `/convenios?page=${pagina}&rows=${filas}`

        );

    },


    async buscarConvenios(
        texto
    ) {

        return await this.request(

            `/convenios/buscar?texto=${encodeURIComponent(texto)}`

        );

    },


    // =====================================================
    // INSTITUCIONES
    // =====================================================

    async obtenerInstituciones() {

        return await this.request(
            "/instituciones"
        );

    },


    async buscarInstituciones(
        texto
    ) {

        return await this.request(

            `/instituciones/buscar?texto=${encodeURIComponent(texto)}`

        );

    },


    async obtenerInstitucion(
        id
    ) {

        return await this.request(

            `/instituciones/${encodeURIComponent(id)}`

        );

    },


    // =====================================================
    // OPORTUNIDADES
    // =====================================================

    async obtenerDetalleOportunidad(
        indice
    ) {

        return await this.request(

            `/oportunidades/${encodeURIComponent(indice)}`

        );

    },


    // =====================================================
    // REGIONES
    // =====================================================

    async obtenerRegiones() {

        return await this.request(
            "/regiones"
        );

    },


    async buscarRegiones(
        texto
    ) {

        return await this.request(

            `/regiones/buscar?texto=${encodeURIComponent(texto)}`

        );

    },


    async obtenerRegion(
        codigo
    ) {

        return await this.request(

            `/regiones/${encodeURIComponent(codigo)}`

        );

    },


    // =====================================================
    // UBIGEO
    // =====================================================

    async obtenerResumenUbigeo() {

        return await this.request(
            "/ubigeo"
        );

    },


    async obtenerDepartamentosUbigeo() {

        return await this.request(
            "/ubigeo/departamentos"
        );

    },


    async obtenerProvincias(
        codigoDepartamento
    ) {

        return await this.request(

            `/ubigeo/departamentos/${encodeURIComponent(codigoDepartamento)}/provincias`

        );

    },


    async obtenerDistritos(
        codigoProvincia
    ) {

        return await this.request(

            `/ubigeo/provincias/${encodeURIComponent(codigoProvincia)}/distritos`

        );

    },


    async buscarUbigeo(
        texto
    ) {

        return await this.request(

            `/ubigeo/buscar?texto=${encodeURIComponent(texto)}`

        );

    },


    async obtenerUbigeo(
        codigo
    ) {

        return await this.request(

            `/ubigeo/${encodeURIComponent(codigo)}`

        );

    },


    // =====================================================
    // CONTRATOS
    // =====================================================

    async obtenerContratos() {

        return await this.request(
            "/contratos"
        );

    }

};


/* =========================================================
   GLOBAL
========================================================= */


window.EduPeruAPI =
    EduPeruAPI;