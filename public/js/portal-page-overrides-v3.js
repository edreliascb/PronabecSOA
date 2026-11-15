/* =========================================================
   EDUPERÚ - OVERRIDES DE PÁGINAS CON DATOS REALES V3

   Corrige módulos que llamaban directamente endpoints antiguos.
========================================================= */

(function () {

    "use strict";


    const ruta =
        location.pathname
            .toLowerCase();


    async function json(
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
                `${url}: HTTP ${response.status}`
            );

        }


        return body;

    }


    function qs(
        objeto
    ) {

        const params =
            new URLSearchParams();


        for (
            const [
                key,
                value
            ]
            of Object.entries(
                objeto ||
                {}
            )
        ) {

            if (
                value === undefined ||
                value === null ||
                String(value).trim() ===
                    ""
            ) {

                continue;

            }


            params.set(
                key,
                String(value)
            );

        }


        return params.toString();

    }


    /* =====================================================
       OPORTUNIDADES
       Todos los 333k registros quedan accesibles mediante
       paginación/filtros del servidor.
    ===================================================== */

    if (
        ruta.endsWith(
            "/oportunidades.html"
        ) &&
        typeof oportunidadesState !==
            "undefined"
    ) {

        oportunidadesState.totalServidor =
            0;

        oportunidadesState.totalPaginasServidor =
            1;

        oportunidadesState.catalogoCarreras =
            [];

        oportunidadesState.modoServidor =
            true;


        window.cargarOportunidades =
            async function (
                pagina = 1
            ) {

                mostrarCargando();


                try {

                    const [
                        catalogoCarreras,
                        regiones
                    ] =
                        await Promise.all([

                            json(
                                "/api/portal/carreras"
                            ),

                            json(
                                "/api/regiones"
                            )

                        ]);


                    oportunidadesState
                        .catalogoCarreras =
                            catalogoCarreras
                                ?.resultado
                                ?.datos ||
                            [];


                    const regionesResultado =
                        regiones?.resultado ||
                        regiones ||
                        {};


                    oportunidadesState
                        .regionesServicio =
                            extraerRegistros(
                                regionesResultado
                            );


                    cargarFiltros();


                    await cargarPaginaServidor(
                        pagina
                    );


                    EduPeruUI
                        ?.mostrarToast?.(
                            "Oportunidades cargadas",
                            `${formatearNumero(
                                oportunidadesState
                                    .totalServidor
                            )} registros oficiales disponibles en PostgreSQL.`,
                            "success"
                        );

                } catch (error) {

                    console.error(
                        "[Oportunidades V3]",
                        error
                    );


                    mostrarError(
                        error.message
                    );

                }

            };


        window.cargarPaginaServidor =
            async function (
                pagina = 1
            ) {

                const parametros = {

                    page:
                        pagina,

                    rows:
                        oportunidadesState
                            .porPagina,

                    q:
                        document
                            .getElementById(
                                "searchInput"
                            )
                            ?.value ||
                        "",

                    carrera:
                        document
                            .getElementById(
                                "careerFilter"
                            )
                            ?.value ||
                        "",

                    region:
                        document
                            .getElementById(
                                "regionFilter"
                            )
                            ?.value ||
                        "",

                    estado:
                        document
                            .getElementById(
                                "statusFilter"
                            )
                            ?.value ||
                        ""

                };


                const body =
                    await json(
                        "/api/portal/oportunidades?" +
                        qs(
                            parametros
                        )
                    );


                const resultado =
                    body?.resultado ||
                    body ||
                    {};


                const registros =
                    resultado?.datos ||
                    resultado?.data ||
                    resultado?.rows ||
                    [];


                oportunidadesState.todos =
                    Array.isArray(
                        registros
                    )
                        ? registros
                        : [];

                oportunidadesState.filtrados = [
                    ...oportunidadesState.todos
                ];


                oportunidadesState.servicio =
                    resultado;


                oportunidadesState.totalServidor =
                    Number(
                        resultado?.total ||
                        0
                    );


                oportunidadesState
                    .totalPaginasServidor =
                        Math.max(
                            1,
                            Number(
                                resultado
                                    ?.totalPaginas ||
                                Math.ceil(
                                    oportunidadesState
                                        .totalServidor /
                                    oportunidadesState
                                        .porPagina
                                )
                            )
                        );


                oportunidadesState.paginaActual =
                    Number(
                        resultado?.pagina ||
                        pagina ||
                        1
                    );


                ordenarResultados();

                actualizarResumen();

                renderizar();

            };


        window.cargarFiltros =
            function () {

                const carreras =
                    oportunidadesState
                        .catalogoCarreras
                        .map(
                            item =>
                                item?.nombre ||
                                item?.carrera ||
                                ""
                        )
                        .filter(
                            Boolean
                        );


                const regiones =
                    oportunidadesState
                        .regionesServicio
                        .map(
                            item =>
                                typeof item ===
                                    "string"
                                    ? item
                                    : (
                                        item?.nombre ||
                                        item?.departamento ||
                                        item?.region ||
                                        ""
                                    )
                        )
                        .filter(
                            Boolean
                        );


                llenarSelect(
                    "careerFilter",
                    carreras,
                    "Todas las carreras"
                );


                llenarSelect(
                    "regionFilter",
                    regiones,
                    "Todo el Perú"
                );

            };


        window.aplicarFiltros =
            async function () {

                oportunidadesState.paginaActual =
                    1;


                try {

                    await cargarPaginaServidor(
                        1
                    );

                } catch (error) {

                    console.error(
                        "[Oportunidades filtros V3]",
                        error
                    );


                    mostrarError(
                        error.message
                    );

                }

            };


        window.actualizarResumen =
            function () {

                colocar(
                    "resultadoTotal",
                    formatearNumero(
                        oportunidadesState
                            .totalServidor
                    )
                );


                const vigentesPagina =
                    oportunidadesState
                        .filtrados
                        .filter(
                            registro =>
                                normalizar(
                                    obtenerEstado(
                                        registro
                                    )
                                )
                                    .includes(
                                        "vigente"
                                    )
                        )
                        .length;


                colocar(
                    "resultadoVigentes",
                    formatearNumero(
                        vigentesPagina
                    )
                );


                cambiarEtiquetaKpi(
                    "resultadoVigentes",
                    "Vigentes en esta página"
                );


                colocar(
                    "resultadoCarreras",
                    formatearNumero(
                        oportunidadesState
                            .catalogoCarreras
                            .length
                    )
                );


                colocar(
                    "resultadoRegiones",
                    formatearNumero(
                        oportunidadesState
                            .regionesServicio
                            .length
                    )
                );


                colocar(
                    "resultsDescription",
                    `${formatearNumero(
                        oportunidadesState
                            .totalServidor
                    )} registros oficiales encontrados`
                );

            };


        window.renderizar =
            function () {

                /*
                   En modo servidor la respuesta YA corresponde
                   únicamente a la página solicitada.
                */
                renderizarTarjetas(
                    oportunidadesState
                        .filtrados
                );


                renderizarPaginacion();


                EduPeruUI
                    ?.actualizarIconos?.();

            };


        window.renderizarPaginacion =
            function () {

                const contenedor =
                    document.getElementById(
                        "paginationContainer"
                    );


                if (!contenedor) {
                    return;
                }


                const totalPaginas =
                    oportunidadesState
                        .totalPaginasServidor;


                if (
                    totalPaginas <=
                    1
                ) {

                    contenedor.innerHTML =
                        "";

                    return;

                }


                const actual =
                    oportunidadesState
                        .paginaActual;


                const paginas =
                    new Set([
                        1,
                        totalPaginas,
                        actual - 2,
                        actual - 1,
                        actual,
                        actual + 1,
                        actual + 2
                    ]);


                const validas =
                    Array
                        .from(
                            paginas
                        )
                        .filter(
                            p =>
                                p >= 1 &&
                                p <= totalPaginas
                        )
                        .sort(
                            (
                                a,
                                b
                            ) =>
                                a - b
                        );


                let html =
                    `
                    <button
                        class="pagination-button"
                        data-page="${actual - 1}"
                        ${actual === 1 ? "disabled" : ""}
                    >
                        ‹
                    </button>
                    `;


                let anterior =
                    0;


                for (
                    const p
                    of validas
                ) {

                    if (
                        anterior &&
                        p - anterior >
                        1
                    ) {

                        html +=
                            `<span class="pagination-ellipsis">…</span>`;

                    }


                    html +=
                        `
                        <button
                            class="pagination-button ${p === actual ? "active" : ""}"
                            data-page="${p}"
                        >
                            ${p}
                        </button>
                        `;


                    anterior =
                        p;

                }


                html +=
                    `
                    <button
                        class="pagination-button"
                        data-page="${actual + 1}"
                        ${actual === totalPaginas ? "disabled" : ""}
                    >
                        ›
                    </button>
                    `;


                contenedor.innerHTML =
                    html;

            };


        window.manejarPaginacion =
            async function (
                event
            ) {

                const boton =
                    event.target.closest(
                        "[data-page]"
                    );


                if (
                    !boton ||
                    boton.disabled
                ) {

                    return;

                }


                const pagina =
                    Number(
                        boton.dataset.page
                    );


                if (
                    !Number.isInteger(
                        pagina
                    ) ||
                    pagina < 1 ||
                    pagina >
                        oportunidadesState
                            .totalPaginasServidor
                ) {

                    return;

                }


                try {

                    await cargarPaginaServidor(
                        pagina
                    );


                    window.scrollTo({
                        top:
                            250,
                        behavior:
                            "smooth"
                    });

                } catch (error) {

                    mostrarError(
                        error.message
                    );

                }

            };


        console.log(
            "[EduPerú V3] Oportunidades usa paginación real de PostgreSQL."
        );

    }


    /* =====================================================
       CARRERAS
       Se usa catálogo agregado sobre TODOS los registros.
    ===================================================== */

    if (
        ruta.endsWith(
            "/carreras.html"
        ) &&
        typeof carrerasState !==
            "undefined"
    ) {

        window.cargarCarreras =
            async function () {

                mostrarCargaCarreras();


                try {

                    const body =
                        await json(
                            "/api/portal/carreras"
                        );


                    const resultado =
                        body?.resultado ||
                        body ||
                        {};


                    const registros =
                        Array.isArray(
                            resultado?.datos
                        )
                            ? resultado.datos
                            : [];


                    carrerasState.registros =
                        registros;


                    carrerasState.totalRegistros =
                        Number(
                            resultado
                                ?.totalRegistros ||
                            0
                        );


                    carrerasState.fuente =
                        resultado?.fuente ||
                        "PRONABEC - PostgreSQL";


                    carrerasState.carreras =
                        registros.map(
                            item => ({

                                nombre:
                                    item.nombre ||
                                    item.carrera ||
                                    "Carrera",

                                registros:
                                    Number(
                                        item.oportunidades ||
                                        item.registros ||
                                        0
                                    ),

                                oportunidades:
                                    Number(
                                        item.oportunidades ||
                                        item.registros ||
                                        0
                                    ),

                                instituciones:
                                    Array.isArray(
                                        item.institucionesLista
                                    )
                                        ? item.institucionesLista
                                        : [],

                                ubicaciones:
                                    Array.isArray(
                                        item.regionesLista
                                    )
                                        ? item.regionesLista
                                        : [],

                                convocatorias:
                                    Array.isArray(
                                        item.convocatoriasLista
                                    )
                                        ? item.convocatoriasLista
                                        : [],

                                ejemplos:
                                    []

                            })
                        );


                    carrerasState.filtradas = [
                        ...carrerasState.carreras
                    ];


                    actualizarKPICarreras();

                    filtrarCarreras();


                    EduPeruUI
                        ?.actualizarIconos?.();

                } catch (error) {

                    console.error(
                        "[Carreras V3]",
                        error
                    );


                    mostrarErrorCarreras(
                        error.message
                    );

                }

            };


        console.log(
            "[EduPerú V3] Carreras usa catálogo completo agregado."
        );

    }


    /* =====================================================
       INSTITUCIONES
       Catálogo agregado sobre Carreras + Convenios.
    ===================================================== */

    if (
        ruta.endsWith(
            "/instituciones.html"
        ) &&
        typeof institucionesState !==
            "undefined"
    ) {

        window.cargarInstituciones =
            async function () {

                mostrarCargandoInstituciones();


                try {

                    const [
                        institucionesBody,
                        estadisticasBody
                    ] =
                        await Promise.all([

                            json(
                                "/api/portal/instituciones"
                            ),

                            json(
                                "/api/portal/estadisticas"
                            )

                        ]);


                    const institucionesResultado =
                        institucionesBody
                            ?.resultado ||
                        institucionesBody ||
                        {};


                    const registros =
                        Array.isArray(
                            institucionesResultado
                                ?.datos
                        )
                            ? institucionesResultado
                                .datos
                            : [];


                    institucionesState.modo =
                        "POSTGRES_SINCRONIZADO";


                    institucionesState
                        .fuentePrincipal =
                            "PRONABEC - PostgreSQL";


                    institucionesState
                        .conveniosCargados =
                            [];


                    institucionesState
                        .totalConveniosOficial =
                            Number(
                                estadisticasBody
                                    ?.resultado
                                    ?.resumen
                                    ?.totalConvenios ||
                                0
                            );


                    institucionesState.todos =
                        construirCatalogoInstituciones(
                            registros,
                            []
                        );


                    institucionesState.filtrados = [
                        ...institucionesState.todos
                    ];


                    institucionesState.paginaActual =
                        1;


                    cargarFiltrosInstituciones();

                    ordenarInstituciones();

                    actualizarIndicadoresInstituciones();

                    renderizarInstituciones();


                    EduPeruUI
                        ?.mostrarToast?.(
                            "Instituciones cargadas",
                            `${institucionesState.todos.length} instituciones reales disponibles.`,
                            "success"
                        );

                } catch (error) {

                    console.error(
                        "[Instituciones V3]",
                        error
                    );


                    mostrarErrorInstituciones(
                        error.message
                    );

                }

            };


        console.log(
            "[EduPerú V3] Instituciones usa catálogo completo agregado."
        );

    }


    /* =====================================================
       CONVENIOS
       2,291 registros: se pueden cargar completos.
    ===================================================== */

    if (
        ruta.endsWith(
            "/convenios.html"
        ) &&
        typeof conveniosState !==
            "undefined"
    ) {

        window.cargarConvenios =
            async function () {

                mostrarCargandoConvenios();


                try {

                    const [
                        body,
                        institucionesBody,
                        statsBody
                    ] =
                        await Promise.all([

                            json(
                                "/api/portal/convenios?page=1&rows=5000"
                            ),

                            json(
                                "/api/portal/instituciones"
                            ),

                            json(
                                "/api/portal/estadisticas"
                            )

                        ]);


                    const resultado =
                        body?.resultado ||
                        body ||
                        {};


                    const servicio =
                        resultado?.datos ||
                        resultado;


                    const registros =
                        servicio?.datos ||
                        servicio?.data ||
                        servicio?.rows ||
                        [];


                    conveniosState.modo =
                        "POSTGRES_SINCRONIZADO";


                    conveniosState.fuente =
                        "PRONABEC - PostgreSQL";


                    conveniosState.disponible =
                        true;


                    conveniosState.todos =
                        (
                            Array.isArray(
                                registros
                            )
                                ? registros
                                : []
                        )
                            .map(
                                (
                                    registro,
                                    indice
                                ) =>
                                    normalizarRegistroConvenio(
                                        registro,
                                        indice
                                    )
                            )
                            .filter(
                                convenio =>
                                    convenio.institucion !==
                                    "Institución no especificada"
                            );


                    conveniosState.filtrados = [
                        ...conveniosState.todos
                    ];


                    conveniosState.instituciones =
                        institucionesBody
                            ?.resultado
                            ?.datos ||
                        [];


                    conveniosState.totalOficial =
                        Number(
                            statsBody
                                ?.resultado
                                ?.resumen
                                ?.totalConvenios ||
                            servicio?.total ||
                            conveniosState
                                .todos
                                .length
                        );


                    conveniosState.paginaActual =
                        1;


                    cargarFiltrosConvenios();

                    ordenarConvenios();

                    actualizarKpisConvenios();

                    renderizarConvenios();


                    EduPeruUI
                        ?.mostrarToast?.(
                            "Convenios cargados",
                            `${formatearNumeroConvenio(
                                conveniosState.totalOficial
                            )} convenios oficiales disponibles.`,
                            "success"
                        );

                } catch (error) {

                    console.error(
                        "[Convenios V3]",
                        error
                    );


                    mostrarErrorConvenios(
                        error.message
                    );

                }

            };


        console.log(
            "[EduPerú V3] Convenios usa los 2,291 registros sincronizados."
        );

    }

})();
