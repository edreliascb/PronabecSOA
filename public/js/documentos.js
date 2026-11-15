const API_DOCUMENTOS = '/api/mis-documentos';
const API_VALIDACION = '/api/validacion-documentos';
const TOKEN_KEY = 'eduperu_token';

const state = { documentos: [], filtro: 'TODOS', texto: '' };

function token() {
    try {
        if (window.EduPeruAuth && typeof window.EduPeruAuth.obtenerToken === 'function') {
            const value = window.EduPeruAuth.obtenerToken();
            if (value) return value;
        }
    } catch {}
    return localStorage.getItem(TOKEN_KEY);
}

async function api(url, options = {}) {
    const jwt = token();
    if (!jwt) {
        location.href = '/pages/login.html';
        throw new Error('Se requiere iniciar sesión.');
    }
    const headers = { Authorization: `Bearer ${jwt}`, ...(options.headers || {}) };
    if (options.body !== undefined && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    const response = await fetch(url, { ...options, headers });
    let data = null;
    try { data = await response.json(); } catch {}
    if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        location.href = '/pages/login.html';
        throw new Error('La sesión expiró.');
    }
    if (!response.ok) throw new Error(data?.mensaje || `Error ${response.status}`);
    return data;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
}

function formatDate(value) {
    if (!value) return 'No indicada';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'No indicada';
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(date);
}

function normalizeStatus(value) {
    return String(value || 'PENDIENTE').toUpperCase();
}

function statusMeta(value) {
    const status = normalizeStatus(value);
    if (status === 'VALIDO') return { label: 'Válido', cls: 'valid', icon: 'badge-check' };
    if (status === 'VENCIDO') return { label: 'Vencido', cls: 'danger', icon: 'calendar-x-2' };
    if (status === 'INCOMPLETO') return { label: 'Incompleto', cls: 'warning', icon: 'triangle-alert' };
    if (status === 'INCONSISTENTE') return { label: 'Inconsistente', cls: 'danger', icon: 'circle-alert' };
    return { label: 'Pendiente', cls: 'pending', icon: 'clock-3' };
}

function filteredDocuments() {
    const query = state.texto.trim().toLowerCase();
    return state.documentos.filter(doc => {
        const status = normalizeStatus(doc.estado_validacion);
        const filterOk = state.filtro === 'TODOS'
            || status === state.filtro
            || (state.filtro === 'OBSERVADOS' && ['VENCIDO','INCOMPLETO','INCONSISTENTE'].includes(status));
        const haystack = [doc.tipo_documento, doc.nombre_archivo, doc.descripcion, doc.observacion_validacion]
            .filter(Boolean).join(' ').toLowerCase();
        return filterOk && (!query || haystack.includes(query));
    });
}

function renderKpis() {
    const total = state.documentos.length;
    const validos = state.documentos.filter(d => normalizeStatus(d.estado_validacion) === 'VALIDO').length;
    const pendientes = state.documentos.filter(d => normalizeStatus(d.estado_validacion) === 'PENDIENTE').length;
    const revisados = state.documentos.filter(d => normalizeStatus(d.estado_validacion) !== 'PENDIENTE').length;
    const progreso = total ? Math.round((revisados / total) * 100) : 0;
    document.getElementById('kpiTotal').textContent = total;
    document.getElementById('kpiValidos').textContent = validos;
    document.getElementById('kpiPendientes').textContent = pendientes;
    document.getElementById('kpiProgreso').textContent = `${progreso}%`;
    document.getElementById('progressText').textContent = `${revisados} de ${total} revisados`;
    document.getElementById('progressDetail').textContent = total
        ? `${validos} válidos · ${pendientes} pendientes · ${Math.max(0, total - validos - pendientes)} observados`
        : 'Registra tus documentos para comenzar.';
    document.getElementById('progressBar').style.width = `${progreso}%`;
}

function render() {
    renderKpis();
    const docs = filteredDocuments();
    const grid = document.getElementById('documentGrid');
    const empty = document.getElementById('documentEmpty');
    if (!state.documentos.length) {
        grid.innerHTML = '';
        empty.hidden = false;
        return;
    }
    empty.hidden = true;
    grid.innerHTML = docs.length ? docs.map(doc => {
        const meta = statusMeta(doc.estado_validacion);
        return `
        <article class="document-card" data-id="${Number(doc.id_documento_usuario)}">
            <div class="document-card-head">
                <div class="document-icon"><i data-lucide="file-text"></i></div>
                <span class="document-badge ${meta.cls}"><i data-lucide="${meta.icon}"></i>${meta.label}</span>
            </div>
            <div class="document-card-body">
                <span class="document-type">${escapeHtml(doc.tipo_documento)}</span>
                <h3>${escapeHtml(doc.nombre_archivo)}</h3>
                <p>${escapeHtml(doc.descripcion || 'Sin descripción')}</p>
                <dl>
                    <div><dt>Emisión</dt><dd>${formatDate(doc.fecha_emision)}</dd></div>
                    <div><dt>Vencimiento</dt><dd>${formatDate(doc.fecha_vencimiento)}</dd></div>
                </dl>
                ${doc.observacion_validacion ? `<div class="document-observation"><i data-lucide="info"></i><span>${escapeHtml(doc.observacion_validacion)}</span></div>` : ''}
            </div>
            <div class="document-card-actions">
                <button class="btn btn-secondary" type="button" data-validate><i data-lucide="shield-check"></i> Validar</button>
                <button class="document-delete" type="button" data-delete title="Eliminar"><i data-lucide="trash-2"></i></button>
            </div>
        </article>`;
    }).join('') : '<div class="document-no-results"><i data-lucide="search-x"></i><strong>No hay coincidencias</strong><span>Prueba otro filtro o término.</span></div>';
    if (window.lucide) lucide.createIcons();
}

