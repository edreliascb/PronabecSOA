/* =========================================================
   EDUPERÚ - FAVORITOS
   SQL SERVER + JWT
========================================================= */

const favoritosState = {

    todos: [],

    filtrados: [],

    cargando: false

};


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        configurarEventosFavoritos();

        await cargarFavoritos();

    }
);


/* =========================================================
   EVENTOS
========================================================= */

function configurarEventosFavoritos() {

    document
        .getElementById(
            "favoritesSearch"
        )
        ?.addEventListener(
            "input",
            filtrarFavoritos
        );


    document
        .getElementById(
            "globalSearch"
        )
        ?.addEventListener(
            "input",
            event => {

                const input =
                    document.getElementById(
                        "favoritesSearch"
                    );


                if (input) {

                    input.value =
                        event.target.value;

                }


                filtrarFavoritos();

            }
        );


    document
        .getElementById(
            "favoritesOrder"
        )
        ?.addEventListener(
            "change",
            filtrarFavoritos
        );


    document
        .getElementById(
            "refreshButton"
        )
        ?.addEventListener(
            "click",
            cargarFavoritos
        );


    document
        .getElementById(
            "clearFavoritesButton"
        )
        ?.addEventListener(
            "click",
            limpiarFavoritos
        );


    document
        .getElementById(
            "favoritesGrid"
        )
        ?.addEventListener(
            "click",
            manejarAccionesFavoritos
        );

}


/* =========================================================
   TOKEN / REQUEST
========================================================= */

function obtenerTokenFavoritos() {

    return localStorage.getItem(
        "eduperu_token"
    );

}


async function solicitudFavoritos(
    endpoint,
    options = {}
) {

    const token =
        obtenerTokenFavoritos();


    if (!token) {

        const error =
            new Error(
                "Debes iniciar sesión para consultar tus favoritos."
            );

        error.status =
            401;

        throw error;

    }


    const headers = {

        ...(
            options.headers ||
            {}
        ),

        Authorization:
            `Bearer ${token}`

    };


    if (
        options.body &&
        !headers["Content-Type"]
    ) {

        headers["Content-Type"] =
            "application/json";

    }


    const respuesta =
        await fetch(
            endpoint,
            {
                ...options,
                headers
            }
        );


    let datos = {};


    try {

        datos =
            await respuesta.json();

    } catch {

        datos = {};

    }


    if (
        respuesta.status ===
        401
    ) {

        localStorage.removeItem(
            "eduperu_token"
        );

        localStorage.removeItem(
            "eduperu_usuario"
        );

    }


    if (!respuesta.ok) {

        const error =
            new Error(
                datos?.mensaje ||
                `Error HTTP ${respuesta.status}`
            );

        error.status =
            respuesta.status;

        throw error;

    }


    return datos;

}


/* =========================================================
   CARGAR DESDE SQL SERVER
========================================================= */

async function cargarFavoritos() {

    if (
        !obtenerTokenFavoritos()
    ) {

        window.location.href =
            "/pages/login.html";

        return;

    }


    favoritosState.cargando =
        true;


    mostrarCargandoFavoritos();


    try {

        const respuesta =
            await solicitudFavoritos(
                "/api/favoritos"
            );


        favoritosState.todos =
            Array.isArray(
                respuesta?.resultado
            )
                ? respuesta.resultado
                : [];


        actualizarKpisFavoritos();

        filtrarFavoritos();

    } catch (error) {

        if (
            error.status ===
            401
        ) {

            window.location.href =
                "/pages/login.html";

            return;

        }


        favoritosState.todos =
            [];

        favoritosState.filtrados =
            [];


        actualizarKpisFavoritos();

        mostrarErrorFavoritos(
            error.message ||
            "No se pudieron cargar tus favoritos."
        );


        EduPeruUI.mostrarToast(
            "Error al cargar",
            error.message,
            "error"
        );

    } finally {

        favoritosState.cargando =
            false;

    }

}


/* =========================================================
   FILTROS
========================================================= */

