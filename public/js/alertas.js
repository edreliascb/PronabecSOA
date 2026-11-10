/* =========================================================
   EDUPERÚ - ALERTAS
   SQL SERVER + JWT + ALERTASERVICE
========================================================= */

const ALERTAS_API =
    "/api/alertas";

const TOKEN_STORAGE_KEY =
    "eduperu_token";


const alertasState = {

    todas: [],

    filtradas: [],

    oportunidades: [],

    cargando: false

};


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        configurarEventosAlertas();

        if (!obtenerTokenAlerta()) {

            redirigirLoginAlertas();

            return;

        }

        await cargarModuloAlertas();

    }
);


/* =========================================================
   EVENTOS
========================================================= */

function configurarEventosAlertas() {

    document
        .getElementById("alertForm")
        ?.addEventListener(
            "submit",
            crearAlerta
        );


    document
        .getElementById("alertsSearch")
        ?.addEventListener(
            "input",
            filtrarAlertas
        );


    document
        .getElementById("globalSearch")
        ?.addEventListener(
            "input",
            event => {

                const input =
                    document.getElementById(
                        "alertsSearch"
                    );


                if (input) {

                    input.value =
                        event.target.value;

                }


                filtrarAlertas();

            }
        );


    document
        .getElementById("alertsFilter")
        ?.addEventListener(
            "change",
            filtrarAlertas
        );


    document
        .getElementById("refreshButton")
        ?.addEventListener(
            "click",
            async () => {

                await cargarModuloAlertas(
                    true
                );

            }
        );


    document
        .getElementById("alertsGrid")
        ?.addEventListener(
            "click",
            manejarAccionAlerta
        );

}


/* =========================================================
   AUTENTICACIÓN / PETICIONES
========================================================= */

function obtenerTokenAlerta() {

    try {

        if (
            window.EduPeruAuth &&
            typeof window.EduPeruAuth.obtenerToken ===
            "function"
        ) {

            const token =
                window.EduPeruAuth
                    .obtenerToken();


            if (token) {
                return token;
            }

        }

    } catch {
        // Se usa el respaldo de LocalStorage.
    }


    return localStorage.getItem(
        TOKEN_STORAGE_KEY
    );

}


function redirigirLoginAlertas() {

    EduPeruUI?.mostrarToast?.(
        "Inicio de sesión requerido",
        "Inicia sesión para administrar tus alertas.",
        "warning"
    );


    setTimeout(
        () => {

            window.location.href =
                "/pages/login.html";

        },
        500
    );

}


async function peticionAlerta(
    ruta = "",
    opciones = {}
) {

    const token =
        obtenerTokenAlerta();


    if (!token) {

        redirigirLoginAlertas();

        throw new Error(
            "Se requiere autenticación."
        );

    }


    const headers = {

        Authorization:
            `Bearer ${token}`,

        ...(opciones.headers || {})

    };


    if (
        opciones.body !== undefined &&
        !headers["Content-Type"]
    ) {

        headers["Content-Type"] =
            "application/json";

    }


    const respuesta =
        await fetch(
            `${ALERTAS_API}${ruta}`,
            {
                ...opciones,
                headers
            }
        );


    let datos = null;


    try {

        datos =
            await respuesta.json();

    } catch {

        datos = {};

    }


    if (
        respuesta.status === 401 ||
        respuesta.status === 403
    ) {

        if (
            respuesta.status === 401
        ) {

            localStorage.removeItem(
                TOKEN_STORAGE_KEY
            );

            localStorage.removeItem(
                "eduperu_usuario"
            );


            redirigirLoginAlertas();

        }

    }


    if (!respuesta.ok) {

        throw new Error(
            datos?.mensaje ||
            "No fue posible completar la operación."
        );

    }


    return datos;

}


/* =========================================================
   CARGA GENERAL
========================================================= */