function openCreate() {
    const modal = document.getElementById('documentModal');
    document.getElementById('documentModalContent').innerHTML = `
        <div class="modal-heading"><span>CHECKLIST DOCUMENTAL</span><h2 id="documentModalTitle">Registrar documento</h2><p>Registra los datos básicos del documento. En esta versión no se envía el archivo físico a PRONABEC.</p></div>
        <form id="documentForm" class="document-form">
            <label>Tipo de documento<input name="tipo_documento" maxlength="100" required placeholder="Ej. DNI, certificado de estudios"></label>
            <label>Nombre del archivo<input name="nombre_archivo" maxlength="255" required placeholder="Ej. certificado-estudios.pdf"></label>
            <label class="full">Descripción<textarea name="descripcion" maxlength="500" rows="3" placeholder="Nota opcional sobre el documento"></textarea></label>
            <label>Fecha de emisión<input name="fecha_emision" type="date"></label>
            <label>Fecha de vencimiento<input name="fecha_vencimiento" type="date"></label>
            <div class="form-note full"><i data-lucide="shield-check"></i><span>El registro queda asociado únicamente a tu usuario autenticado.</span></div>
            <div class="form-actions full"><button type="button" class="btn btn-secondary" data-close-modal>Cancelar</button><button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Guardar</button></div>
        </form>`;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    if (window.lucide) lucide.createIcons();
}

function closeModal() {
    document.getElementById('documentModal').hidden = true;
    document.body.classList.remove('modal-open');
}

async function createDocument(form) {
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    if (!payload.fecha_emision) payload.fecha_emision = null;
    if (!payload.fecha_vencimiento) payload.fecha_vencimiento = null;
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
        await api(API_DOCUMENTOS, { method: 'POST', body: JSON.stringify(payload) });
        closeModal();
        await loadDocuments();
    } finally { submit.disabled = false; }
}

async function validateDocument(id) {
    const card = document.querySelector(`.document-card[data-id="${id}"]`);
    card?.classList.add('loading');
    try {
        await api(`${API_VALIDACION}/${id}`, { method: 'POST' });
        await loadDocuments();
    } catch (error) {
        alert(error.message);
    } finally { card?.classList.remove('loading'); }
}

async function deleteDocument(id) {
    if (!confirm('¿Eliminar este registro documental de tu espacio personal?')) return;
    try {
        await api(`${API_DOCUMENTOS}/${id}`, { method: 'DELETE' });
        await loadDocuments();
    } catch (error) { alert(error.message); }
}

async function loadDocuments() {
    const status = document.getElementById('documentStatus');
    status.className = 'document-status';
    status.textContent = 'Actualizando documentos...';
    try {
        const data = await api(API_DOCUMENTOS);
        state.documentos = Array.isArray(data?.resultado) ? data.resultado : [];
        status.className = 'document-status success';
        status.textContent = state.documentos.length ? `${state.documentos.length} documento(s) cargado(s).` : 'Tu checklist documental está listo.';
        render();
    } catch (error) {
        status.className = 'document-status error';
        status.textContent = error.message;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!token()) { location.href = '/pages/login.html'; return; }
    document.getElementById('newDocumentButton')?.addEventListener('click', openCreate);
    document.querySelector('[data-open-create]')?.addEventListener('click', openCreate);
    document.getElementById('refreshButton')?.addEventListener('click', loadDocuments);
    document.getElementById('documentSearch')?.addEventListener('input', e => { state.texto = e.target.value; render(); });
    document.getElementById('documentFilter')?.addEventListener('change', e => { state.filtro = e.target.value; render(); });
    document.getElementById('documentGrid')?.addEventListener('click', e => {
        const card = e.target.closest('[data-id]');
        if (!card) return;
        if (e.target.closest('[data-validate]')) validateDocument(card.dataset.id);
        if (e.target.closest('[data-delete]')) deleteDocument(card.dataset.id);
    });
    document.getElementById('documentModal')?.addEventListener('click', e => { if (e.target.closest('[data-close-modal]')) closeModal(); });
    document.getElementById('documentModal')?.addEventListener('submit', e => {
        if (e.target.id !== 'documentForm') return;
        e.preventDefault();
        createDocument(e.target).catch(error => alert(error.message));
    });
    await loadDocuments();
});
