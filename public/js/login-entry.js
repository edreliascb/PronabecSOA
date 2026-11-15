/* =========================================================
   EDUPERÚ - ENTRADA PRINCIPAL AL LOGIN
   Solo actúa cuando se llega desde "/" con ?entry=1
========================================================= */

(function () {
    "use strict";

    const params =
        new URLSearchParams(
            window.location.search
        );

    if (
        params.get("entry") !== "1"
    ) {
        return;
    }

    const keys = [
        "eduperu_token",
        "eduperu_usuario",
        "eduperu_refresh_token",
        "authToken",
        "token"
    ];

    for (const key of keys) {
        try {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        } catch {
            // El navegador puede restringir storage en algunos modos.
        }
    }

    try {
        history.replaceState(
            {},
            document.title,
            "/pages/login.html"
        );
    } catch {
        // No es crítico.
    }
})();
