/* =========================================================
   EDUPERÚ
   REGISTRO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (
            window.lucide
        ) {

            lucide.createIcons();

        }


        configurarRegistro();

        configurarPasswordRegistro();

    }
);


/* =========================================================
   FORMULARIO
========================================================= */

function configurarRegistro() {

    const formulario =
        document.getElementById(
            "registerForm"
        );


    formulario
        ?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const nombres =
                    document
                        .getElementById(
                            "nombres"
                        )
                        .value
                        .trim();


                const apellidos =
                    document
                        .getElementById(
                            "apellidos"
                        )
                        .value
                        .trim();


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


                const confirmPassword =
                    document
                        .getElementById(
                            "confirmPassword"
                        )
                        .value;


                if (
                    password !==
                    confirmPassword
                ) {

                    mostrarAlertaRegistro(
                        "Las contraseñas no coinciden.",
                        "error"
                    );

                    return;

                }


                if (
                    password.length <
                    8
                ) {

                    mostrarAlertaRegistro(
                        "La contraseña debe tener al menos 8 caracteres.",
                        "error"
                    );

                    return;

                }


                setLoadingRegistro(
                    true
                );


                try {

                    const respuesta =
                        await EduPeruAuth
                            .registrar({

                                nombres,

                                apellidos,

                                email,

                                password

                            });


                    EduPeruAuth
                        .guardarSesion(
                            respuesta.resultado
                        );


                    mostrarAlertaRegistro(
                        "Cuenta creada correctamente.",
                        "success"
                    );


                    setTimeout(
                        () => {

                            window.location.href =
                                "/";

                        },
                        700
                    );

                } catch (error) {

                    mostrarAlertaRegistro(
                        error.message,
                        "error"
                    );

                } finally {

                    setLoadingRegistro(
                        false
                    );

                }

            }
        );

}


/* =========================================================
   PASSWORD
========================================================= */

function configurarPasswordRegistro() {

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

function mostrarAlertaRegistro(
    mensaje,
    tipo
) {

    const alerta =
        document.getElementById(
            "registerAlert"
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

function setLoadingRegistro(
    loading
) {

    const boton =
        document.getElementById(
            "registerButton"
        );


    const texto =
        document.getElementById(
            "registerButtonText"
        );


    boton.disabled =
        loading;


    texto.textContent =
        loading
            ? "Creando cuenta..."
            : "Crear mi cuenta";

}