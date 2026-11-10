const territorioState = {

    regiones: [],

    carreras: [],

    oportunidades: [],

    instituciones: [],

    convenios: [],

    resumenUbigeo: null,

    departamento: null,

    provincia: null,

    distrito: null

};


document.addEventListener(
    "DOMContentLoaded",
    () => {

        inicializarEventosTerritorio();

        cargarExplorador();

    }
);


/* =========================================================
   EVENTOS
========================================================= */

function inicializarEventosTerritorio() {

    document
        .getElementById("refreshButton")
        ?.addEventListener(
            "click",
            cargarExplorador
        );


    document
        .getElementById("departmentSelect")
        ?.addEventListener(
            "change",
            cambiarDepartamento
        );


    document
        .getElementById("provinceSelect")
        ?.addEventListener(
            "change",
            cambiarProvincia
        );


    document
        .getElementById("districtSelect")
        ?.addEventListener(
            "change",
            cambiarDistrito
        );


    document
        .getElementById("territorySearchButton")
        ?.addEventListener(
            "click",
            aplicarTerritorio
        );


    document
        .getElementById("clearTerritoryButton")
        ?.addEventListener(
            "click",
            limpiarTerritorio
        );


    document
        .getElementById("globalSearch")
        ?.addEventListener(
            "keyup",
            async event => {

                if (
                    event.key !== "Enter"
                ) {
                    return;
                }


                await buscarTerritorio(
                    event.target.value
                );

            }
        );

}


/* =========================================================
   CARGA GENERAL OPTIMIZADA
========================================================= */

async function cargarExplorador() {

    establecerCargaTerritorial();


    // =====================================================
    // 1. CARGAR REGION SERVICE + UBIGEO SERVICE
    // =====================================================

    try {

        const [
            regionesRespuesta,
            ubigeoRespuesta
        ] = await Promise.all([

            EduPeruAPI
                .obtenerRegiones(),

            EduPeruAPI
                .obtenerResumenUbigeo()

        ]);


        territorioState.regiones =
            regionesRespuesta
                ?.resultado
                ?.datos ||
            [];


        territorioState.resumenUbigeo =
            ubigeoRespuesta
                ?.resultado ||
            null;


        cargarDepartamentos();

        actualizarKpisTerritoriales();


        actualizarCobertura(
            "Catálogo territorial cargado. Selecciona un departamento.",
            "available"
        );


        EduPeruUI
            .actualizarIconos();


    } catch (error) {

        console.error(
            "Error cargando servicios territoriales:",
            error
        );


        actualizarCobertura(
            "No se pudo cargar RegionService o UbigeoService.",
            "partial"
        );


        EduPeruUI.mostrarToast(
            "Error territorial",
            error.message,
            "error"
        );

    }


    // =====================================================
    // 2. CARGAR INFORMACIÓN EDUCATIVA
    //    CarreraService es la fuente principal para relacionar
    //    carreras, instituciones y ubicaciones.
    // =====================================================

    renderizarEstadoCargandoEducativo();


    const resultados =
        await Promise.allSettled([

            obtenerJsonTerritorial(
                "/api/carreras"
            ),

            EduPeruAPI
                .obtenerInstituciones(),

            EduPeruAPI
                .obtenerConvenios(
                    1,
                    100
                )

        ]);


    // =====================================================
    // CARRERAS / OPORTUNIDADES
    // =====================================================

    if (
        resultados[0].status ===
        "fulfilled"
    ) {

        const resultadoCarreras =
            resultados[0]
                .value
                ?.resultado ||
            resultados[0]
                .value ||
            {};


        territorioState.carreras =
            extraerRegistrosTerritoriales(
                resultadoCarreras
            );


        /*
           En Explorar Perú cada registro de CarreraService
           funciona como una oportunidad educativa territorial.
           No se inventan relaciones: se usan únicamente campos
           presentes en la fuente oficial.
        */

        territorioState.oportunidades = [
            ...territorioState.carreras
        ];


    } else {

        territorioState.carreras =
            [];

        territorioState.oportunidades =
            [];


        console.warn(
            "No se pudo cargar CarreraService:",
            resultados[0].reason
        );

    }


    // =====================================================
    // INSTITUCIONES
    // =====================================================

    let institucionesServicio =
        [];


    if (
        resultados[1].status ===
        "fulfilled"
    ) {

        institucionesServicio =
            resultados[1]
                .value
                ?.resultado
                ?.datos ||
            [];


    } else {

        console.warn(
            "No se pudieron cargar instituciones:",
            resultados[1].reason
        );

    }


    const institucionesCarreras =
        construirInstitucionesDesdeCarreras(
            territorioState.carreras
        );


    territorioState.instituciones =
        combinarInstitucionesTerritoriales(
            institucionesServicio,
            institucionesCarreras
        );


    // =====================================================
    // CONVENIOS
    // =====================================================

    if (
        resultados[2].status ===
        "fulfilled"
    ) {

        territorioState.convenios =
            extraerRegistrosTerritoriales(
                resultados[2]
                    .value
                    ?.resultado
            );


    } else {

        territorioState.convenios =
            [];


        console.warn(
            "No se pudieron cargar convenios:",
            resultados[2].reason
        );

    }


    // =====================================================
    // 3. MOSTRAR DATOS
    // =====================================================

    renderizarResultadosTerritoriales();


    EduPeruUI
        .actualizarIconos();

}


