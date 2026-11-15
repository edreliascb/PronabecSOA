const CALENDAR_API = "/api/calendario";
const TOKEN_KEY = "eduperu_token";

const state = {
    cursor: new Date(),
    events: [],
    allEvents: [],
    proximos: [],
    sources: null,
    filter: "TODOS"
};

function token() {
    try {
        if (window.EduPeruAuth && typeof window.EduPeruAuth.obtenerToken === "function") {
            const t = window.EduPeruAuth.obtenerToken();
            if (t) return t;
        }
    } catch {}
    return localStorage.getItem(TOKEN_KEY);
}

function showMessage(text, type = "info") {
    const box = document.getElementById("calendarMessage");
    if (!box) return;
    box.textContent = text;
    box.className = `calendar-message ${type}`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function loadCalendar() {
    const t = token();
    if (!t) {
        showMessage("Necesitas iniciar sesión para ver tu calendario.", "warning");
        setTimeout(() => window.location.href = "/pages/login.html", 700);
        return;
    }

    showMessage("Consultando fechas oficiales y tu agenda personal...", "info");

    try {
        const response = await fetch(CALENDAR_API, {
            headers: { Authorization: `Bearer ${t}` }
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            showMessage("La sesión ha expirado. Inicia sesión nuevamente.", "error");
            setTimeout(() => window.location.href = "/pages/login.html", 900);
            return;
        }

        if (!response.ok || data.success === false) {
            throw new Error(data.mensaje || "No se pudo cargar el calendario.");
        }

        const result = data.resultado || {};
        state.allEvents = Array.isArray(result.datos) ? result.datos : [];
        state.proximos = Array.isArray(result.proximos) ? result.proximos : [];
        state.sources = result.fuentes || {};

        updateGlobalKpis(result);
        render();

        if (result.fuentes?.cronograma?.disponible === false) {
            showMessage(
                "Tu calendario personal está disponible, pero la fuente oficial de cronogramas no respondió. No se muestran fechas inventadas.",
                "warning"
            );
        } else {
            showMessage("Calendario actualizado correctamente.", "success");
        }
    } catch (error) {
        console.error("[CalendarioEducativo]", error);
        showMessage(`Error: ${error.message}`, "error");
    }
}

function updateGlobalKpis(result) {
    const all = state.allEvents;
    document.getElementById("heroTotal").textContent = all.length;
    document.getElementById("kpiOficiales").textContent = all.filter(x => x.categoria === "OFICIAL").length;
    document.getElementById("kpiPersonales").textContent = all.filter(x => x.categoria === "PERSONAL").length;
    document.getElementById("kpiProximos").textContent = state.proximos.length;

    const oficial = result.fuentes?.cronograma;
    document.getElementById("kpiFuente").textContent = oficial?.disponible === false ? "N/D" : "OK";
    document.getElementById("kpiFuenteDetalle").textContent = oficial?.disponible === false
        ? "fuente no disponible"
        : "fuente oficial disponible";

    const note = document.getElementById("sourceNote");
    if (note) {
        note.textContent = oficial?.disponible === false
            ? `Fuente oficial no disponible: ${oficial?.motivo || "sin detalle"}. Las alertas y seguimientos personales sí pueden seguir mostrándose.`
            : `Fuente oficial: ${oficial?.fuente || "PRONABEC - Fuentes oficiales"}. EduPerú no genera fechas que la fuente no publique.`;
    }
}

function monthEvents() {
    const year = state.cursor.getFullYear();
    const month = state.cursor.getMonth();

    return state.allEvents.filter(item => {
        if (!item.fecha) return false;
        if (state.filter !== "TODOS" && item.categoria !== state.filter) return false;
        const d = new Date(item.fecha);
        return d.getUTCFullYear() === year && d.getUTCMonth() === month;
    });
}

function dateKey(fecha) {
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
}

function render() {
    renderMonthLabel();
    renderGrid();
    renderUpcoming();
    renderMonthList();
    if (window.lucide) lucide.createIcons();
}

function renderMonthLabel() {
    const label = state.cursor.toLocaleDateString("es-PE", {
        month: "long",
        year: "numeric"
    });
    document.getElementById("monthLabel").textContent = label.charAt(0).toUpperCase() + label.slice(1);
    document.getElementById("eventsTitle").textContent = `Eventos de ${label}`;
}

function renderGrid() {
    const grid = document.getElementById("calendarGrid");
    const year = state.cursor.getFullYear();
    const month = state.cursor.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const mondayIndex = (first.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - mondayIndex);
    const events = monthEvents();
    const map = new Map();

    for (const event of events) {
        const key = dateKey(event.fecha);
        if (!key) continue;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(event);
    }

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
    let html = "";

    for (let i = 0; i < 42; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        const dayEvents = map.get(key) || [];
        const outside = d.getMonth() !== month;
        const isToday = key === todayKey;
        const visible = dayEvents.slice(0, 3);

        html += `<div class="calendar-day ${outside ? "outside" : ""} ${isToday ? "today" : ""}">
            <span class="day-number">${d.getDate()}</span>
            <div class="day-events">
                ${visible.map(e => `<div class="day-event ${e.categoria === "PERSONAL" ? "personal" : "official"}" title="${escapeHtml(e.titulo)} — ${escapeHtml(e.detalle || "")}">${escapeHtml(e.titulo || "Evento")}</div>`).join("")}
                ${dayEvents.length > 3 ? `<span class="more-events">+${dayEvents.length - 3} más</span>` : ""}
            </div>
        </div>`;
    }

    grid.innerHTML = html;
}

function renderUpcoming() {
    const container = document.getElementById("upcomingList");
    let upcoming = state.proximos.filter(x => state.filter === "TODOS" || x.categoria === state.filter).slice(0, 8);

    if (!upcoming.length) {
        container.innerHTML = `<div class="empty-state"><i data-lucide="calendar-x"></i><div>No hay próximos eventos con este filtro.</div></div>`;
        return;
    }

    container.innerHTML = upcoming.map(item => {
        const d = new Date(item.fecha);
        const day = d.getUTCDate();
        const mon = d.toLocaleDateString("es-PE", {month:"short", timeZone:"UTC"}).replace(".", "");
        const days = item.diasHasta === 0 ? "Hoy" : item.diasHasta === 1 ? "Mañana" : item.diasHasta > 1 ? `En ${item.diasHasta} días` : "";
        return `<article class="upcoming-item">
            <div class="upcoming-date"><strong>${day}</strong><span>${escapeHtml(mon)}</span></div>
            <div><h4>${escapeHtml(item.titulo || "Evento")}</h4><p>${escapeHtml(item.detalle || "Sin detalle adicional")}</p>
            <div class="upcoming-meta"><span class="tiny-badge">${escapeHtml(item.categoria === "PERSONAL" ? "Mi espacio" : "Oficial")}</span>${days ? `<span class="tiny-badge">${escapeHtml(days)}</span>` : ""}</div></div>
        </article>`;
    }).join("");
}

function renderMonthList() {
    const events = monthEvents();
    const container = document.getElementById("monthEvents");
    document.getElementById("eventsCount").textContent = events.length;

    if (!events.length) {
        container.innerHTML = `<div class="empty-state"><i data-lucide="calendar-x"></i><div>No hay eventos registrados para este mes.</div></div>`;
        return;
    }

    container.innerHTML = events.map(item => {
        const d = new Date(item.fecha);
        const date = d.toLocaleDateString("es-PE", {day:"2-digit",month:"long",year:"numeric",timeZone:"UTC"});
        return `<article class="month-event ${item.categoria === "PERSONAL" ? "personal" : "official"}">
            <div class="event-marker"></div>
            <div><h4>${escapeHtml(item.titulo || "Evento")}</h4><p>${escapeHtml(item.detalle || "Sin detalle adicional")}</p>
            <div class="month-event-footer"><span>${escapeHtml(date)}</span><span>·</span><span>${escapeHtml(item.origen || "EduPerú")}</span>${item.fuente ? `<span>·</span><span>${escapeHtml(item.fuente)}</span>` : ""}</div></div>
        </article>`;
    }).join("");
}

function setup() {
    document.getElementById("prevMonth")?.addEventListener("click", () => {
        state.cursor = new Date(state.cursor.getFullYear(), state.cursor.getMonth() - 1, 1);
        render();
    });
    document.getElementById("nextMonth")?.addEventListener("click", () => {
        state.cursor = new Date(state.cursor.getFullYear(), state.cursor.getMonth() + 1, 1);
        render();
    });
    document.getElementById("todayButton")?.addEventListener("click", () => {
        state.cursor = new Date();
        render();
    });
    document.getElementById("refreshButton")?.addEventListener("click", loadCalendar);
    document.querySelectorAll(".filter-chip").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filter-chip").forEach(x => x.classList.remove("active"));
            btn.classList.add("active");
            state.filter = btn.dataset.filter || "TODOS";
            render();
        });
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    setup();
    if (window.lucide) lucide.createIcons();
    await loadCalendar();
});
