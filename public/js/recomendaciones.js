const recState={todos:[],tipo:"TODOS",busqueda:"",perfil:null};

document.addEventListener("DOMContentLoaded",async()=>{
  if(!localStorage.getItem("eduperu_token")){location.href="/pages/login.html";return;}
  document.getElementById("refreshButton")?.addEventListener("click",cargarRecomendaciones);
  document.getElementById("searchInput")?.addEventListener("input",e=>{recState.busqueda=e.target.value.toLowerCase().trim();renderizar();});
  document.getElementById("typeTabs")?.addEventListener("click",e=>{const b=e.target.closest("button[data-type]");if(!b)return;recState.tipo=b.dataset.type;document.querySelectorAll("#typeTabs button").forEach(x=>x.classList.toggle("active",x===b));renderizar();});
  document.getElementById("recommendationGrid")?.addEventListener("click",async e=>{const b=e.target.closest("button[data-save]");if(!b)return;await guardarFavorito(Number(b.dataset.index));});
  await cargarRecomendaciones();
  if(window.lucide)lucide.createIcons();
});

async function api(endpoint,options={}){
  const token=localStorage.getItem("eduperu_token");
  const headers={...(options.headers||{}),Authorization:`Bearer ${token}`};
  if(options.body&&!headers["Content-Type"])headers["Content-Type"]="application/json";
  const r=await fetch(endpoint,{...options,headers}); let d={}; try{d=await r.json();}catch{}
  if(r.status===401){localStorage.removeItem("eduperu_token");location.href="/pages/login.html";throw new Error("Sesión vencida");}
  if(!r.ok)throw new Error(d.mensaje||`Error HTTP ${r.status}`); return d;
}

async function cargarRecomendaciones(){
  mostrarAlerta("",false);
  try{
    const d=await api("/api/recomendaciones"); const r=d.resultado||{};
    recState.todos=Array.isArray(r.datos)?r.datos:[]; recState.perfil=r.perfilUtilizado||null;
    if(r.estado==="PERFIL_INCOMPLETO")mostrarAlerta(r.mensaje||"Completa tu perfil para generar recomendaciones.",true);
    document.getElementById("disclaimerText").textContent=r.observacion||"Las recomendaciones son orientativas y no constituyen una decisión oficial de PRONABEC.";
    renderPerfil(); renderizar();
  }catch(e){mostrarAlerta(e.message||"No se pudieron cargar las recomendaciones.",true);recState.todos=[];renderizar();}
}

function renderPerfil(){
  const c=document.getElementById("profileChips"); if(!c)return; c.innerHTML="";
  const p=recState.perfil;
  if(!p){c.innerHTML='<span>Perfil todavía sin datos suficientes</span>';return;}
  const campos=[["Departamento",p.departamento],["Provincia",p.provincia],["Distrito",p.distrito],["Carrera",p.carrera_interes],["Nivel",p.nivel_estudio],["Institución",p.institucion]].filter(x=>x[1]);
  c.innerHTML=campos.length?campos.map(([k,v])=>`<span><strong>${esc(k)}:</strong> ${esc(v)}</span>`).join(""):'<span>Completa tu perfil para mejorar la personalización.</span>';
}

function renderizar(){
  const arr=recState.todos.filter(x=>(recState.tipo==="TODOS"||x.tipo===recState.tipo)&&(!recState.busqueda||String(x.titulo||"").toLowerCase().includes(recState.busqueda)||String((x.coincidencias||[]).join(" ")).toLowerCase().includes(recState.busqueda)));
  document.getElementById("kpiTotal").textContent=recState.todos.length;
  document.getElementById("kpiConvocatorias").textContent=recState.todos.filter(x=>x.tipo==="CONVOCATORIA").length;
  document.getElementById("kpiCarreras").textContent=recState.todos.filter(x=>x.tipo==="CARRERA").length;
  document.getElementById("kpiScore").textContent=recState.todos.reduce((m,x)=>Math.max(m,Number(x.puntaje)||0),0);
  const g=document.getElementById("recommendationGrid"); if(!g)return;
  if(!arr.length){g.innerHTML='<div class="rec-empty"><strong>No hay recomendaciones para este filtro.</strong><br>Completa tu perfil o prueba otra búsqueda.</div>';return;}
  g.innerHTML=arr.map(x=>{const idx=recState.todos.indexOf(x);return `<article class="rec-card"><div class="rec-card-top"><span class="rec-type">${esc(x.tipo||"OPORTUNIDAD")}</span><span class="rec-score">${Number(x.puntaje)||0} pts</span></div><h3>${esc(x.titulo||"Oportunidad")}</h3><div class="rec-reasons">${(x.coincidencias||[]).map(y=>`<span>${esc(y)}</span>`).join("")||'<span>Coincidencia general</span>'}</div><div class="rec-source">Fuente de cálculo: ${esc(x.fuente||"EduPerú")}</div><div class="rec-actions"><button class="save-btn" data-save="1" data-index="${idx}">♡ Guardar en favoritos</button></div></article>`;}).join("");
  if(window.lucide)lucide.createIcons();
}

async function guardarFavorito(i){
  const x=recState.todos[i]; if(!x)return;
  try{const d=await api("/api/favoritos",{method:"POST",body:JSON.stringify({tipo_recurso:x.tipo||"OPORTUNIDAD",recurso_id:String(x.id??i+1),titulo:x.titulo||"Recomendación EduPerú",subtitulo:`Recomendada por: ${(x.coincidencias||[]).join(", ")||"perfil educativo"}`,datos:{puntaje:x.puntaje,coincidencias:x.coincidencias,fuente:x.fuente}})});mostrarAlerta(d.mensaje||"Guardado en favoritos.",true,"ok");}catch(e){mostrarAlerta(e.message||"No se pudo guardar.",true);}
}

function mostrarAlerta(t,show,type="error"){const e=document.getElementById("recAlert");if(!e)return;e.hidden=!show;if(show){e.textContent=t;e.style.background=type==="ok"?"#ecfdf5":"#fff7ed";e.style.color=type==="ok"?"#166534":"#9a3412";e.style.borderColor=type==="ok"?"#a7f3d0":"#fed7aa";}}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