async function cargarModuloAlertas(
    mostrarMensaje = false
) {

    if (alertasState.cargando) {
        return;
    }


    alertasState.cargando =
        true;


    mostrarCargandoAlertas();


    try {

        await Promise.all([

            cargarAlertasServidor(),

            cargarOportunidadesAlertas(
                false
            )

        ]);


        actualizarCoincidencias();

        actualizarKpisAlertas();

        filtrarAlertas();


        if (mostrarMensaje) {

            EduPeruUI.mostrarToast(
                "Alertas actualizadas",
                "Se sincronizaron tus alertas y se revisaron las oportunidades disponibles.",
                "success"
            );

        }

    } catch (error) {

        console.error(
            "Error cargando alertas:",
            error
        );


        mostrarErrorAlertas(
            error.message
        );

    } finally {

        alertasState.cargando =
            false;

    }

}


/* =========================================================
   CARGAR ALERTAS DESDE SQL SERVER
========================================================= */

async function cargarAlertasServidor() {

    const respuesta =
        await peticionAlerta();


    const registros =
        Array.isArray(
            respuesta?.resultado
        )
            ? respuesta.resultado
            : [];


    alertasState.todas =
        registros.map(
            normalizarAlertaServidor
        );


    alertasState.filtradas = [
        ...alertasState.todas
    ];

}


/* =========================================================
   NORMALIZAR REGISTRO SQL SERVER
========================================================= */

function normalizarAlertaServidor(
    alerta
) {

    return {

        id:
            Number(
                alerta?.id_alerta ??
                alerta?.id
            ),

        id_usuario:
            Number(
                alerta?.id_usuario ||
                0
            ),

        nombre:
            String(
                alerta?.nombre ||
                "Alerta educativa"
            ),

        palabra:
            String(
                alerta?.palabra_clave ??
                alerta?.palabra ??
                ""
            ),

        region:
            String(
                alerta?.region ??
                ""
            ),

        activa:
            Boolean(
                alerta?.activa
            ),

        coincidencias:
            Number(
                alerta?.coincidencias ||
                0
            ),

        creada:
            alerta?.fecha_creacion ??
            alerta?.creada ??
            null

    };

}


/* =========================================================
   OPORTUNIDADES
========================================================= */

async function cargarOportunidadesAlertas(
    actualizarPantalla = true
) {

    try {

        const respuesta =
            await EduPeruAPI
                .obtenerConvocatorias(
                    1,
                    100
                );


        alertasState.oportunidades =
            extraerOportunidadesAlerta(
                respuesta
            );


    } catch (error) {

        console.error(
            "Error cargando oportunidades para alertas:",
            error
        );


        alertasState.oportunidades =
            [];

    }


    if (actualizarPantalla) {

        actualizarCoincidencias();

        actualizarKpisAlertas();

        filtrarAlertas();

    }

}


/* =========================================================
   CREAR
========================================================= */

async function crearAlerta(
    event
) {

    event.preventDefault();


    const formulario =
        event.currentTarget;


    const nombre =
        document
            .getElementById(
                "alertName"
            )
            ?.value
            .trim() ||
        "";


    const palabra =
        document
            .getElementById(
                "alertKeyword"
            )
            ?.value
            .trim() ||
        "";


    const region =
        document
            .getElementById(
                "alertRegion"
            )
            ?.value
            .trim() ||
        "";


    if (!nombre) {

        EduPeruUI.mostrarToast(
            "Falta el nombre",
            "Escribe un nombre para la alerta.",
            "warning"
        );

        return;

    }


    if (
        !palabra &&
        !region
    ) {

        EduPeruUI.mostrarToast(
            "Falta un criterio",
            "Ingresa una palabra clave, carrera o ubicación.",
            "warning"
        );

        return;

    }


    const boton =
        formulario.querySelector(
            '[type="submit"]'
        );


    cambiarEstadoBoton(
        boton,
        true,
        "Guardando..."
    );


    try {

        const respuesta =
            await peticionAlerta(
                "",
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify({

                            nombre,

                            palabra_clave:
                                palabra ||
                                null,

                            region:
                                region ||
                                null

                        })
                }
            );


        const alerta =
            normalizarAlertaServidor(
                respuesta.resultado
            );


        calcularCoincidenciasAlerta(
            alerta
        );


        alertasState.todas.unshift(
            alerta
        );


        formulario.reset();


        actualizarKpisAlertas();

        filtrarAlertas();


        EduPeruUI.mostrarToast(
            "Alerta creada",
            "La alerta quedó guardada en SQL Server y vinculada a tu cuenta.",
            "success"
        );

    } catch (error) {

        EduPeruUI.mostrarToast(
            "No se pudo crear",
            error.message,
            "error"
        );

    } finally {

        cambiarEstadoBoton(
            boton,
            false,
            "Crear alerta"
        );

        EduPeruUI.actualizarIconos();

    }

}


