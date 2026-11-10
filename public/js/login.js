/* =========================================================
   EDUPERÚ
   LOGIN
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (
            window.lucide
        ) {

            lucide.createIcons();

        }


        configurarLogin();

        configurarPasswordLogin();

        comprobarSesionExistente();

    }
);


/* =========================================================
   SESIÓN EXISTENTE
========================================================= */

async function comprobarSesionExistente() {

    if (
        !EduPeruAuth
            .estaAutenticado()
    ) {

        return;

    }


    try {

        await EduPeruAuth
            .obtenerUsuarioActual();


        window.location.href =
            "/";

    } catch {

        EduPeruAuth
            .cerrarSesion();

    }

}


/* =========================================================
   FORMULARIO
========================================================= */

function configurarLogin() {

    const formulario =
        document.getElementById(
            "loginForm"
        );


    formulario
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const email =
                    document
                        .getElementById(
                            "email"
                        )
                        .value
                        .trim();


                const password =
                    document
                        .getElementById(
                            "password"
                        )
                        .value;


                if (
                    !email ||
                    !password
                ) {

                    mostrarAlertaLogin(
                        "Completa tu correo y contraseña.",
                        "error"
                    );

                    return;

                }


                setLoadingLogin(
                    true
                );


                try {

                    const respuesta =
                        await EduPeruAuth
                            .login(
                                email,
                                password
                            );


                    EduPeruAuth
                        .guardarSesion(
                            respuesta.resultado
                        );


                    mostrarAlertaLogin(
                        "Sesión iniciada correctamente.",
                        "success"
                    );


                    setTimeout(
                        () => {

                            const usuario =
                                respuesta
                                    ?.resultado
                                    ?.usuario;


                            if (
                                usuario?.rol ===
                                "ADMINISTRADOR"
                            ) {

                                window.location.href =
                                    "/pages/admin.html";

                            } else {

                                window.location.href =
                                    "/";

                            }

                        },
                        600
                    );

                } catch (error) {

                    mostrarAlertaLogin(
                        error.message,
                        "error"
                    );

                } finally {

                    setLoadingLogin(
                        false
                    );

                }

            }
        );

}


/* =========================================================
   MOSTRAR PASSWORD
========================================================= */

function configurarPasswordLogin() {

    const boton =
        document.getElementById(
            "togglePassword"
        );


    const input =
        document.getElementById(
            "password"
        );


    boton
        ?.addEventListener(
            "click",
            () => {

                const visible =
                    input.type ===
                    "text";


                input.type =
                    visible
                        ? "password"
                        : "text";


                boton.innerHTML =
                    visible
                        ? '<i data-lucide="eye"></i>'
                        : '<i data-lucide="eye-off"></i>';


                if (
                    window.lucide
                ) {

                    lucide.createIcons();

                }

            }
        );

}


/* =========================================================
   ALERTA
========================================================= */

function mostrarAlertaLogin(
    mensaje,
    tipo
) {

    const alerta =
        document.getElementById(
            "loginAlert"
        );


    alerta.hidden =
        false;


    alerta.className =
        `auth-alert ${tipo}`;


    alerta.textContent =
        mensaje;

}


/* =========================================================
   LOADING
========================================================= */

function setLoadingLogin(
    loading
) {

    const boton =
        document.getElementById(
            "loginButton"
        );


    const texto =
        document.getElementById(
            "loginButtonText"
        );


    boton.disabled =
        loading;


    texto.textContent =
        loading
            ? "Ingresando..."
            : "Iniciar sesión";

}