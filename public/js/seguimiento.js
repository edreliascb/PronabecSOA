const API = '/api/seguimiento-postulaciones';
const TOKEN_KEY = 'eduperu_token';
const state = { seguimientos: [], resumen: null, filtro: 'TODOS', texto: '' };

function token() {
    try {
        if (window.EduPeruAuth && typeof window.EduPeruAuth.obtenerToken === 'function') {
            const t = window.EduPeruAuth.obtenerToken();
            if (t) return t;
        }
    } catch {}
    return localStorage.getItem(TOKEN_KEY);
}

async function request(path = '', options = {}) {
    const t = token();
    if (!t) {
        window.location.href = '/pages/login.html';
        throw new Error('Se requiere iniciar sesión.');
    }
    const headers = { Authorization: `Bearer ${t}`, ...(options.headers || {}) };
    if (options.body !== undefined && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${API}${path}`, { ...options, headers });
    let data = null;
    try { data = await res.json(); } catch {}
    if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/pages/login.html';
        throw new Error('La sesión expiró.');
    }
    if (!res.ok) throw new Error(data?.mensaje || `Error ${res.status}`);
    return data;
}

function repararTexto(value) {
    return String(value ?? '')
        .replace(/EduPer�/g, 'EduPerú')
        .replace(/Per�/g, 'Perú')
        .replace(/Postulaci�n/gi, (m) => m[0] === 'p' ? 'postulación' : 'Postulación')
        .replace(/Evaluaci�n/gi, (m) => m[0] === 'e' ? 'evaluación' : 'Evaluación')
        .replace(/Documentaci�n/gi, (m) => m[0] === 'd' ? 'documentación' : 'Documentación')
        .replace(/Identificaci�n/gi, (m) => m[0] === 'i' ? 'identificación' : 'Identificación')
        .replace(/Revisi�n/gi, (m) => m[0] === 'r' ? 'revisión' : 'Revisión');
}

function escapeHtml(value) {
    return repararTexto(value).replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
}

function formatDate(value) {
    if (!value) return 'N/D';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'N/D';
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

const estadosOrdenados = [
    ['IDENTIFICADA','Oportunidad identificada'],
    ['REQUISITOS_REVISADOS','Requisitos revisados'],
    ['DOCUMENTOS_EN_PROCESO','Documentación en proceso'],
    ['LISTA_PARA_POSTULAR','Lista para postular'],
    ['POSTULADA','Postulación realizada'],
    ['EN_EVALUACION','En evaluación'],
    ['RESULTADO_DISPONIBLE','Resultado disponible'],
    ['ADMITIDA','Admitida / seleccionada'],
    ['NO_SELECCIONADA','No seleccionada'],
    ['CANCELADA','Cancelada']
];

function renderKpis() {
    const r = state.resumen || { total:0, activos:0, postulados:0, progreso_promedio:0 };
    document.getElementById('kpiTotal').textContent = r.total ?? 0;
    document.getElementById('kpiActivos').textContent = r.activos ?? 0;
    document.getElementById('kpiPostulados').textContent = r.postulados ?? 0;
    document.getElementById('kpiProgreso').textContent = `${r.progreso_promedio ?? 0}%`;
}

function filtrados() {
    const q = state.texto.trim().toLowerCase();
    return state.seguimientos.filter((s) => {
        const matchText = !q || [s.titulo, s.id_postulacion, s.estado_etiqueta, s.notas].some((v) => String(v || '').toLowerCase().includes(q));
        if (!matchText) return false;
        if (state.filtro === 'ACTIVOS') return !s.terminal;
        if (state.filtro === 'FINALIZADOS') return !!s.terminal;
        if (state.filtro === 'POSTULADOS') return ['POSTULADA','EN_EVALUACION','RESULTADO_DISPONIBLE','ADMITIDA','NO_SELECCIONADA'].includes(s.estado);
        return true;
    });
}

function stageHtml(etapa) {
    return `<div class="stage ${etapa.completada ? 'complete' : ''} ${etapa.actual ? 'current' : ''}"><div class="stage-dot"></div><span>${escapeHtml(etapa.titulo)}</span></div>`;
}

function cardHtml(s) {
    const options = estadosOrdenados.map(([value,label]) => `<option value="${value}" ${s.estado===value?'selected':''}>${label}</option>`).join('');
    return `<article class="tracking-card" data-id="${s.id_seguimiento}">
        <div class="tracking-card-head"><div><h3>${escapeHtml(s.titulo)}</h3><span class="tracking-ref">Referencia: ${escapeHtml(s.id_postulacion)}</span></div><span class="status-chip">${escapeHtml(s.estado_etiqueta)}</span></div>
        <div class="progress-row"><span>Progreso</span><strong>${Number(s.progreso||0)}%</strong></div>
        <div class="progress-bar"><span style="width:${Math.max(0,Math.min(100,Number(s.progreso||0)))}%"></span></div>
        <div class="tracking-stages">${(s.etapas||[]).map(stageHtml).join('')}</div>
        <div class="tracking-notes">${escapeHtml(s.notas || 'Sin notas adicionales.')}</div>
        <div class="tracking-card-actions">
            <select data-state-select>${options}</select>
            <button class="btn btn-secondary" type="button" data-history><i data-lucide="history"></i> Historial</button>
            <button class="btn btn-secondary" type="button" data-edit><i data-lucide="pencil"></i> Editar</button>
        </div>
        <small style="display:block;margin-top:12px;color:#94a0af">Actualizado: ${formatDate(s.fecha_actualizacion)}</small>
    </article>`;
}

function render() {
    const grid = document.getElementById('trackingGrid');
    const empty = document.getElementById('trackingEmpty');
    const items = filtrados();
    grid.innerHTML = items.map(cardHtml).join('');
    empty.hidden = items.length > 0;
    document.getElementById('trackingStatus').textContent = `${items.length} de ${state.seguimientos.length} seguimientos visibles`;
    lucide?.createIcons?.();
}

async function cargar() {
    document.getElementById('trackingStatus').textContent = 'Actualizando seguimientos...';
    try {
        const [lista, resumen] = await Promise.all([request(''), request('/resumen')]);
        state.seguimientos = Array.isArray(lista.resultado) ? lista.resultado : [];
        state.resumen = resumen.resultado || null;
        renderKpis();
        render();
    } catch (e) {
        document.getElementById('trackingStatus').innerHTML = `<div class="tracking-error">${escapeHtml(e.message)}</div>`;
    }
}

function openModal(html) {
    const modal = document.getElementById('trackingModal');
    document.getElementById('modalContent').innerHTML = html;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    lucide?.createIcons?.();
}

function closeModal() {
    document.getElementById('trackingModal').hidden = true;
    document.body.style.overflow = '';
}

function openCreate(prefill = {}) {
    openModal(`<h2 id="modalTitle">Nuevo seguimiento</h2><p>Registra una oportunidad que quieras controlar personalmente.</p>
        <form id="createTrackingForm" class="tracking-form">
            <div><label>Referencia / ID de postulación</label><input name="id_postulacion" maxlength="120" required value="${escapeHtml(prefill.id_postulacion||'')}"></div>
            <div><label>Estado inicial</label><select name="estado">${estadosOrdenados.slice(0,4).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></div>
            <div class="full"><label>Título</label><input name="titulo" maxlength="220" required value="${escapeHtml(prefill.titulo||'')}"></div>
            <div class="full"><label>Notas</label><textarea name="notas" maxlength="1000" placeholder="Documentos pendientes, observaciones, enlace oficial..."></textarea></div>
            <div class="full modal-actions"><button class="btn btn-secondary" type="button" data-close-modal>Cancelar</button><button class="btn btn-primary" type="submit">Crear seguimiento</button></div>
        </form>`);
}

function openEdit(s) {
    openModal(`<h2 id="modalTitle">Editar seguimiento</h2><p>${escapeHtml(s.id_postulacion)}</p>
        <form id="editTrackingForm" class="tracking-form" data-id="${s.id_seguimiento}">
            <div class="full"><label>Título</label><input name="titulo" maxlength="220" required value="${escapeHtml(s.titulo)}"></div>
            <div class="full"><label>Notas</label><textarea name="notas" maxlength="1000">${escapeHtml(s.notas||'')}</textarea></div>
            <div class="full modal-actions"><button class="btn btn-secondary danger-link" type="button" data-delete="${s.id_seguimiento}">Eliminar</button><button class="btn btn-secondary" type="button" data-close-modal>Cancelar</button><button class="btn btn-primary" type="submit">Guardar</button></div>
        </form>`);
}

async function openHistory(s) {
    openModal(`<h2 id="modalTitle">Historial</h2><p>${escapeHtml(s.titulo)}</p><div id="historyContent" class="tracking-status">Cargando historial...</div>`);
    try {
        const data = await request(`/${s.id_seguimiento}/historial`);
        const items = data.resultado || [];
        document.getElementById('historyContent').innerHTML = items.length ? `<div class="history-list">${items.map((h)=>`<div class="history-item"><div class="history-marker"></div><div><strong>${escapeHtml(h.accion)}</strong><p>${escapeHtml(h.detalle || h.estado_nuevo_etiqueta || '')}</p><time>${formatDate(h.fecha_evento)}</time></div></div>`).join('')}</div>` : '<p>No hay movimientos registrados todavía.</p>';
    } catch (e) {
        document.getElementById('historyContent').innerHTML = `<div class="tracking-error">${escapeHtml(e.message)}</div>`;
    }
}

async function cambiarEstado(id, estado) {
    try {
        await request(`/${id}/estado`, { method:'PATCH', body:JSON.stringify({estado}) });
        await cargar();
    } catch (e) { alert(e.message); await cargar(); }
}

async function submitCreate(form) {
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    await request('', { method:'POST', body:JSON.stringify(payload) });
    closeModal();
    await cargar();
}

async function submitEdit(form) {
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    await request(`/${form.dataset.id}`, { method:'PATCH', body:JSON.stringify(payload) });
    closeModal();
    await cargar();
}

async function eliminar(id) {
    if (!confirm('¿Eliminar este seguimiento? Esta acción no afecta ninguna postulación oficial.')) return;
    await request(`/${id}`, { method:'DELETE' });
    closeModal();
    await cargar();
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!token()) { window.location.href='/pages/login.html'; return; }
    document.getElementById('newTrackingButton')?.addEventListener('click',()=>openCreate());
    document.querySelector('[data-open-create]')?.addEventListener('click',()=>openCreate());
    document.getElementById('refreshButton')?.addEventListener('click',cargar);
    document.getElementById('trackingSearch')?.addEventListener('input',(e)=>{state.texto=e.target.value;render();});
    document.getElementById('trackingFilter')?.addEventListener('change',(e)=>{state.filtro=e.target.value;render();});

    document.getElementById('trackingGrid')?.addEventListener('change',(e)=>{
        const select=e.target.closest('[data-state-select]'); if(!select)return;
        const card=select.closest('[data-id]'); cambiarEstado(card.dataset.id,select.value);
    });
    document.getElementById('trackingGrid')?.addEventListener('click',(e)=>{
        const card=e.target.closest('[data-id]'); if(!card)return;
        const s=state.seguimientos.find(x=>String(x.id_seguimiento)===String(card.dataset.id)); if(!s)return;
        if(e.target.closest('[data-history]')) openHistory(s);
        if(e.target.closest('[data-edit]')) openEdit(s);
    });
    document.getElementById('trackingModal')?.addEventListener('click',(e)=>{
        if(e.target.closest('[data-close-modal]')) closeModal();
        const del=e.target.closest('[data-delete]'); if(del) eliminar(del.dataset.delete);
    });
    document.getElementById('trackingModal')?.addEventListener('submit',async(e)=>{
        e.preventDefault();
        try {
            if(e.target.id==='createTrackingForm') await submitCreate(e.target);
            if(e.target.id==='editTrackingForm') await submitEdit(e.target);
        } catch(err){ alert(err.message); }
    });
    const p=new URLSearchParams(location.search);
    if(p.get('crear')==='1') openCreate({id_postulacion:p.get('id')||'',titulo:p.get('titulo')||''});
    await cargar();
});