/* =========================================================
   CARGA DE SERVICIOS EDUCATIVOS
========================================================= */

function renderizarEstadoCargandoEducativo() {

    const configuracion = [

        {
            id:
                "territoryOpportunities",

            texto:
                "Cargando oportunidades..."
        },

        {
            id:
                "territoryInstitutions",

            texto:
                "Cargando instituciones..."
        },

        {
            id:
                "territoryAgreements",

            texto:
                "Cargando convenios..."
        }

    ];


    configuracion.forEach(
        item => {

            const contenedor =
                document.getElementById(
                    item.id
                );


            if (!contenedor) {
                return;
            }


            contenedor.innerHTML =
                `
                <div class="loading-state">

                    <div class="spinner"></div>

                    <span>
                        ${item.texto}
                    </span>

                </div>
                `;

        }
    );

}


/* =========================================================
   DEPARTAMENTOS
========================================================= */

function cargarDepartamentos() {

    const select =
        document.getElementById(
            "departmentSelect"
        );


    select.innerHTML =
        `
        <option value="">
            Selecciona departamento
        </option>
        `;


    territorioState.regiones
        .forEach(
            region => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    region.codigo;


                option.textContent =
                    region.nombre;


                select.appendChild(
                    option
                );

            }
        );

}


/* =========================================================
   CAMBIO DE DEPARTAMENTO
========================================================= */

async function cambiarDepartamento() {

    const codigo =
        document
            .getElementById(
                "departmentSelect"
            )
            .value;


    const provinciaSelect =
        document.getElementById(
            "provinceSelect"
        );


    const distritoSelect =
        document.getElementById(
            "districtSelect"
        );


    provinciaSelect.innerHTML =
        `
        <option value="">
            Selecciona provincia
        </option>
        `;


    distritoSelect.innerHTML =
        `
        <option value="">
            Selecciona distrito
        </option>
        `;


    provinciaSelect.disabled =
        true;


    distritoSelect.disabled =
        true;


    territorioState.provincia =
        null;


    territorioState.distrito =
        null;


    territorioState.departamento =
        territorioState
            .regiones
            .find(
                region =>
                    region.codigo ===
                    codigo
            ) ||
        null;


    if (!codigo) {

        actualizarCobertura(
            "Selecciona un departamento.",
            ""
        );


        aplicarTerritorio();

        return;

    }


    actualizarCobertura(
        "Consultando provincias disponibles...",
        ""
    );


    let provinciasUbigeo =
        [];


    try {

        const respuesta =
            await EduPeruAPI
                .obtenerProvincias(
                    codigo
                );


        provinciasUbigeo =
            respuesta
                ?.resultado
                ?.datos ||
            [];


    } catch (error) {

        console.warn(
            "UbigeoService no devolvió provincias:",
            error
        );

    }


    if (
        provinciasUbigeo.length
    ) {

        provinciasUbigeo.forEach(
            provincia => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    provincia.codigo;


                option.textContent =
                    provincia.nombre;


                option.dataset.fuente =
                    "ubigeo";


                option.dataset.nombre =
                    provincia.nombre;


                provinciaSelect.appendChild(
                    option
                );

            }
        );


        provinciaSelect.disabled =
            false;


        actualizarCobertura(
            `UbigeoService: ${provinciasUbigeo.length} provincia(s) disponibles para ${territorioState.departamento?.nombre || ""}.`,
            "available"
        );


    } else {

        const provinciasCarreras =
            obtenerProvinciasDesdeCarreras(
                territorioState
                    .departamento
                    ?.nombre ||
                ""
            );


        provinciasCarreras.forEach(
            nombre => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    nombre;


                option.textContent =
                    nombre;


                option.dataset.fuente =
                    "carreras";


                option.dataset.nombre =
                    nombre;


                provinciaSelect.appendChild(
                    option
                );

            }
        );


        provinciaSelect.disabled =
            provinciasCarreras.length ===
            0;


        if (
            provinciasCarreras.length
        ) {

            actualizarCobertura(
                `UbigeoService no tiene detalle para ${territorioState.departamento?.nombre || "este departamento"}. Se muestran ${provinciasCarreras.length} provincia(s) detectadas en los registros oficiales de CarreraService.`,
                "partial"
            );


        } else {

            actualizarCobertura(
                `El departamento existe en RegionService, pero no se encontraron provincias publicadas ni en UbigeoService ni en los registros actuales de CarreraService.`,
                "partial"
            );

        }

    }


    aplicarTerritorio();

}


