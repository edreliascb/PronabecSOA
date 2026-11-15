/* =========================================================
   EDUPERÚ
   REENVÍO DE VERIFICACIÓN - LOGIN V2
   Independiente de auth-client.js
========================================================= */

(function () {

    "use strict";

    const ENDPOINT =
        "/api/auth/email/resend-verification";

    let contenedorAccion =
        null;

    let botonReenvio =
        null;

    let mensajeReenvio =
        null;


    function obtenerAlerta() {

        return document.getElementById(
            "loginAlert"
        );

    }


    function obtenerEmail() {

        const input =
            document.getElementById(
                "email"
            ) ||
            document.querySelector(
                'input[type="email"]'
            );

        return String(
            input?.value ||
            ""
        )
            .trim()
            .toLowerCase();

    }


    function esMensajeNoVerificado(
        texto
    ) {

        const normalizado =
            String(texto || "")
                .toLowerCase();

        return (
            normalizado.includes(
                "verificar tu correo"
            ) ||
            normalizado.includes(
                "correo electrónico antes de iniciar sesión"
            ) ||
            normalizado.includes(
                "correo electronico antes de iniciar sesion"
            )
        );

    }


    function crearAccionSiHaceFalta() {

        if (
            contenedorAccion &&
            document.body.contains(
                contenedorAccion
            )
        ) {

            return;

        }


        const alerta =
            obtenerAlerta();

        if (!alerta) {

            return;

        }


        contenedorAccion =
            document.createElement(
                "div"
            );

        contenedorAccion.id =
            "verificationResendActions";

        contenedorAccion.hidden =
            true;

        contenedorAccion.style.margin =
            "12px 0 18px";


        const texto =
            document.createElement(
                "p"
            );

        texto.textContent =
            "¿No recibiste el correo de verificación?";

        texto.style.margin =
            "0 0 10px";

        texto.style.color =
            "#64748b";

        texto.style.fontSize =
            "0.92rem";


        botonReenvio =
            document.createElement(
                "button"
            );

        botonReenvio.type =
            "button";

        botonReenvio.id =
            "resendVerificationButton";

        botonReenvio.textContent =
            "Reenviar correo de verificación";

        Object.assign(
            botonReenvio.style,
            {
                width: "100%",
                border: "1px solid #bfd3f8",
                background: "#eef5ff",
                color: "#0b57d0",
                borderRadius: "10px",
                padding: "12px 16px",
                fontWeight: "700",
                cursor: "pointer"
            }
        );


        mensajeReenvio =
            document.createElement(
                "div"
            );

        mensajeReenvio.id =
            "resendVerificationMessage";

        mensajeReenvio.hidden =
            true;

        mensajeReenvio.style.marginTop =
            "10px";

        mensajeReenvio.style.fontSize =
            "0.9rem";


        contenedorAccion.append(
            texto,
            botonReenvio,
            mensajeReenvio
        );


        alerta.insertAdjacentElement(
            "afterend",
            contenedorAccion
        );


        botonReenvio.addEventListener(
            "click",
            reenviarVerificacion
        );

    }


    function actualizarVisibilidad() {

        crearAccionSiHaceFalta();

        const alerta =
            obtenerAlerta();

        if (
            !alerta ||
            !contenedorAccion
        ) {

            return;

        }


        const visible =
            !alerta.hidden &&
            esMensajeNoVerificado(
                alerta.textContent
            );


        contenedorAccion.hidden =
            !visible;


        if (!visible) {

            ocultarMensaje();

        }

    }


    function mostrarMensaje(
        texto,
        tipo = "success"
    ) {

        if (!mensajeReenvio) {

            return;

        }


        mensajeReenvio.hidden =
            false;

        mensajeReenvio.textContent =
            texto;


        mensajeReenvio.style.color =
            tipo === "error"
                ? "#b42318"
                : "#067647";

    }


    function ocultarMensaje() {

        if (!mensajeReenvio) {

            return;

        }

        mensajeReenvio.hidden =
            true;

        mensajeReenvio.textContent =
            "";

    }


    async function reenviarVerificacion() {

        const email =
            obtenerEmail();


        if (!email) {

            mostrarMensaje(
                "Ingresa primero tu correo electrónico.",
                "error"
            );

            return;

        }


        const textoOriginal =
            botonReenvio.textContent;


        botonReenvio.disabled =
            true;

        botonReenvio.textContent =
            "Enviando...";


        try {

            const response =
                await fetch(
                    ENDPOINT,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                email
                            })
                    }
                );


            let datos =
                {};


            try {

                datos =
                    await response.json();

            } catch {

                datos =
                    {};

            }


            if (!response.ok) {

                throw new Error(
                    datos?.mensaje ||
                    "No fue posible reenviar el correo de verificación."
                );

            }


            mostrarMensaje(
                datos?.mensaje ||
                "Si la cuenta está pendiente de verificación, enviaremos un nuevo enlace."
            );

        } catch (error) {

            mostrarMensaje(
                error?.message ||
                "No fue posible reenviar el correo de verificación.",
                "error"
            );

        } finally {

            botonReenvio.disabled =
                false;

            botonReenvio.textContent =
                textoOriginal;

        }

    }


    function iniciarObservacion() {

        crearAccionSiHaceFalta();

        const alerta =
            obtenerAlerta();


        if (!alerta) {

            return;

        }


        const observer =
            new MutationObserver(
                actualizarVisibilidad
            );


        observer.observe(
            alerta,
            {
                childList:
                    true,

                subtree:
                    true,

                attributes:
                    true,

                attributeFilter:
                    [
                        "hidden",
                        "class"
                    ]
            }
        );


        actualizarVisibilidad();

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciarObservacion
        );

    } else {

        iniciarObservacion();

    }

})();
