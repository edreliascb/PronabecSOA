/* =========================================================
   EDUPERÚ - FAVORITOS
========================================================= */

const FAVORITOS_STORAGE_KEY =
    "eduperu_favoritos";


const favoritosState = {

    todos: [],

    filtrados: []

};


document.addEventListener(
    "DOMContentLoaded",
    () => {

        configurarEventosFavoritos();

        cargarFavoritos();

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
   CARGAR LOCALSTORAGE
========================================================= */

function cargarFavoritos() {

    try {

        const almacenados =
            JSON.parse(
                localStorage.getItem(
                    FAVORITOS_STORAGE_KEY
                ) ||
                "[]"
            );


        favoritosState.todos =
            Array.isArray(
                almacenados
            )
                ? almacenados
                : [];


    } catch (error) {

        console.error(
            "Error leyendo favoritos:",
            error
        );


        favoritosState.todos =
            [];

    }


    favoritosState.filtrados = [

        ...favoritosState.todos

    ];


    actualizarKpisFavoritos();

    filtrarFavoritos();

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


                    return normalizarFavoritoTexto(
                        JSON.stringify(
                            obtenerDatosFavorito(
                                favorito
                            )
                        )
                    )
                    .includes(
                        texto
                    );

                }
            );


    if (
        orden === "az"
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
        orden === "za"
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
        orden === "recent"
    ) {

        favoritosState
            .filtrados
            .reverse();

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


    colocarTextoFavorito(
        "favoritesResultText",
        `${favoritosState.filtrados.length} favorito(s)`
    );


    if (
        favoritosState
            .filtrados
            .length === 0
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
                    Oportunidades y aparecerán aquí.
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
                (favorito, indice) => {

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
                                    datos
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

function manejarAccionesFavoritos(
    event
) {

    const eliminar =
        event.target.closest(
            "[data-remove-favorite]"
        );


    if (eliminar) {

        eliminarFavorito(
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

function eliminarFavorito(
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


    const indiceReal =
        favoritosState
            .todos
            .indexOf(
                favorito
            );


    if (
        indiceReal >= 0
    ) {

        favoritosState
            .todos
            .splice(
                indiceReal,
                1
            );

    }


    guardarFavoritos();


    actualizarKpisFavoritos();

    filtrarFavoritos();


    EduPeruUI.mostrarToast(
        "Favorito eliminado",
        "La oportunidad fue retirada de tus favoritos.",
        "success"
    );

}


/* =========================================================
   LIMPIAR TODOS
========================================================= */

function limpiarFavoritos() {

    if (
        favoritosState
            .todos
            .length === 0
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
            "¿Deseas eliminar todos tus favoritos?"
        );


    if (!confirmar) {
        return;
    }


    favoritosState.todos =
        [];


    favoritosState.filtrados =
        [];


    guardarFavoritos();

    actualizarKpisFavoritos();

    renderizarFavoritos();


    EduPeruUI.mostrarToast(
        "Favoritos eliminados",
        "La lista quedó vacía.",
        "success"
    );

}


/* =========================================================
   GUARDAR
========================================================= */

function guardarFavoritos() {

    localStorage.setItem(

        FAVORITOS_STORAGE_KEY,

        JSON.stringify(
            favoritosState.todos
        )

    );

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


    EduPeruUI.abrirModal({

        titulo:
            obtenerNombreFavorito(
                favorito
            ),

        subtitulo:
            "Oportunidad guardada",

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


                <div class="detail-item full">

                    <span>
                        Información guardada
                    </span>

                    <strong>
                        Esta oportunidad fue almacenada
                        localmente en el navegador.
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
   COMPATIBILIDAD CON FORMATO GUARDADO
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
            favorito
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
    datos
) {

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
            String(valor).trim()
        ) {

            return String(
                valor
            ).trim();

        }

    }


    return defecto;

}


/* =========================================================
   UTILIDADES
========================================================= */

function normalizarFavoritoTexto(
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