function filtrarFavoritos() {

    const texto =
        normalizarFavoritoTexto(
            document
                .getElementById(
                    "favoritesSearch"
                )
                ?.value
        );


    const orden =
        document
            .getElementById(
                "favoritesOrder"
            )
            ?.value ||
        "recent";


    favoritosState.filtrados =
        favoritosState
            .todos
            .filter(
                favorito => {

                    if (!texto) {

                        return true;

                    }


                    const contenido = {

                        titulo:
                            obtenerNombreFavorito(
                                favorito
                            ),

                        subtitulo:
                            favorito?.subtitulo,

                        recurso:
                            favorito?.recurso_id,

                        datos:
                            obtenerDatosFavorito(
                                favorito
                            )

                    };


                    return normalizarFavoritoTexto(
                        JSON.stringify(
                            contenido
                        )
                    )
                        .includes(
                            texto
                        );

                }
            );


    if (
        orden ===
        "az"
    ) {

        favoritosState
            .filtrados
            .sort(
                (a, b) =>
                    obtenerNombreFavorito(a)
                        .localeCompare(
                            obtenerNombreFavorito(b),
                            "es"
                        )
            );

    }


    if (
        orden ===
        "za"
    ) {

        favoritosState
            .filtrados
            .sort(
                (a, b) =>
                    obtenerNombreFavorito(b)
                        .localeCompare(
                            obtenerNombreFavorito(a),
                            "es"
                        )
            );

    }


    if (
        orden ===
        "recent"
    ) {

        favoritosState
            .filtrados
            .sort(
                (a, b) =>
                    obtenerFechaFavorito(b) -
                    obtenerFechaFavorito(a)
            );

    }


    renderizarFavoritos();

}


/* =========================================================
   RENDER
========================================================= */

function renderizarFavoritos() {

    const contenedor =
        document.getElementById(
            "favoritesGrid"
        );


    if (!contenedor) {

        return;

    }


    colocarTextoFavorito(
        "favoritesResultText",
        `${favoritosState.filtrados.length} favorito(s)`
    );


    if (
        favoritosState
            .filtrados
            .length ===
        0
    ) {

        contenedor.innerHTML =
            `

            <div class="favorites-empty">

                <div class="favorites-empty-icon">

                    <i data-lucide="heart"></i>

                </div>

                <h4>
                    Todavía no tienes favoritos
                </h4>

                <p>
                    Guarda oportunidades desde el módulo
                    Oportunidades y quedarán sincronizadas
                    con tu cuenta de EduPerú.
                </p>

                <a
                    href="/pages/oportunidades.html"
                    class="btn btn-primary"
                >
                    Buscar oportunidades
                </a>

            </div>

            `;


        EduPeruUI
            .actualizarIconos();


        return;

    }


    contenedor.innerHTML =
        favoritosState
            .filtrados
            .map(
                (
                    favorito,
                    indice
                ) => {

                    const datos =
                        obtenerDatosFavorito(
                            favorito
                        );


                    return `

                    <article class="favorite-card">

                        <div class="favorite-card-header">

                            <div class="favorite-icon">

                                <i data-lucide="heart"></i>

                            </div>


                            <button
                                type="button"
                                class="favorite-remove-button"
                                data-remove-favorite="${indice}"
                                title="Eliminar favorito"
                            >

                                <i data-lucide="trash-2"></i>

                            </button>

                        </div>


                        <h4>

                            ${EduPeruUI.escaparHTML(
                                obtenerNombreFavorito(
                                    favorito
                                )
                            )}

                        </h4>


                        <p>

                            ${EduPeruUI.escaparHTML(
                                obtenerDescripcionFavorito(
                                    favorito
                                )
                            )}

                        </p>


                        <div class="favorite-meta">

                            <span>

                                <i data-lucide="graduation-cap"></i>

                                ${EduPeruUI.escaparHTML(
                                    obtenerCarreraFavorito(
                                        datos
                                    )
                                )}

                            </span>


                            <span>

                                <i data-lucide="map-pin"></i>

                                ${EduPeruUI.escaparHTML(
                                    obtenerUbicacionFavorito(
                                        datos
                                    )
                                )}

                            </span>

                        </div>


                        <div class="favorite-footer">

                            <span class="favorite-source">

                                ${EduPeruUI.escaparHTML(
                                    obtenerFuenteFavorito(
                                        datos
                                    )
                                )}

                            </span>


                            <button
                                type="button"
                                class="favorite-detail-button"
                                data-view-favorite="${indice}"
                            >
                                Ver detalle
                            </button>

                        </div>

                    </article>

                    `;

                }
            )
            .join("");


    EduPeruUI
        .actualizarIconos();

}