/* =========================================================
   PROVINCIA
========================================================= */

async function cambiarProvincia() {

    const selectProvincia =
        document.getElementById(
            "provinceSelect"
        );


    const codigo =
        selectProvincia.value;


    const selectDistrito =
        document.getElementById(
            "districtSelect"
        );


    selectDistrito.innerHTML =
        `
        <option value="">
            Selecciona distrito
        </option>
        `;


    selectDistrito.disabled =
        true;


    territorioState.distrito =
        null;


    if (!codigo) {

        territorioState.provincia =
            null;


        aplicarTerritorio();

        return;

    }


    const option =
        selectProvincia
            .options[
                selectProvincia
                    .selectedIndex
            ];


    const fuente =
        option?.dataset
            ?.fuente ||
        "ubigeo";


    const nombreProvincia =
        option?.dataset
            ?.nombre ||
        option?.textContent ||
        codigo;


    territorioState.provincia = {

        codigo:
            fuente ===
            "ubigeo"
                ? codigo
                : null,

        nombre:
            nombreProvincia,

        fuente

    };


    let distritosUbigeo =
        [];


    if (
        fuente ===
        "ubigeo"
    ) {

        try {

            const respuesta =
                await EduPeruAPI
                    .obtenerDistritos(
                        codigo
                    );


            distritosUbigeo =
                respuesta
                    ?.resultado
                    ?.datos ||
                [];


        } catch (error) {

            console.warn(
                "UbigeoService no devolvió distritos:",
                error
            );

        }

    }


    if (
        distritosUbigeo.length
    ) {

        distritosUbigeo.forEach(
            distrito => {

                const optionDistrito =
                    document.createElement(
                        "option"
                    );


                optionDistrito.value =
                    distrito.codigo;


                optionDistrito.textContent =
                    distrito.nombre;


                optionDistrito.dataset.fuente =
                    "ubigeo";


                optionDistrito.dataset.nombre =
                    distrito.nombre;


                selectDistrito.appendChild(
                    optionDistrito
                );

            }
        );


        selectDistrito.disabled =
            false;


        actualizarCobertura(
            `${distritosUbigeo.length} distrito(s) cargados por UbigeoService para ${nombreProvincia}.`,
            "available"
        );


    } else {

        const distritosCarreras =
            obtenerDistritosDesdeCarreras(
                territorioState
                    .departamento
                    ?.nombre ||
                "",
                nombreProvincia
            );


        distritosCarreras.forEach(
            nombre => {

                const optionDistrito =
                    document.createElement(
                        "option"
                    );


                optionDistrito.value =
                    nombre;


                optionDistrito.textContent =
                    nombre;


                optionDistrito.dataset.fuente =
                    "carreras";


                optionDistrito.dataset.nombre =
                    nombre;


                selectDistrito.appendChild(
                    optionDistrito
                );

            }
        );


        selectDistrito.disabled =
            distritosCarreras.length ===
            0;


        if (
            distritosCarreras.length
        ) {

            actualizarCobertura(
                `UbigeoService no tiene detalle distrital para ${nombreProvincia}. Se muestran ${distritosCarreras.length} distrito(s) detectados en CarreraService.`,
                "partial"
            );


        } else {

            actualizarCobertura(
                `No se encontraron distritos publicados para ${nombreProvincia} en la cobertura actual.`,
                "partial"
            );

        }

    }


    aplicarTerritorio();

}


