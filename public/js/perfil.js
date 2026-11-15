/* =========================================================
   EDUPERÚ
   MI PERFIL
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        actualizarIconos();

        configurarEventos();

        await iniciarPerfil();

    }
);


/* =========================================================
   INICIO
========================================================= */

async function iniciarPerfil() {

    if (
        !EduPeruAuth.estaAutenticado()
    ) {

        window.location.href =
            "/pages/login.html";

        return;

    }


    try {

        await cargarPerfil();

    } catch (error) {

        if (
            error.status === 401
        ) {

            EduPeruAuth.cerrarSesion();

            window.location.href =
                "/pages/login.html";

            return;

        }


        mostrarAlerta(
            error.message ||
            "No se pudo cargar el perfil.",
            "error"
        );

    }

}


/* =========================================================
   CARGAR PERFIL
========================================================= */

async function cargarPerfil() {

    const respuesta =
        await EduPeruAuth.request(
            "/api/perfil"
        );


    const perfil =
        respuesta.resultado;


    if (!perfil) {

        throw new Error(
            "No se encontró información del perfil."
        );

    }


    mostrarIdentidad(
        perfil
    );


    document
        .getElementById("nombres")
        .value =
            perfil.nombres || "";


    document
        .getElementById("apellidos")
        .value =
            perfil.apellidos || "";


    document
        .getElementById("email")
        .value =
            perfil.email || "";


    document
        .getElementById("departamento")
        .value =
            perfil.departamento || "";


    document
        .getElementById("provincia")
        .value =
            perfil.provincia || "";


    document
        .getElementById("distrito")
        .value =
            perfil.distrito || "";


    document
        .getElementById("carrera_interes")
        .value =
            perfil.carrera_interes || "";


    document
        .getElementById("nivel_estudio")
        .value =
            perfil.nivel_estudio || "";


    document
        .getElementById("institucion")
        .value =
            perfil.institucion || "";


    actualizarResumenEducativo(perfil);

}


/* =========================================================
   IDENTIDAD
========================================================= */

function mostrarIdentidad(
    perfil
) {

    const nombre =
        `${perfil.nombres || ""} ${perfil.apellidos || ""}`
            .trim();


    document
        .getElementById(
            "profileName"
        )
        .textContent =
            nombre ||
            "Usuario EduPerú";


    document
        .getElementById(
            "profileEmail"
        )
        .textContent =
            perfil.email ||
            "";


    document
        .getElementById(
            "profileRole"
        )
        .textContent =
            perfil.rol ||
            "USUARIO";


    document
        .getElementById(
            "profileAvatar"
        )
        .textContent =
            obtenerIniciales(
                perfil
            );

}


/* =========================================================
   GUARDAR
========================================================= */

async function guardarPerfil(
    event
) {

    event.preventDefault();


    const datos = {

        departamento:
            obtenerValor(
                "departamento"
            ),

        provincia:
            obtenerValor(
                "provincia"
            ),

        distrito:
            obtenerValor(
                "distrito"
            ),

        carrera_interes:
            obtenerValor(
                "carrera_interes"
            ),

        nivel_estudio:
            obtenerValor(
                "nivel_estudio"
            ),

        institucion:
            obtenerValor(
                "institucion"
            )

    };


    activarLoading(
        true
    );


    try {

        await EduPeruAuth.request(

            "/api/perfil",

            {

                method:
                    "PUT",

                body:
                    JSON.stringify(
                        datos
                    )

            }

        );


        mostrarAlerta(
            "Perfil actualizado correctamente.",
            "success"
        );


        await cargarPerfil();

    } catch (error) {

        mostrarAlerta(
            error.message ||
            "No se pudo guardar el perfil.",
            "error"
        );

    } finally {

        activarLoading(
            false
        );

    }

}


/* =========================================================
   RESUMEN / COMPLETITUD DEL PERFIL
========================================================= */

function actualizarResumenEducativo(perfil) {

    const campos = [
        perfil.departamento,
        perfil.provincia,
        perfil.distrito,
        perfil.carrera_interes,
        perfil.nivel_estudio,
        perfil.institucion
    ];

    const completos = campos.filter(valor => String(valor || "").trim()).length;
    const porcentaje = Math.round((completos / campos.length) * 100);

    const porcentajeEl = document.getElementById("profileCompletion");
    const barraEl = document.getElementById("profileCompletionBar");
    const textoEl = document.getElementById("profileCompletionText");
    const regionEl = document.getElementById("summaryRegion");
    const carreraEl = document.getElementById("summaryCareer");

    if (porcentajeEl) porcentajeEl.textContent = `${porcentaje}%`;
    if (barraEl) barraEl.style.width = `${porcentaje}%`;

    if (textoEl) {
        textoEl.textContent = porcentaje === 100
            ? "Perfil completo. EduPerú puede personalizar mejor tus resultados."
            : `Tienes ${completos} de ${campos.length} datos educativos completados.`;
    }

    if (regionEl) {
        regionEl.textContent = [perfil.departamento, perfil.provincia]
            .filter(Boolean)
            .join(" · ") || "Sin registrar";
    }

    if (carreraEl) {
        carreraEl.textContent = perfil.carrera_interes || "Sin registrar";
    }
}


/* =========================================================
   EVENTOS
========================================================= */

function configurarEventos() {

    document
        .getElementById(
            "profileForm"
        )
        ?.addEventListener(
            "submit",
            guardarPerfil
        );


    document
        .getElementById(
            "logoutButton"
        )
        ?.addEventListener(
            "click",
            () => {

                EduPeruAuth
                    .cerrarSesion();


                window.location.href =
                    "/pages/login.html";

            }
        );

}


/* =========================================================
   UTILIDADES
========================================================= */

function obtenerValor(
    id
) {

    return document
        .getElementById(id)
        ?.value
        ?.trim() ||
        "";

}


function obtenerIniciales(
    usuario
) {

    const primera =
        String(
            usuario.nombres ||
            ""
        )
            .trim()
            .charAt(0);


    const segunda =
        String(
            usuario.apellidos ||
            ""
        )
            .trim()
            .charAt(0);


    return (
        `${primera}${segunda}`
            .toUpperCase() ||
        "EP"
    );

}


/* =========================================================
   ALERTAS
========================================================= */

function mostrarAlerta(
    mensaje,
    tipo
) {

    const alerta =
        document.getElementById(
            "profileAlert"
        );


    alerta.hidden =
        false;


    alerta.className =
        `profile-alert ${tipo}`;


    alerta.textContent =
        mensaje;


    window.scrollTo({
        top:
            0,

        behavior:
            "smooth"
    });

}


/* =========================================================
   LOADING
========================================================= */

function activarLoading(
    estado
) {

    const boton =
        document.getElementById(
            "saveButton"
        );


    const texto =
        document.getElementById(
            "saveButtonText"
        );


    boton.disabled =
        estado;


    texto.textContent =
        estado
            ? "Guardando..."
            : "Guardar cambios";

}


/* =========================================================
   ICONOS
========================================================= */

function actualizarIconos() {

    if (
        window.lucide
    ) {

        lucide.createIcons();

    }

}