/* =========================================================
   ACCIONES
========================================================= */

async function manejarAccionesFavoritos(
    event
) {

    const eliminar =
        event.target.closest(
            "[data-remove-favorite]"
        );


    if (eliminar) {

        await eliminarFavorito(
            Number(
                eliminar.dataset
                    .removeFavorite
            )
        );


        return;

    }


    const detalle =
        event.target.closest(
            "[data-view-favorite]"
        );


    if (detalle) {

        mostrarDetalleFavorito(
            Number(
                detalle.dataset
                    .viewFavorite
            )
        );

    }

}


/* =========================================================
   ELIMINAR
========================================================= */

async function eliminarFavorito(
    indiceFiltrado
) {

    const favorito =
        favoritosState
            .filtrados[
                indiceFiltrado
            ];


    if (!favorito) {

        return;

    }


    const confirmar =
        window.confirm(
            `¿Deseas eliminar "${obtenerNombreFavorito(favorito)}" de favoritos?`
        );


    if (!confirmar) {

        return;

    }


    try {

        await solicitudFavoritos(

            `/api/favoritos/${favorito.id_favorito}`,

            {
                method:
                    "DELETE"
            }

        );


        favoritosState.todos =
            favoritosState
                .todos
                .filter(
                    item =>
                        item.id_favorito !==
                        favorito.id_favorito
                );


        actualizarKpisFavoritos();

        filtrarFavoritos();


        EduPeruUI.mostrarToast(
            "Favorito eliminado",
            "La oportunidad fue retirada de tu cuenta.",
            "success"
        );

    } catch (error) {

        if (
            error.status ===
            401
        ) {

            window.location.href =
                "/pages/login.html";

            return;

        }


        EduPeruUI.mostrarToast(
            "No se pudo eliminar",
            error.message,
            "error"
        );

    }

}


/* =========================================================
   LIMPIAR TODOS
========================================================= */

async function limpiarFavoritos() {

    if (
        favoritosState
            .todos
            .length ===
        0
    ) {

        EduPeruUI.mostrarToast(
            "Sin favoritos",
            "No tienes oportunidades guardadas.",
            "warning"
        );


        return;

    }


    const confirmar =
        window.confirm(
            `¿Deseas eliminar tus ${favoritosState.todos.length} favorito(s)?`
        );


    if (!confirmar) {

        return;

    }


    const boton =
        document.getElementById(
            "clearFavoritesButton"
        );


    if (boton) {

        boton.disabled =
            true;

    }


    try {

        for (
            const favorito
            of favoritosState.todos
        ) {

            await solicitudFavoritos(

                `/api/favoritos/${favorito.id_favorito}`,

                {
                    method:
                        "DELETE"
                }

            );

        }


        favoritosState.todos =
            [];

        favoritosState.filtrados =
            [];


        actualizarKpisFavoritos();

        renderizarFavoritos();


        EduPeruUI.mostrarToast(
            "Favoritos eliminados",
            "Todos tus favoritos fueron eliminados de SQL Server.",
            "success"
        );

    } catch (error) {

        EduPeruUI.mostrarToast(
            "No se pudo completar",
            error.message,
            "error"
        );


        await cargarFavoritos();

    } finally {

        if (boton) {

            boton.disabled =
                false;

        }

    }

}


/* =========================================================
   DETALLE
========================================================= */