/* =========================================================
   COINCIDENCIAS
========================================================= */

function actualizarCoincidencias() {

    alertasState.todas
        .forEach(
            alerta => {

                calcularCoincidenciasAlerta(
                    alerta
                );

            }
        );

}


function calcularCoincidenciasAlerta(
    alerta
) {

    if (!alerta.activa) {

        alerta.coincidencias =
            0;

        return;

    }


    alerta.coincidencias =
        alertasState
            .oportunidades
            .filter(
                oportunidad =>
                    coincideConAlerta(
                        oportunidad,
                        alerta
                    )
            )
            .length;

}


function coincideConAlerta(
    oportunidad,
    alerta
) {

    const contenido =
        normalizarTextoAlerta(
            JSON.stringify(
                oportunidad
            )
        );


    const palabra =
        normalizarTextoAlerta(
            alerta.palabra
        );


    const region =
        normalizarTextoAlerta(
            alerta.region
        );


    const coincidePalabra =
        !palabra ||
        contenido.includes(
            palabra
        );


    const coincideRegion =
        !region ||
        contenido.includes(
            region
        );


    return (
        coincidePalabra &&
        coincideRegion
    );

}


/* =========================================================
   FILTROS
========================================================= */

function filtrarAlertas() {

    const texto =
        normalizarTextoAlerta(
            document
                .getElementById(
                    "alertsSearch"
                )
                ?.value
        );


    const filtro =
        document
            .getElementById(
                "alertsFilter"
            )
            ?.value ||
        "";


    alertasState.filtradas =
        alertasState
            .todas
            .filter(
                alerta => {

                    const coincideTexto =
                        !texto ||
                        normalizarTextoAlerta(
                            JSON.stringify(
                                alerta
                            )
                        )
                            .includes(
                                texto
                            );


                    let coincideEstado =
                        true;


                    if (
                        filtro ===
                        "active"
                    ) {

                        coincideEstado =
                            alerta.activa ===
                            true;

                    }


                    if (
                        filtro ===
                        "inactive"
                    ) {

                        coincideEstado =
                            alerta.activa ===
                            false;

                    }


                    if (
                        filtro ===
                        "matches"
                    ) {

                        coincideEstado =
                            Number(
                                alerta.coincidencias
                            ) > 0;

                    }


                    return (
                        coincideTexto &&
                        coincideEstado
                    );

                }
            );


    renderizarAlertas();

}


/* =========================================================
   RENDER
========================================================= */

function renderizarAlertas() {

    const contenedor =
        document.getElementById(
            "alertsGrid"
        );


    if (!contenedor) {
        return;
    }


    colocarTextoAlerta(
        "alertsResultText",
        `${alertasState.filtradas.length} alerta(s)`
    );


    if (
        alertasState
            .filtradas
            .length === 0
    ) {

        contenedor.innerHTML =
            `
            <div class="alerts-empty">

                <div class="alerts-empty-icon">
                    <i data-lucide="bell"></i>
                </div>

                <h4>
                    No hay alertas para mostrar
                </h4>

                <p>
                    Crea una alerta indicando una carrera,
                    palabra clave o ubicación.
                </p>

            </div>
            `;


        EduPeruUI.actualizarIconos();

        return;

    }


    contenedor.innerHTML =
        alertasState
            .filtradas
            .map(
                alerta => `

                <article class="alert-card ${alerta.activa ? "" : "inactive"}">

                    <div class="alert-card-header">

                        <div class="alert-card-icon">
                            <i data-lucide="${alerta.activa ? "bell-ring" : "bell-off"}"></i>
                        </div>

                        <span class="alert-status ${alerta.activa ? "active" : "inactive"}">
                            ${alerta.activa ? "ACTIVA" : "DESACTIVADA"}
                        </span>

                    </div>


                    <h4>
                        ${EduPeruUI.escaparHTML(
                            alerta.nombre
                        )}
                    </h4>


                    <p>
                        Regla personalizada de seguimiento
                        de oportunidades educativas.
                    </p>


                    <div class="alert-criteria">

                        <span>
                            <i data-lucide="search"></i>

                            ${
                                alerta.palabra
                                    ? EduPeruUI.escaparHTML(
                                        alerta.palabra
                                    )
                                    : "Cualquier palabra clave"
                            }
                        </span>


                        <span>
                            <i data-lucide="map-pin"></i>

                            ${
                                alerta.region
                                    ? EduPeruUI.escaparHTML(
                                        alerta.region
                                    )
                                    : "Cualquier ubicación"
                            }
                        </span>

                    </div>


                    <div class="alert-match">

                        Coincidencias actuales:

                        <strong>
                            ${alerta.coincidencias || 0}
                        </strong>

                    </div>


                    <div class="alert-card-footer">

                        <button
                            class="alert-action edit"
                            type="button"
                            data-edit-alert="${alerta.id}"
                        >
                            Editar
                        </button>

                        <button
                            class="alert-action toggle"
                            type="button"
                            data-toggle-alert="${alerta.id}"
                        >
                            ${
                                alerta.activa
                                    ? "Desactivar"
                                    : "Activar"
                            }
                        </button>

                        <button
                            class="alert-action delete"
                            type="button"
                            data-delete-alert="${alerta.id}"
                        >
                            Eliminar
                        </button>

                    </div>

                </article>

                `
            )
            .join("");


    EduPeruUI.actualizarIconos();

}