/* =========================================================
   DISTRITO
========================================================= */

function cambiarDistrito() {

    const select =
        document.getElementById(
            "districtSelect"
        );


    const valorSeleccionado =
        select.value;


    if (!valorSeleccionado) {

        territorioState.distrito =
            null;


    } else {

        const option =
            select
                .options[
                    select.selectedIndex
                ];


        const fuente =
            option?.dataset
                ?.fuente ||
            "ubigeo";


        territorioState.distrito = {

            codigo:
                fuente ===
                "ubigeo"
                    ? valorSeleccionado
                    : null,

            nombre:
                option?.dataset
                    ?.nombre ||
                option?.textContent ||
                valorSeleccionado,

            fuente

        };

    }


    aplicarTerritorio();

}


/* =========================================================
   APLICAR TERRITORIO
========================================================= */

function aplicarTerritorio() {

    const termino =
        obtenerTerminoTerritorial();


    actualizarTerritorioSeleccionado();


    const oportunidades =
        filtrarPorTerritorio(
            territorioState.oportunidades,
            termino
        );


    const instituciones =
        filtrarPorTerritorio(
            territorioState.instituciones,
            termino
        );


    const convenios =
        filtrarPorTerritorio(
            territorioState.convenios,
            termino
        );


    renderizarPanelTerritorial(

        "territoryOpportunities",

        oportunidades,

        "opportunityTerritoryCount",

        item =>
            obtenerCarreraTerritorial(
                item
            ) ||
            "Oportunidad educativa",

        item => {

            const institucion =
                obtenerInstitucionTerritorial(
                    item
                );


            const ubicacion =
                obtenerUbicacionTerritorial(
                    item
                );


            return [
                institucion,
                ubicacion
            ]
                .filter(
                    Boolean
                )
                .join(
                    " · "
                ) ||
                "Información oficial disponible";

        }

    );


    renderizarPanelTerritorial(

        "territoryInstitutions",

        instituciones,

        "institutionTerritoryCount",

        item =>
            item.nombre ||
            obtenerInstitucionTerritorial(
                item
            ) ||
            "Institución",

        item =>
            `${item.tipo || "Entidad educativa"} · ${
                item.ubicacion ||
                obtenerUbicacionTerritorial(
                    item
                ) ||
                "Ubicación no especificada"
            }`

    );


    renderizarPanelTerritorial(

        "territoryAgreements",

        convenios,

        "agreementTerritoryCount",

        item =>
            obtenerValorTerritorial(
                item,
                [
                    "entidad",
                    "ENTIDAD",
                    "institucion",
                    "INSTITUCION",
                    "nombre",
                    "NOMBRE"
                ],
                "Convenio educativo"
            ),

        item =>
            obtenerValorTerritorial(
                item,
                [
                    "tipoConvenio",
                    "TIPO_CONVENIO",
                    "ubicacion",
                    "UBICACION",
                    "departamento",
                    "DEPARTAMENTO"
                ],
                "Información disponible"
            )

    );


    EduPeruUI.actualizarIconos();

}


/* =========================================================
   FILTRO
========================================================= */

function filtrarPorTerritorio(
    registros,
    termino
) {

    if (!termino) {

        return registros;

    }


    const normal =
        normalizarTerritorio(
            termino
        );


    return registros.filter(
        registro =>

            normalizarTerritorio(
                JSON.stringify(
                    registro
                )
            ).includes(
                normal
            )

    );

}


/* =========================================================
   TERMINO MÁS ESPECÍFICO
========================================================= */

function obtenerTerminoTerritorial() {

    if (
        territorioState.distrito
    ) {

        return territorioState
            .distrito
            .nombre;

    }


    if (
        territorioState.provincia
    ) {

        return territorioState
            .provincia
            .nombre;

    }


    if (
        territorioState.departamento
    ) {

        return territorioState
            .departamento
            .nombre;

    }


    return "";

}


/* =========================================================
   PANEL
========================================================= */

