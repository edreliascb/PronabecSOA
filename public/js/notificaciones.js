const NOTIFICATIONS_API = "/api/notificaciones";
const TOKEN_KEY = "eduperu_token";

const notificationState = { items: [], summary: {}, filter: "TODAS", loading: false };

function getToken() {
    try {
        if (window.EduPeruAuth && typeof window.EduPeruAuth.obtenerToken === "function") {
            const token = window.EduPeruAuth.obtenerToken();
            if (token) return token;
        }
    } catch {}
    return localStorage.getItem(TOKEN_KEY);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function setMessage(text, type = "info") {
    const box = document.getElementById("notificationMessage");
    if (!box) return;
    box.textContent = text;
    box.className = `notification-message ${type}`;
}

async function api(path = "", options = {}) {
    const token = getToken();
    if (!token) {
        setMessage("Necesitas iniciar sesión para revisar tus notificaciones.", "warning");
        setTimeout(() => window.location.href = "/pages/login.html", 700);
        throw new Error("Se requiere autenticación.");
    }

    const headers = { Authorization: `Bearer ${token}`, ...(options.headers || {}) };
    if (options.body !== undefined && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

    const response = await fetch(`${NOTIFICATIONS_API}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (response.status === 401 || response.status === 403) {
        setMessage("Tu sesión ya no es válida. Inicia sesión nuevamente.", "error");
        setTimeout(() => window.location.href = "/pages/login.html", 900);
    }

    if (!response.ok || data.success === false) throw new Error(data.mensaje || "No se pudo completar la operación.");
    return data;
}

function categoryOf(item) {
    const type = String(item?.tipo || "GENERAL").toUpperCase();
    if (["BECA", "CONVOCATORIA", "OPORTUNIDAD"].includes(type)) return "OPORTUNIDAD";
    if (["FECHA", "CALENDARIO", "CIERRE"].includes(type)) return "FECHA";
    if (["DOCUMENTO", "VALIDACION_DOCUMENTO"].includes(type)) return "DOCUMENTO";
    return "GENERAL";
}

function iconFor(item) {
    const category = categoryOf(item);
    if (category === "OPORTUNIDAD") return "graduation-cap";
    if (category === "FECHA") return "calendar-clock";
    if (category === "DOCUMENTO") return "file-check-2";
    return "bell";
}

function formatDate(value) {
    if (!value) return "Fecha no disponible";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Fecha no disponible";
    return date.toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}

function filteredItems() {
    const filter = notificationState.filter;
    if (filter === "TODAS") return notificationState.items;
    if (filter === "NO_LEIDAS") return notificationState.items.filter(item => !Boolean(item.leida));
    return notificationState.items.filter(item => categoryOf(item) === filter);
}

function renderSummary() {
    const summary = notificationState.summary || {};
    document.getElementById("heroUnread").textContent = summary.no_leidas ?? 0;
    document.getElementById("kpiTotal").textContent = summary.total ?? notificationState.items.length;
    document.getElementById("kpiUnread").textContent = summary.no_leidas ?? 0;
    document.getElementById("kpiOpportunities").textContent = summary.oportunidades ?? 0;
    document.getElementById("kpiDocuments").textContent = summary.documentos ?? 0;
}

function renderItems() {
    const list = document.getElementById("notificationList");
    if (!list) return;
    const items = filteredItems();

    if (!items.length) {
        list.innerHTML = `<div class="empty-notifications"><i data-lucide="inbox"></i><h3>No hay notificaciones en este filtro</h3><p>Cuando EduPerú genere nuevos avisos aparecerán aquí.</p></div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    list.innerHTML = items.map(item => {
        const unread = !Boolean(item.leida);
        const category = categoryOf(item);
        return `<article class="notification-card ${unread ? "unread" : "read"}" data-id="${Number(item.id_notificacion)}">
            <div class="notification-icon ${category.toLowerCase()}"><i data-lucide="${iconFor(item)}"></i></div>
            <div class="notification-content">
                <div class="notification-heading"><div><span class="notification-type">${escapeHtml(item.tipo || "GENERAL")}</span><h3>${escapeHtml(item.titulo || "Notificación")}</h3></div>${unread ? '<span class="unread-dot" title="No leída"></span>' : '<span class="read-label">Leída</span>'}</div>
                <p>${escapeHtml(item.mensaje || "")}</p>
                <div class="notification-meta"><span><i data-lucide="clock-3"></i>${escapeHtml(formatDate(item.fecha_creacion))}</span>${item.fecha_lectura ? `<span><i data-lucide="check"></i>Leída ${escapeHtml(formatDate(item.fecha_lectura))}</span>` : ""}</div>
            </div>
            <div class="notification-actions">
                ${unread ? `<button type="button" class="action-btn primary" data-action="read" title="Marcar como leída"><i data-lucide="check"></i></button>` : ""}
                <button type="button" class="action-btn danger" data-action="delete" title="Eliminar"><i data-lucide="trash-2"></i></button>
            </div>
        </article>`;
    }).join("");

    if (window.lucide) lucide.createIcons();
}

function render() {
    renderSummary();
    renderItems();
}

async function loadNotifications(silent = false) {
    if (notificationState.loading) return;
    notificationState.loading = true;
    if (!silent) setMessage("Consultando tu bandeja personal...", "info");

    try {
        const [listData, summaryData] = await Promise.all([
            api("/"),
            api("/resumen")
        ]);
        notificationState.items = Array.isArray(listData.resultado) ? listData.resultado : [];
        notificationState.summary = summaryData.resultado || {};
        render();
        setMessage(notificationState.items.length ? "Bandeja actualizada correctamente." : "Tu bandeja está vacía por ahora.", "success");
    } catch (error) {
        setMessage(error.message, "error");
    } finally {
        notificationState.loading = false;
    }
}

async function markOne(id) {
    try {
        await api(`/${id}/leida`, { method: "PATCH" });
        await loadNotifications(true);
        setMessage("Notificación marcada como leída.", "success");
    } catch (error) {
        setMessage(error.message, "error");
    }
}

async function markAll() {
    try {
        const result = await api("/marcar-todas", { method: "PATCH" });
        await loadNotifications(true);
        setMessage(`Se marcaron ${Number(result?.resultado?.actualizadas || 0)} notificaciones como leídas.`, "success");
    } catch (error) {
        setMessage(error.message, "error");
    }
}

async function deleteOne(id) {
    if (!window.confirm("¿Eliminar esta notificación de tu bandeja?")) return;
    try {
        await api(`/${id}`, { method: "DELETE" });
        await loadNotifications(true);
        setMessage("Notificación eliminada.", "success");
    } catch (error) {
        setMessage(error.message, "error");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("refreshButton")?.addEventListener("click", () => loadNotifications());
    document.getElementById("markAllButton")?.addEventListener("click", markAll);

    document.getElementById("filterGroup")?.addEventListener("click", event => {
        const button = event.target.closest("[data-filter]");
        if (!button) return;
        notificationState.filter = button.dataset.filter;
        document.querySelectorAll(".filter-chip").forEach(item => item.classList.toggle("active", item === button));
        renderItems();
    });

    document.getElementById("notificationList")?.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");
        const card = event.target.closest("[data-id]");
        if (!button || !card) return;
        const id = Number(card.dataset.id);
        if (button.dataset.action === "read") markOne(id);
        if (button.dataset.action === "delete") deleteOne(id);
    });

    if (!getToken()) {
        setMessage("Necesitas iniciar sesión para revisar tus notificaciones.", "warning");
        setTimeout(() => window.location.href = "/pages/login.html", 700);
        return;
    }

    loadNotifications();
});