/* =========================================================
   ACCIONES
========================================================= */

function manejarAccionAlerta(
    event
) {

    const editar =
        event.target.closest(
            "[data-edit-alert]"
        );


    if (editar) {

        abrirEditorAlerta(
            Number(
                editar.dataset
                    .editAlert
            )
        );

        return;

    }


    const toggle =
        event.target.closest(
            "[data-toggle-alert]"
        );


    if (toggle) {

        cambiarEstadoAlerta(
            Number(
                toggle.dataset
                    .toggleAlert
            )
        );

        return;

    }


    const eliminar =
        event.target.closest(
            "[data-delete-alert]"
        );


    if (eliminar) {

        eliminarAlerta(
            Number(
                eliminar.dataset
                    .deleteAlert
            )
        );

    }

}


/* =========================================================
   ACTIVAR / DESACTIVAR
========================================================= */

async function cambiarEstadoAlerta(
    id
) {

    const alerta =
        alertasState
            .todas
            .find(
                item =>
                    item.id === id
            );


    if (!alerta) {
        return;
    }


    try {

        const respuesta =
            await peticionAlerta(
                `/${id}/estado`,
                {
                    method:
                        "PATCH",

                    body:
                        JSON.stringify({
                            activa:
                                !alerta.activa
                        })
                }
            );


        const actualizada =
            normalizarAlertaServidor(
                respuesta.resultado
            );


        alerta.activa =
            actualizada.activa;


        calcularCoincidenciasAlerta(
            alerta
        );


        actualizarKpisAlertas();

        filtrarAlertas();


        EduPeruUI.mostrarToast(
            alerta.activa
                ? "Alerta activada"
                : "Alerta desactivada",
            "El estado se actualizó correctamente en SQL Server.",
            "success"
        );

    } catch (error) {

        EduPeruUI.mostrarToast(
            "No se pudo actualizar",
            error.message,
            "error"
        );

    }

}


/* =========================================================
   EDITAR
========================================================= */