function renderizarPanelTerritorial(
    id,
    registros,
    contadorId,
    obtenerTitulo,
    obtenerSubtitulo
) {

    const contenedor =
        document.getElementById(id);


    document
        .getElementById(
            contadorId
        )
        .textContent =
            `${registros.length} resultados`;


    if (!registros.length) {

        contenedor.innerHTML =
            `
            <div class="territory-empty">

                <i data-lucide="search-x"></i>

                <strong>
                    Sin coincidencias territoriales
                </strong>

                <span>
                    Los registros disponibles actualmente
                    no contienen una coincidencia verificable
                    con este territorio.
                </span>

            </div>
            `;


        return;

    }


    contenedor.innerHTML =
        registros
            .slice(
                0,
                5
            )
            .map(
                registro => `

                <div class="territory-item">

                    <strong>

                        ${EduPeruUI.escaparHTML(
                            obtenerTitulo(
                                registro
                            )
                        )}

                    </strong>

                    <span>

                        ${EduPeruUI.escaparHTML(
                            obtenerSubtitulo(
                                registro
                            )
                        )}

                    </span>

                </div>

                `
            )
            .join("");

}


/* =========================================================
   TERRITORIO SELECCIONADO
========================================================= */

function actualizarTerritorioSeleccionado() {

    const partes =
        [];


    if (
        territorioState.departamento
    ) {

        partes.push(
            territorioState
                .departamento
                .nombre
        );

    }


    if (
        territorioState.provincia
    ) {

        partes.push(
            territorioState
                .provincia
                .nombre
        );

    }


    if (
        territorioState.distrito
    ) {

        partes.push(
            territorioState
                .distrito
                .nombre
        );

    }


    document
        .getElementById(
            "selectedTerritoryName"
        )
        .textContent =
            partes.length
                ? partes.join(" → ")
                : "Todo el Perú";


    const codigo =
        territorioState
            .distrito
            ?.codigo ||
        territorioState
            .provincia
            ?.codigo ||
        territorioState
            .departamento
            ?.codigo;


    const nivelSinCodigo =
        (
            territorioState.distrito &&
            !territorioState.distrito.codigo
        ) ||
        (
            territorioState.provincia &&
            !territorioState.provincia.codigo
        );


    document
        .getElementById(
            "selectedTerritoryCode"
        )
        .textContent =
            nivelSinCodigo
                ? "Ubicación detectada en CarreraService · sin código UBIGEO publicado en esta fuente"
                : codigo
                    ? `Código territorial: ${codigo}`
                    : "Sin filtro territorial";

}


/* =========================================================
   KPI
========================================================= */

function actualizarKpisTerritoriales() {

    document
        .getElementById(
            "kpiDepartments"
        )
        .textContent =
            territorioState.regiones.length;


    const resumen =
        territorioState
            .resumenUbigeo
            ?.resumen ||
        {};


    document
        .getElementById(
            "kpiProvinces"
        )
        .textContent =
            resumen.provincias ??
            "--";


    document
        .getElementById(
            "kpiDistricts"
        )
        .textContent =
            resumen.distritos ??
            "--";


    document
        .getElementById(
            "kpiCoverage"
        )
        .textContent =
            territorioState
                .resumenUbigeo
                ?.cobertura ||
            "--";

}


/* =========================================================
   BUSCADOR TERRITORIAL
========================================================= */

async function buscarTerritorio(
    texto
) {

    const consulta =
        String(texto || "")
            .trim();


    if (!consulta) {
        return;
    }


    try {

        const respuesta =
            await EduPeruAPI
                .buscarUbigeo(
                    consulta
                );


        const resultados =
            respuesta
                ?.resultado
                ?.datos ||
            [];


        if (!resultados.length) {

            EduPeruUI.mostrarToast(
                "Territorio no encontrado",
                "No existe una coincidencia en la cobertura actual de UbigeoService.",
                "warning"
            );


            return;

        }


        const primero =
            resultados[0];


        EduPeruUI.abrirModal({

            titulo:
                "Resultado territorial",

            subtitulo:
                `${resultados.length} coincidencia(s)`,

            contenido:
                resultados
                    .slice(0, 10)
                    .map(
                        item => `

                        <div class="detail-item">

                            <span>
                                ${EduPeruUI.escaparHTML(item.nivel)}
                            </span>

                            <strong>
                                ${EduPeruUI.escaparHTML(item.nombre)}
                            </strong>

                            <span>
                                ${EduPeruUI.escaparHTML(item.codigo)}
                            </span>

                        </div>

                        `
                    )
                    .join("")

        });


        if (
            primero.departamento
        ) {

            EduPeruUI.mostrarToast(
                "Ubigeo encontrado",
                `${primero.nombre} · ${primero.departamento}`,
                "success"
            );

        }

    } catch (error) {

        EduPeruUI.mostrarToast(
            "Error territorial",
            error.message,
            "error"
        );

    }

}


