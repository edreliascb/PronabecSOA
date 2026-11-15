(() => {
    "use strict";

    const LOGIN_URL = "/pages/login.html";
    const PUBLIC_PATHS = new Set([
        "/pages/login.html",
        "/pages/registro.html",
        "/pages/recuperar-password.html",
        "/pages/restablecer-password.html",
        "/pages/verificar-email.html"
    ]);

    function normalizar(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();
    }

    function limpiarSesion() {
        ["eduperu_token", "eduperu_usuario", "token", "usuario", "user"]
            .forEach(clave => {
                localStorage.removeItem(clave);
                sessionStorage.removeItem(clave);
            });
    }

    function irLogin() {
        limpiarSesion();
        window.location.replace(LOGIN_URL);
    }

    function esControlCerrarSesion(elemento) {
        const control = elemento?.closest?.(
            "a,button,[role='button'],[data-action],[data-logout]"
        );

        if (!control) return false;

        const id = normalizar(control.id);
        const accion = normalizar(control.getAttribute("data-action"));
        const texto = normalizar(
            control.textContent ||
            control.getAttribute("aria-label") ||
            control.title
        );

        if (
            id.includes("logout") ||
            id.includes("cerrarsesion") ||
            id.includes("cerrar-sesion") ||
            accion === "logout" ||
            accion === "cerrar-sesion" ||
            control.hasAttribute("data-logout")
        ) {
            return true;
        }

        return (
            texto.includes("cerrar sesion") ||
            texto === "salir" ||
            texto.includes("finalizar sesion")
        );
    }

    document.addEventListener(
        "click",
        event => {
            if (!esControlCerrarSesion(event.target)) return;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            irLogin();
        },
        true
    );

    document.addEventListener(
        "DOMContentLoaded",
        () => {
            const path = window.location.pathname || "/";

            if (PUBLIC_PATHS.has(path)) return;

            const token = localStorage.getItem("eduperu_token");

            if (!token) {
                window.location.replace(LOGIN_URL);
            }
        }
    );
})();