function abrirEditorAlerta(
    id
) {

    const alerta =
        alertasState
            .todas
            .find(
                item =>
                    item.id === id
            );


    if (!alerta) {
        return;
    }


    cerrarEditorAlerta();


    const overlay =
        document.createElement(
            "div"
        );


    overlay.className =
        "alert-editor-overlay";

    overlay.id =
        "alertEditorOverlay";


    overlay.innerHTML =
        `
        <div class="alert-editor-modal">

            <div class="alert-editor-header">

                <div>
                    <span>Alerta educativa</span>
                    <h3>Editar alerta</h3>
                </div>

                <button
                    type="button"
                    class="alert-editor-close"
                    data-close-alert-editor
                    aria-label="Cerrar"
                >
                    <i data-lucide="x"></i>
                </button>

            </div>


            <form id="alertEditForm">

                <div class="alert-editor-field">
                    <label for="editAlertName">Nombre</label>

                    <input
                        id="editAlertName"
                        type="text"
                        maxlength="100"
                        required
                        value="${escaparAtributoAlerta(alerta.nombre)}"
                    >
                </div>


                <div class="alert-editor-field">
                    <label for="editAlertKeyword">
                        Palabra clave o carrera
                    </label>

                    <input
                        id="editAlertKeyword"
                        type="text"
                        maxlength="150"
                        value="${escaparAtributoAlerta(alerta.palabra)}"
                    >
                </div>


                <div class="alert-editor-field">
                    <label for="editAlertRegion">
                        Región o ubicación
                    </label>

                    <input
                        id="editAlertRegion"
                        type="text"
                        maxlength="100"
                        value="${escaparAtributoAlerta(alerta.region)}"
                    >
                </div>


                <div class="alert-editor-actions">

                    <button
                        type="button"
                        class="btn btn-secondary"
                        data-close-alert-editor
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Guardar cambios
                    </button>

                </div>

            </form>

        </div>
        `;


    document.body.appendChild(
        overlay
    );


    overlay
        .querySelectorAll(
            "[data-close-alert-editor]"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    cerrarEditorAlerta
                );

            }
        );


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                overlay
            ) {

                cerrarEditorAlerta();

            }

        }
    );


    overlay
        .querySelector(
            "#alertEditForm"
        )
        ?.addEventListener(
            "submit",
            event =>
                guardarEdicionAlerta(
                    event,
                    id
                )
        );


    EduPeruUI.actualizarIconos();


    document
        .getElementById(
            "editAlertName"
        )
        ?.focus();

}


function cerrarEditorAlerta() {

    document
        .getElementById(
            "alertEditorOverlay"
        )
        ?.remove();

}


async function guardarEdicionAlerta(
    event,
    id
) {

    event.preventDefault();


    const nombre =
        document
            .getElementById(
                "editAlertName"
            )
            ?.value
            .trim() ||
        "";


    const palabra =
        document
            .getElementById(
                "editAlertKeyword"
            )
            ?.value
            .trim() ||
        "";


    const region =
        document
            .getElementById(
                "editAlertRegion"
            )
            ?.value
            .trim() ||
        "";


    if (!nombre) {

        EduPeruUI.mostrarToast(
            "Falta el nombre",
            "El nombre de la alerta es obligatorio.",
            "warning"
        );

        return;

    }


    if (
        !palabra &&
        !region
    ) {

        EduPeruUI.mostrarToast(
            "Falta un criterio",
            "Ingresa una palabra clave, carrera o ubicación.",
            "warning"
        );

        return;

    }


    const boton =
        event.currentTarget
            .querySelector(
                '[type="submit"]'
            );


    cambiarEstadoBoton(
        boton,
        true,
        "Guardando..."
    );


    try {

        const respuesta =
            await peticionAlerta(
                `/${id}`,
                {
                    method:
                        "PUT",

                    body:
                        JSON.stringify({

                            nombre,

                            palabra_clave:
                                palabra ||
                                null,

                            region:
                                region ||
                                null

                        })
                }
            );


        const actualizada =
            normalizarAlertaServidor(
                respuesta.resultado
            );


        const posicion =
            alertasState.todas
                .findIndex(
                    item =>
                        item.id === id
                );


        if (
            posicion >= 0
        ) {

            alertasState.todas[posicion] =
                actualizada;

            calcularCoincidenciasAlerta(
                alertasState.todas[posicion]
            );

        }


        cerrarEditorAlerta();

        actualizarKpisAlertas();

        filtrarAlertas();


        EduPeruUI.mostrarToast(
            "Alerta actualizada",
            "Los cambios se guardaron correctamente en SQL Server.",
            "success"
        );

    } catch (error) {

        EduPeruUI.mostrarToast(
            "No se pudo guardar",
            error.message,
            "error"
        );


        cambiarEstadoBoton(
            boton,
            false,
            "Guardar cambios"
        );

    }

}


/* =========================================================
   ELIMINAR
========================================================= */