/* =========================================================
   LIMPIAR
========================================================= */

function limpiarTerritorio() {

    document
        .getElementById(
            "departmentSelect"
        )
        .value =
            "";


    const provincia =
        document.getElementById(
            "provinceSelect"
        );


    const distrito =
        document.getElementById(
            "districtSelect"
        );


    provincia.innerHTML =
        `
        <option value="">
            Selecciona provincia
        </option>
        `;


    distrito.innerHTML =
        `
        <option value="">
            Selecciona distrito
        </option>
        `;


    provincia.disabled =
        true;


    distrito.disabled =
        true;


    territorioState.departamento =
        null;


    territorioState.provincia =
        null;


    territorioState.distrito =
        null;


    actualizarCobertura(
        "Selecciona un departamento.",
        ""
    );


    aplicarTerritorio();

}


/* =========================================================
   COBERTURA
========================================================= */

function actualizarCobertura(
    mensaje,
    clase
) {

    const elemento =
        document.getElementById(
            "territoryCoverage"
        );


    elemento.className =
        "territory-coverage";


    if (clase) {

        elemento.classList.add(
            clase
        );

    }


    elemento.innerHTML =
        `
        <i data-lucide="info"></i>

        <span>
            ${EduPeruUI.escaparHTML(mensaje)}
        </span>
        `;


    EduPeruUI.actualizarIconos();

}


/* =========================================================
   EXTRAER REGISTROS
========================================================= */