function mostrarDetalleFavorito(
    indice
) {

    const favorito =
        favoritosState
            .filtrados[
                indice
            ];


    if (!favorito) {

        return;

    }


    const datos =
        obtenerDatosFavorito(
            favorito
        );


    const fecha =
        formatearFechaFavorito(
            favorito.fecha_creacion
        );


    EduPeruUI.abrirModal({

        titulo:
            obtenerNombreFavorito(
                favorito
            ),

        subtitulo:
            "Oportunidad guardada en tu cuenta",

        contenido:
            `

            <div class="detail-grid">

                <div class="detail-item">

                    <span>
                        Carrera
                    </span>

                    <strong>

                        ${EduPeruUI.escaparHTML(
                            obtenerCarreraFavorito(
                                datos
                            )
                        )}

                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Ubicación
                    </span>

                    <strong>

                        ${EduPeruUI.escaparHTML(
                            obtenerUbicacionFavorito(
                                datos
                            )
                        )}

                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Estado
                    </span>

                    <strong>

                        ${EduPeruUI.escaparHTML(
                            obtenerCampoFavorito(
                                datos,
                                [
                                    "estado",
                                    "ESTADO",
                                    "estadoConvocatoria"
                                ],
                                "No especificado"
                            )
                        )}

                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Fuente
                    </span>

                    <strong>

                        ${EduPeruUI.escaparHTML(
                            obtenerFuenteFavorito(
                                datos
                            )
                        )}

                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Identificador
                    </span>

                    <strong>

                        ${EduPeruUI.escaparHTML(
                            favorito.recurso_id ||
                            "No especificado"
                        )}

                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        Guardado
                    </span>

                    <strong>

                        ${EduPeruUI.escaparHTML(
                            fecha
                        )}

                    </strong>

                </div>


                <div class="detail-item full">

                    <span>
                        Almacenamiento
                    </span>

                    <strong>
                        Favorito sincronizado con tu cuenta
                        mediante JWT y almacenado en SQL Server.
                    </strong>

                </div>

            </div>

            `

    });

}


/* =========================================================
   KPI
========================================================= */

function actualizarKpisFavoritos() {

    colocarTextoFavorito(
        "favoritesCount",
        favoritosState.todos.length
    );


    colocarTextoFavorito(
        "heroFavoritesCount",
        favoritosState.todos.length
    );


    const carreras =
        new Set();


    const ubicaciones =
        new Set();


    favoritosState.todos
        .forEach(
            favorito => {

                const datos =
                    obtenerDatosFavorito(
                        favorito
                    );


                const carrera =
                    obtenerCarreraFavorito(
                        datos
                    );


                const ubicacion =
                    obtenerUbicacionFavorito(
                        datos
                    );


                if (
                    carrera &&
                    carrera !==
                    "Carrera no especificada"
                ) {

                    carreras.add(
                        normalizarFavoritoTexto(
                            carrera
                        )
                    );

                }


                if (
                    ubicacion &&
                    ubicacion !==
                    "Ubicación no especificada"
                ) {

                    ubicaciones.add(
                        normalizarFavoritoTexto(
                            ubicacion
                        )
                    );

                }

            }
        );


    colocarTextoFavorito(
        "favoritesCareers",
        carreras.size
    );


    colocarTextoFavorito(
        "favoritesLocations",
        ubicaciones.size
    );

}


/* =========================================================
   DATOS
========================================================= */

function obtenerDatosFavorito(
    favorito
) {

    if (
        favorito &&
        typeof favorito ===
        "object"
    ) {

        return (
            favorito.datos ||
            favorito.data ||
            favorito.registro ||
            favorito.oportunidad ||
            {}
        );

    }


    return {};

}


/* =========================================================
   CAMPOS
========================================================= */

function obtenerNombreFavorito(
    favorito
) {

    if (
        favorito?.titulo &&
        String(
            favorito.titulo
        ).trim()
    ) {

        return String(
            favorito.titulo
        ).trim();

    }


    const datos =
        obtenerDatosFavorito(
            favorito
        );


    return obtenerCampoFavorito(

        datos,

        [
            "convocatoria",
            "CONVOCATORIA",
            "nombreConvocatoria",
            "NOMBRE_CONVOCATORIA",
            "nombre",
            "NOMBRE",
            "beca",
            "BECA",
            "titulo",
            "TITULO"
        ],

        "Oportunidad educativa"

    );

}