async function eliminarAlerta(
    id
) {

    const confirmar =
        window.confirm(
            "¿Deseas eliminar esta alerta?"
        );


    if (!confirmar) {
        return;
    }


    try {

        await peticionAlerta(
            `/${id}`,
            {
                method:
                    "DELETE"
            }
        );


        alertasState.todas =
            alertasState
                .todas
                .filter(
                    alerta =>
                        alerta.id !== id
                );


        actualizarKpisAlertas();

        filtrarAlertas();


        EduPeruUI.mostrarToast(
            "Alerta eliminada",
            "La alerta fue eliminada de SQL Server.",
            "success"
        );

    } catch (error) {

        EduPeruUI.mostrarToast(
            "No se pudo eliminar",
            error.message,
            "error"
        );

    }

}


/* =========================================================
   KPI
========================================================= */

function actualizarKpisAlertas() {

    const activas =
        alertasState
            .todas
            .filter(
                alerta =>
                    alerta.activa
            )
            .length;


    const coincidencias =
        alertasState
            .todas
            .reduce(
                (
                    total,
                    alerta
                ) =>
                    total +
                    Number(
                        alerta.coincidencias ||
                        0
                    ),
                0
            );


    colocarTextoAlerta(
        "alertsTotal",
        alertasState.todas.length
    );


    colocarTextoAlerta(
        "alertsActive",
        activas
    );


    colocarTextoAlerta(
        "heroAlertCount",
        activas
    );


    colocarTextoAlerta(
        "alertsMatches",
        coincidencias
    );

}


/* =========================================================
   EXTRAER OPORTUNIDADES
========================================================= */

function extraerOportunidadesAlerta(
    respuesta
) {

    if (!respuesta) {
        return [];
    }


    const servicio =
        respuesta.resultado ||
        respuesta.datos ||
        respuesta;


    const datos =
        servicio?.datos ??
        servicio?.resultado?.datos ??
        servicio;


    if (
        Array.isArray(
            datos
        )
    ) {

        return datos;

    }


    const candidatos = [

        datos?.data,
        datos?.rows,
        datos?.records,
        datos?.result?.records,
        datos?.result?.data

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


    if (
        datos &&
        typeof datos ===
        "object"
    ) {

        for (
            const propiedad
            of Object.keys(datos)
        ) {

            if (
                Array.isArray(
                    datos[propiedad]
                )
            ) {

                return datos[propiedad];

            }

        }

    }


    return [];

}


/* =========================================================
   ESTADOS DE PANTALLA
========================================================= */

function mostrarCargandoAlertas() {

    const contenedor =
        document.getElementById(
            "alertsGrid"
        );


    if (!contenedor) {
        return;
    }


    contenedor.innerHTML =
        `
        <div class="alerts-empty alerts-loading">

            <div class="alerts-empty-icon">
                <i data-lucide="loader-circle"></i>
            </div>

            <h4>
                Sincronizando tus alertas
            </h4>

            <p>
                Consultando AlertaService y las oportunidades disponibles...
            </p>

        </div>
        `;


    EduPeruUI.actualizarIconos();

}


function mostrarErrorAlertas(
    mensaje
) {

    const contenedor =
        document.getElementById(
            "alertsGrid"
        );


    if (!contenedor) {
        return;
    }


    contenedor.innerHTML =
        `
        <div class="alerts-empty">

            <div class="alerts-empty-icon">
                <i data-lucide="triangle-alert"></i>
            </div>

            <h4>
                No pudimos cargar tus alertas
            </h4>

            <p>
                ${EduPeruUI.escaparHTML(
                    mensaje
                )}
            </p>

        </div>
        `;


    EduPeruUI.actualizarIconos();

}


/* =========================================================
   UTILIDADES
========================================================= */

function normalizarTextoAlerta(
    texto
) {

    return String(
        texto ||
        ""
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();

}


function colocarTextoAlerta(
    id,
    valor
) {

    const elemento =
        document.getElementById(
            id
        );


    if (elemento) {

        elemento.textContent =
            valor;

    }

}


function cambiarEstadoBoton(
    boton,
    cargando,
    texto
) {

    if (!boton) {
        return;
    }


    boton.disabled =
        cargando;

    boton.textContent =
        texto;

}


function escaparAtributoAlerta(
    valor
) {

    return String(
        valor ||
        ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        );

}
