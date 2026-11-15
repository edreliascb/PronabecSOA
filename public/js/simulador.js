(function () {
    "use strict";

    const form = document.getElementById("simulatorForm");
    const simulateBtn = document.getElementById("simulateBtn");
    const loadProfileBtn = document.getElementById("loadProfileBtn");
    const resultsSection = document.getElementById("resultsSection");
    const summaryGrid = document.getElementById("summaryGrid");
    const resultsList = document.getElementById("resultsList");
    const resultSummaryText = document.getElementById("resultSummaryText");
    const sourceBox = document.getElementById("sourceBox");
    const officialWarningText = document.getElementById("officialWarningText");
    const errorCard = document.getElementById("errorCard");
    const errorMessage = document.getElementById("errorMessage");
    const loginRequired = document.getElementById("loginRequired");
    const simulatorArea = document.getElementById("simulatorArea");
    const sessionBadge = document.getElementById("sessionBadge");
    const actionStatus = document.getElementById("simulatorActionStatus");

    function actualizarEstadoAccion(texto, tipo = "info") {
        if (!actionStatus) return;
        actionStatus.textContent = texto || "";
        actionStatus.dataset.tipo = tipo;
        actionStatus.classList.toggle("hidden", !texto);
    }

    function extraerTokenDeObjeto(objeto, profundidad = 0) {
        if (!objeto || profundidad > 5) return null;

        if (typeof objeto === "string") {
            const valor = objeto.trim();
            if (valor.split(".").length === 3 && valor.length > 50) {
                return valor;
            }
            try {
                return extraerTokenDeObjeto(JSON.parse(valor), profundidad + 1);
            } catch {
                return null;
            }
        }

        if (typeof objeto !== "object") return null;

        const clavesPreferidas = [
            "token",
            "accessToken",
            "access_token",
            "jwt",
            "bearerToken"
        ];

        for (const clave of clavesPreferidas) {
            if (objeto[clave]) {
                const token = extraerTokenDeObjeto(objeto[clave], profundidad + 1);
                if (token) return token;
            }
        }

        for (const valor of Object.values(objeto)) {
            const token = extraerTokenDeObjeto(valor, profundidad + 1);
            if (token) return token;
        }

        return null;
    }

    function buscarToken() {
        const candidatosGlobales = [
            window.EduPeruAuth,
            window.AuthClient,
            window.authClient
        ];

        for (const cliente of candidatosGlobales) {
            if (!cliente) continue;

            const metodos = ["obtenerToken", "getToken"];

            for (const metodo of metodos) {
                if (typeof cliente[metodo] !== "function") continue;

                try {
                    const token = cliente[metodo]();
                    if (token) return token;
                } catch {
                    // Continuar con almacenamiento local.
                }
            }
        }

        const storages = [window.localStorage, window.sessionStorage];
        const claves = [
            "eduperu_token",
            "eduperuToken",
            "token",
            "jwt",
            "authToken",
            "accessToken",
            "access_token",
            "eduperu_auth",
            "eduperu_session",
            "session"
        ];

        for (const storage of storages) {
            for (const clave of claves) {
                const valor = storage.getItem(clave);
                const token = extraerTokenDeObjeto(valor);
                if (token) return token;
            }

            for (let indice = 0; indice < storage.length; indice += 1) {
                const clave = storage.key(indice);
                const valor = clave ? storage.getItem(clave) : null;
                const token = extraerTokenDeObjeto(valor);
                if (token) return token;
            }
        }

        return null;
    }

    async function api(endpoint, options = {}) {
        const token = buscarToken();

        if (!token) {
            const error = new Error("Necesitas iniciar sesión para usar el simulador.");
            error.status = 401;
            throw error;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000);

        try {
            const respuesta = await fetch(endpoint, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    ...(options.headers || {})
                },
                signal: controller.signal
            });

            let data = null;
            try {
                data = await respuesta.json();
            } catch {
                data = null;
            }

            if (!respuesta.ok) {
                const error = new Error(
                    data?.mensaje || `Error HTTP ${respuesta.status}`
                );
                error.status = respuesta.status;
                throw error;
            }

            return data;
        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error("La consulta tardó demasiado. Revisa la disponibilidad de las fuentes oficiales.");
            }
            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }

    function mostrarSesion() {
        const token = buscarToken();

        if (!token) {
            sessionBadge.textContent = "Sesión requerida";
            sessionBadge.classList.remove("session-ok");
            loginRequired.classList.remove("hidden");
            simulatorArea.classList.add("hidden");
            sessionStorage.setItem("eduperu_redirect_after_login", location.pathname);
            return false;
        }

        sessionBadge.textContent = "Sesión activa";
        sessionBadge.classList.add("session-ok");
        loginRequired.classList.add("hidden");
        simulatorArea.classList.remove("hidden");
        return true;
    }

    function completarCampo(nombre, valor) {
        if (valor === null || valor === undefined || valor === "") return;
        const campo = form.elements.namedItem(nombre);
        if (campo) campo.value = valor;
    }

    async function cargarPerfil() {
        if (!mostrarSesion()) return;

        loadProfileBtn.disabled = true;
        const original = loadProfileBtn.innerHTML;
        loadProfileBtn.textContent = "Cargando...";

        try {
            const respuesta = await api("/api/auth/me");
            const usuario = respuesta?.resultado || {};
            const perfil = usuario.perfil || usuario;

            completarCampo("departamento", perfil.departamento);
            completarCampo("provincia", perfil.provincia);
            completarCampo("distrito", perfil.distrito);
            completarCampo("carrera_interes", perfil.carrera_interes);
            completarCampo("nivel_estudio", perfil.nivel_estudio);
            completarCampo("institucion", perfil.institucion);
        } catch (error) {
            mostrarError(error.message);
        } finally {
            loadProfileBtn.disabled = false;
            loadProfileBtn.innerHTML = original;
            refrescarIconos();
        }
    }

    function obtenerDatosFormulario() {
        const datos = Object.fromEntries(new FormData(form).entries());

        Object.keys(datos).forEach(clave => {
            if (typeof datos[clave] === "string") {
                datos[clave] = datos[clave].trim();
            }
        });

        return datos;
    }

    function escaparHTML(valor) {
        return String(valor ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function estadoVisual(estado) {
        const mapa = {
            CUMPLE_PREEVALUACION: ["Cumple preevaluación", "status-good"],
            REQUIERE_VALIDACION: ["Requiere validación", "status-review"],
            NO_DETERMINABLE: ["No determinable", "status-neutral"],
            NO_CUMPLE_PREEVALUACION: ["No cumple preevaluación", "status-bad"]
        };
        return mapa[estado] || [estado || "Sin estado", "status-neutral"];
    }

    function renderResumen(resumen = {}) {
        const tarjetas = [
            [resumen.cumplePreevaluacion ?? 0, "Cumple preevaluación"],
            [resumen.requiereValidacion ?? 0, "Requiere validación"],
            [resumen.noDeterminable ?? 0, "No determinable"],
            [resumen.noCumplePreevaluacion ?? 0, "No cumple preevaluación"]
        ];

        summaryGrid.innerHTML = tarjetas
            .map(([valor, etiqueta]) => `
                <div class="summary-card">
                    <strong>${escaparHTML(valor)}</strong>
                    <span>${escaparHTML(etiqueta)}</span>
                </div>
            `)
            .join("");
    }

    function renderReglas(reglas = []) {
        if (!reglas.length) {
            return "<p>Este requisito necesita revisión manual; no contiene campos estructurados evaluables.</p>";
        }

        return `
            <ul class="rule-list">
                ${reglas.map(regla => `
                    <li>
                        <strong>${escaparHTML(regla.campo)}:</strong>
                        ${escaparHTML(regla.valorUsuario ?? "sin dato")}
                        → requerido: ${escaparHTML(regla.requerido)}
                        (${escaparHTML(regla.estado)})
                    </li>
                `).join("")}
            </ul>
        `;
    }

    function renderResultados(oportunidades = []) {
        if (!oportunidades.length) {
            resultsList.innerHTML = `
                <div class="empty-state">
                    No se encontraron becas oficiales que coincidan con el filtro actual.
                </div>
            `;
            return;
        }

        resultsList.innerHTML = oportunidades.map((item, indice) => {
            const [etiqueta, clase] = estadoVisual(item.estado);
            const resumen = item.resumen || {};
            const puntaje = item.puntajeOrientativo;
            const evaluaciones = item.evaluaciones || [];

            return `
                <article class="result-card" data-result-index="${indice}">
                    <div class="result-main">
                        <div>
                            <h3>${escaparHTML(item.nombre)}</h3>
                            <span class="status-pill ${clase}">${escaparHTML(etiqueta)}</span>
                            <div class="result-meta">
                                <span class="meta-chip">${escaparHTML(resumen.requisitos ?? 0)} requisitos vinculados</span>
                                <span class="meta-chip">${escaparHTML(resumen.reglasAutomatizadas ?? 0)} reglas automatizadas</span>
                                <span class="meta-chip">${escaparHTML(resumen.requisitosManuales ?? 0)} revisiones manuales</span>
                            </div>
                            ${item.mensaje ? `<p>${escaparHTML(item.mensaje)}</p>` : ""}
                            <button class="detail-toggle" type="button">Ver detalle de evaluación</button>
                        </div>
                        <div class="result-score">
                            <strong>${puntaje === null || puntaje === undefined ? "N/D" : `${escaparHTML(puntaje)}%`}</strong>
                            <span>orientativo sobre reglas automatizadas</span>
                        </div>
                    </div>
                    <div class="result-details">
                        <div class="requirement-list">
                            ${evaluaciones.length ? evaluaciones.map(ev => `
                                <div class="requirement-item">
                                    <strong>${escaparHTML(ev.requisito)} · ${escaparHTML(ev.estado)}</strong>
                                    ${ev.descripcion ? `<p>${escaparHTML(ev.descripcion)}</p>` : ""}
                                    ${renderReglas(ev.reglas || [])}
                                </div>
                            `).join("") : `
                                <div class="requirement-item">
                                    <strong>Sin requisitos estructurados vinculados</strong>
                                    <p>La fuente oficial disponible no permite automatizar esta preevaluación.</p>
                                </div>
                            `}
                        </div>
                    </div>
                </article>
            `;
        }).join("");

        resultsList.querySelectorAll(".detail-toggle").forEach(boton => {
            boton.addEventListener("click", () => {
                const tarjeta = boton.closest(".result-card");
                tarjeta.classList.toggle("open");
                boton.textContent = tarjeta.classList.contains("open")
                    ? "Ocultar detalle"
                    : "Ver detalle de evaluación";
            });
        });
    }

    function mostrarError(mensaje) {
        errorMessage.textContent = mensaje || "Ocurrió un error inesperado.";
        errorCard.classList.remove("hidden");
        refrescarIconos();
    }

    function ocultarError() {
        errorCard.classList.add("hidden");
        errorMessage.textContent = "";
    }

    function refrescarIconos() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    let simulacionEnCurso = false;

    async function ejecutarSimulacion(evento) {
        evento?.preventDefault?.();

        if (simulacionEnCurso) return;

        ocultarError();
        actualizarEstadoAccion("Validando sesión...", "info");

        if (!mostrarSesion()) {
            actualizarEstadoAccion("Necesitas iniciar sesión para analizar oportunidades.", "error");
            return;
        }

        simulacionEnCurso = true;
        simulateBtn.disabled = true;
        const original = simulateBtn.innerHTML;
        simulateBtn.textContent = "Analizando fuentes oficiales...";
        actualizarEstadoAccion("Conectando con EvaluacionElegibilidadService...", "info");

        try {
            console.log("[SIMULADOR] Enviando datos", obtenerDatosFormulario());

            const respuesta = await api("/api/elegibilidad/simular", {
                method: "POST",
                body: JSON.stringify(obtenerDatosFormulario())
            });

            const resultado = respuesta?.resultado || {};

            console.log("[SIMULADOR] Respuesta recibida", respuesta);
            actualizarEstadoAccion(
                `Resultado recibido: ${resultado.total ?? 0} oportunidad(es) analizada(s).`,
                "ok"
            );

            renderResumen(resultado.resumen || {});
            renderResultados(resultado.oportunidades || []);

            resultSummaryText.textContent =
                resultado.total === 1
                    ? "Se analizó 1 oportunidad oficial."
                    : `Se analizaron ${resultado.total ?? 0} oportunidades oficiales.`;

            sourceBox.innerHTML = `
                <strong>Fuentes utilizadas</strong><br>
                Oportunidades: ${escaparHTML(resultado.fuentes?.oportunidades || resultado.fuente || "Fuente oficial")}<br>
                Requisitos: ${escaparHTML(resultado.fuentes?.requisitos || "Fuente oficial")}<br>
                Reglas estructuradas: ${escaparHTML(resultado.fuentes?.requisitosEstructurados ?? 0)}
            `;

            officialWarningText.textContent =
                resultado.advertencia ||
                "Esta herramienta es informativa y no representa una decisión oficial de PRONABEC.";

            resultsSection.classList.remove("hidden");
            resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (error) {
            console.error("[SIMULADOR] Error", error);

            if (error.status === 401) {
                mostrarSesion();
            }

            actualizarEstadoAccion(
                `Error: ${error.message || "No se pudo completar el análisis."}`,
                "error"
            );
            mostrarError(error.message);
            errorCard.scrollIntoView({ behavior: "smooth", block: "center" });
        } finally {
            simulacionEnCurso = false;
            simulateBtn.disabled = false;
            simulateBtn.innerHTML = original;
            refrescarIconos();
        }
    }

    function configurarSidebar() {
        const menuButton = document.getElementById("menuButton");
        const sidebar = document.getElementById("sidebar");
        const overlay = document.getElementById("sidebarOverlay");

        if (!menuButton || !sidebar || !overlay) return;

        menuButton.addEventListener("click", () => {
            sidebar.classList.toggle("open");
            overlay.classList.toggle("active");
        });

        overlay.addEventListener("click", () => {
            sidebar.classList.remove("open");
            overlay.classList.remove("active");
        });
    }

    document.addEventListener("DOMContentLoaded", async () => {
        configurarSidebar();
        const activa = mostrarSesion();

        form.addEventListener("submit", ejecutarSimulacion);
        simulateBtn.addEventListener("click", ejecutarSimulacion);
        loadProfileBtn.addEventListener("click", cargarPerfil);

        actualizarEstadoAccion("Simulador listo para analizar.", "ok");

        if (activa) {
            await cargarPerfil();
        }

        refrescarIconos();
    });
})();