function extraerRegistrosTerritoriales(
    servicio
) {

    if (!servicio) {
        return [];
    }


    if (
        Array.isArray(
            servicio
        )
    ) {

        return servicio;

    }


    const datos =
        servicio.datos ??
        servicio.resultado?.datos;


    if (
        Array.isArray(datos)
    ) {
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


    for (
        const candidato
        of candidatos
    ) {

        if (
            Array.isArray(
                candidato
            )
        ) {

            return candidato;

        }

    }


    for (
        const propiedad
        in datos
    ) {

        if (
            Array.isArray(
                datos[propiedad]
            )
        ) {

            return datos[propiedad];

        }

    }


    return [];

}


/* =========================================================
   OBTENER VALOR
========================================================= */

function obtenerValorTerritorial(
    registro,
    campos,
    defecto
) {

    for (
        const campo
        of campos
    ) {

        if (
            registro?.[campo] !== undefined &&
            registro?.[campo] !== null &&
            String(
                registro[campo]
            ).trim()
        ) {

            return registro[campo];

        }

    }


    return defecto;

}


/* =========================================================
   NORMALIZAR
========================================================= */

function normalizarTerritorio(
    texto
) {

    return String(
        texto || ""
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();

}


/* =========================================================
   FUENTE EDUCATIVA TERRITORIAL
========================================================= */

async function obtenerJsonTerritorial(
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


    if (
        !respuesta.ok
    ) {

        throw new Error(
            `${url}: HTTP ${respuesta.status}`
        );

    }


    return respuesta.json();

}


function obtenerCampoDinamicoTerritorial(
    registro,
    patrones
) {

    if (
        !registro ||
        typeof registro !==
            "object"
    ) {

        return "";

    }


    const entradas =
        Object.entries(
            registro
        );


    for (
        const patron
        of patrones
    ) {

        const patronNormal =
            normalizarTerritorio(
                patron
            );


        for (
            const [
                clave,
                dato
            ]
            of entradas
        ) {

            const claveNormal =
                normalizarTerritorio(
                    clave
                )
                .replace(
                    /[_-]+/g,
                    " "
                );


            if (
                claveNormal.includes(
                    patronNormal
                ) &&
                !claveNormal.includes(
                    "codigo"
                ) &&
                dato !== undefined &&
                dato !== null &&
                String(
                    dato
                )
                .trim()
            ) {

                return String(
                    dato
                )
                .trim();

            }

        }

    }


    return "";

}


function obtenerCarreraTerritorial(
    registro
) {

    return (
        obtenerValorTerritorial(
            registro,
            [
                "carrera",
                "CARRERA",
                "nombreCarrera",
                "NOMBRE_CARRERA",
                "nombre_carrera",
                "programa",
                "PROGRAMA",
                "programaEstudio",
                "PROGRAMA_ESTUDIO",
                "nombre",
                "NOMBRE",
                "titulo",
                "TITULO"
            ],
            ""
        ) ||
        obtenerCampoDinamicoTerritorial(
            registro,
            [
                "carrera",
                "programa estudio"
            ]
        )
    );

}


function obtenerDepartamentoTerritorial(
    registro
) {

    return (
        obtenerValorTerritorial(
            registro,
            [
                "departamento",
                "DEPARTAMENTO",
                "nombreDepartamento",
                "NOMBRE_DEPARTAMENTO",
                "region",
                "REGION"
            ],
            ""
        ) ||
        obtenerCampoDinamicoTerritorial(
            registro,
            [
                "departamento",
                "region"
            ]
        )
    );

}


function obtenerProvinciaTerritorial(
    registro
) {

    return (
        obtenerValorTerritorial(
            registro,
            [
                "provincia",
                "PROVINCIA",
                "nombreProvincia",
                "NOMBRE_PROVINCIA"
            ],
            ""
        ) ||
        obtenerCampoDinamicoTerritorial(
            registro,
            [
                "provincia"
            ]
        )
    );

}


function obtenerDistritoTerritorial(
    registro
) {

    return (
        obtenerValorTerritorial(
            registro,
            [
                "distrito",
                "DISTRITO",
                "nombreDistrito",
                "NOMBRE_DISTRITO"
            ],
            ""
        ) ||
        obtenerCampoDinamicoTerritorial(
            registro,
            [
                "distrito"
            ]
        )
    );

}


function obtenerInstitucionTerritorial(
    registro
) {

    return (
        obtenerValorTerritorial(
            registro,
            [
                "institucion",
                "INSTITUCION",
                "institución",
                "INSTITUCIÓN",
                "nombreInstitucion",
                "NOMBRE_INSTITUCION",
                "universidad",
                "UNIVERSIDAD",
                "instituto",
                "INSTITUTO",
                "ies",
                "IES"
            ],
            ""
        ) ||
        obtenerCampoDinamicoTerritorial(
            registro,
            [
                "institucion",
                "universidad",
                "instituto"
            ]
        )
    );

}


function obtenerUbicacionTerritorial(
    registro
) {

    const distrito =
        obtenerDistritoTerritorial(
            registro
        );


    const provincia =
        obtenerProvinciaTerritorial(
            registro
        );


    const departamento =
        obtenerDepartamentoTerritorial(
            registro
        );


    const sede =
        obtenerValorTerritorial(
            registro,
            [
                "sede",
                "SEDE",
                "ubicacion",
                "UBICACION"
            ],
            ""
        );


    return [
        distrito,
        provincia,
        departamento,
        sede
    ]
        .filter(
            Boolean
        )
        .filter(
            (
                valor,
                indice,
                arreglo
            ) =>
                arreglo
                    .findIndex(
                        otro =>
                            normalizarTerritorio(
                                otro
                            ) ===
                            normalizarTerritorio(
                                valor
                            )
                    ) ===
                indice
        )
        .join(
            " · "
        );

}


function obtenerProvinciasDesdeCarreras(
    departamento
) {

    const departamentoNormal =
        normalizarTerritorio(
            departamento
        );


    const mapa =
        new Map();


    territorioState
        .carreras
        .forEach(
            registro => {

                const departamentoRegistro =
                    normalizarTerritorio(
                        obtenerDepartamentoTerritorial(
                            registro
                        )
                    );


                if (
                    departamentoNormal &&
                    departamentoRegistro &&
                    departamentoRegistro !==
                        departamentoNormal
                ) {

                    return;

                }


                if (
                    departamentoNormal &&
                    !departamentoRegistro &&
                    !normalizarTerritorio(
                        JSON.stringify(
                            registro
                        )
                    )
                    .includes(
                        departamentoNormal
                    )
                ) {

                    return;

                }


                const provincia =
                    obtenerProvinciaTerritorial(
                        registro
                    );


                if (
                    !provincia
                ) {

                    return;

                }


                const clave =
                    normalizarTerritorio(
                        provincia
                    );


                if (
                    clave &&
                    !mapa.has(
                        clave
                    )
                ) {

                    mapa.set(
                        clave,
                        provincia
                    );

                }

            }
        );


    return Array
        .from(
            mapa.values()
        )
        .sort(
            (
                a,
                b
            ) =>
                a.localeCompare(
                    b,
                    "es"
                )
        );

}


function obtenerDistritosDesdeCarreras(
    departamento,
    provincia
) {

    const departamentoNormal =
        normalizarTerritorio(
            departamento
        );


    const provinciaNormal =
        normalizarTerritorio(
            provincia
        );


    const mapa =
        new Map();


    territorioState
        .carreras
        .forEach(
            registro => {

                const departamentoRegistro =
                    normalizarTerritorio(
                        obtenerDepartamentoTerritorial(
                            registro
                        )
                    );


                const provinciaRegistro =
                    normalizarTerritorio(
                        obtenerProvinciaTerritorial(
                            registro
                        )
                    );


                if (
                    departamentoNormal &&
                    departamentoRegistro &&
                    departamentoRegistro !==
                        departamentoNormal
                ) {

                    return;

                }


                if (
                    provinciaNormal &&
                    provinciaRegistro !==
                        provinciaNormal
                ) {

                    return;

                }


                const distrito =
                    obtenerDistritoTerritorial(
                        registro
                    );


                if (
                    !distrito
                ) {

                    return;

                }


                const clave =
                    normalizarTerritorio(
                        distrito
                    );


                if (
                    clave &&
                    !mapa.has(
                        clave
                    )
                ) {

                    mapa.set(
                        clave,
                        distrito
                    );

                }

            }
        );


    return Array
        .from(
            mapa.values()
        )
        .sort(
            (
                a,
                b
            ) =>
                a.localeCompare(
                    b,
                    "es"
                )
        );

}


function construirInstitucionesDesdeCarreras(
    registros
) {

    const mapa =
        new Map();


    registros.forEach(
        registro => {

            const nombre =
                obtenerInstitucionTerritorial(
                    registro
                );


            if (
                !nombre
            ) {

                return;

            }


            const ubicacion =
                obtenerUbicacionTerritorial(
                    registro
                );


            const clave =
                `${normalizarTerritorio(
                    nombre
                )}|${normalizarTerritorio(
                    ubicacion
                )}`;


            if (
                !mapa.has(
                    clave
                )
            ) {

                mapa.set(
                    clave,
                    {
                        nombre,

                        tipo:
                            "Institución detectada en CarreraService",

                        ubicacion,

                        fuente:
                            "CarreraService"
                    }
                );

            }

        }
    );


    return Array
        .from(
            mapa.values()
        );

}


function combinarInstitucionesTerritoriales(
    servicio,
    carreras
) {

    const mapa =
        new Map();


    [
        ...servicio,
        ...carreras
    ]
        .forEach(
            item => {

                const nombre =
                    item?.nombre ||
                    obtenerInstitucionTerritorial(
                        item
                    );


                if (
                    !nombre
                ) {

                    return;

                }


                const ubicacion =
                    item?.ubicacion ||
                    obtenerUbicacionTerritorial(
                        item
                    );


                const clave =
                    `${normalizarTerritorio(
                        nombre
                    )}|${normalizarTerritorio(
                        ubicacion
                    )}`;


                if (
                    !mapa.has(
                        clave
                    )
                ) {

                    mapa.set(
                        clave,
                        {
                            ...item,

                            nombre,

                            ubicacion
                        }
                    );

                }

            }
        );


    return Array
        .from(
            mapa.values()
        );

}


/* =========================================================
   CARGANDO
========================================================= */

function establecerCargaTerritorial() {

    [
        "territoryOpportunities",
        "territoryInstitutions",
        "territoryAgreements"
    ].forEach(
        id => {

            const elemento =
                document.getElementById(id);


            if (elemento) {

                elemento.innerHTML =
                    `
                    <div class="loading-state">

                        <div class="spinner"></div>

                        <span>
                            Consultando servicios...
                        </span>

                    </div>
                    `;

            }

        }
    );

}


/* =========================================================
   INICIAL
========================================================= */

function renderizarResultadosTerritoriales() {

    aplicarTerritorio();

}