function obtenerCarreraFavorito(
    datos
) {

    return obtenerCampoFavorito(

        datos,

        [
            "carrera",
            "CARRERA",
            "nombreCarrera",
            "NOMBRE_CARRERA",
            "programa",
            "PROGRAMA"
        ],

        "Carrera no especificada"

    );

}


function obtenerUbicacionFavorito(
    datos
) {

    return obtenerCampoFavorito(

        datos,

        [
            "region",
            "REGION",
            "departamento",
            "DEPARTAMENTO",
            "ubicacion",
            "UBICACION",
            "sede",
            "SEDE"
        ],

        "Ubicación no especificada"

    );

}


function obtenerFuenteFavorito(
    datos
) {

    return obtenerCampoFavorito(

        datos,

        [
            "fuente",
            "FUENTE",
            "origen",
            "ORIGEN"
        ],

        "EduPerú"

    );

}


function obtenerDescripcionFavorito(
    favorito
) {

    const subtitulo =
        String(
            favorito?.subtitulo ||
            ""
        )
            .trim();


    if (subtitulo) {

        return subtitulo;

    }


    const datos =
        obtenerDatosFavorito(
            favorito
        );


    return obtenerCampoFavorito(

        datos,

        [
            "descripcion",
            "DESCRIPCION",
            "detalle",
            "DETALLE",
            "tipo",
            "TIPO"
        ],

        "Oportunidad educativa guardada en EduPerú."

    );

}


function obtenerCampoFavorito(
    objeto,
    campos,
    defecto
) {

    for (
        const campo
        of campos
    ) {

        const valor =
            objeto?.[campo];


        if (
            valor !== undefined &&
            valor !== null &&
            String(
                valor
            )
                .trim()
        ) {

            return String(
                valor
            )
                .trim();

        }

    }


    return defecto;

}


/* =========================================================
   FECHA
========================================================= */

function obtenerFechaFavorito(
    favorito
) {

    const fecha =
        new Date(
            favorito?.fecha_creacion ||
            0
        );


    const tiempo =
        fecha.getTime();


    return Number.isFinite(
        tiempo
    )
        ? tiempo
        : 0;

}


function formatearFechaFavorito(
    valor
) {

    if (!valor) {

        return "No especificado";

    }


    const fecha =
        new Date(
            valor
        );


    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return "No especificado";

    }


    return fecha.toLocaleString(
        "es-PE",
        {
            dateStyle:
                "medium",

            timeStyle:
                "short"
        }
    );

}


/* =========================================================
   ESTADOS DE PANTALLA
========================================================= */

function mostrarCargandoFavoritos() {

    const contenedor =
        document.getElementById(
            "favoritesGrid"
        );


    if (!contenedor) {

        return;

    }


    contenedor.innerHTML =
        `

        <div class="favorites-empty">

            <div class="favorites-empty-icon">

                <i data-lucide="loader-circle"></i>

            </div>

            <h4>
                Cargando favoritos
            </h4>

            <p>
                Consultando tus oportunidades guardadas
                en SQL Server...
            </p>

        </div>

        `;


    EduPeruUI
        ?.actualizarIconos();

}


function mostrarErrorFavoritos(
    mensaje
) {

    const contenedor =
        document.getElementById(
            "favoritesGrid"
        );


    if (!contenedor) {

        return;

    }


    contenedor.innerHTML =
        `

        <div class="favorites-empty">

            <div class="favorites-empty-icon">

                <i data-lucide="triangle-alert"></i>

            </div>

            <h4>
                No se pudieron cargar los favoritos
            </h4>

            <p>
                ${EduPeruUI.escaparHTML(
                    mensaje
                )}
            </p>

            <button
                type="button"
                class="btn btn-primary"
                onclick="cargarFavoritos()"
            >
                Intentar nuevamente
            </button>

        </div>

        `;


    EduPeruUI
        .actualizarIconos();

}


/* =========================================================
   UTILIDADES
========================================================= */

function normalizarFavoritoTexto(
    texto
) {

    return String(
        texto ||
        ""
    )
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();

}


function colocarTextoFavorito(
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
