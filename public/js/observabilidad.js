(function(){
  function token(){return localStorage.getItem("token")||localStorage.getItem("jwt")||localStorage.getItem("accessToken")||""}
  async function cargar(){
    const t=token();
    if(!t){alert("Inicia sesión primero para ver observabilidad.");return}
    const r=await fetch("/api/observabilidad/resumen",{headers:{Authorization:`Bearer ${t}`}});
    const j=await r.json();
    if(!r.ok||!j.success){throw new Error(j.mensaje||"No se pudo cargar observabilidad")}
    const x=j.resultado;
    document.getElementById("peticiones").textContent=x.totalPeticiones;
    document.getElementById("errores").textContent=x.totalErrores;
    document.getElementById("tasa").textContent=x.tasaErrorPorcentaje+"%";
    document.getElementById("servicios").textContent=x.serviciosObservados;
    document.getElementById("metricas").innerHTML=x.metricas.map(m=>`<tr><td>${m.servicio}</td><td>${m.peticiones}</td><td class="${m.errores?'bad':'ok'}">${m.errores}</td><td>${m.promedioMs} ms</td><td>${m.maximoMs} ms</td><td>${m.ultimoEstadoHttp??'-'}</td></tr>`).join("")||'<tr><td colspan="6">Aún no hay peticiones medidas.</td></tr>';
    document.getElementById("eventos").innerHTML=x.ultimosEventos.map(e=>`<tr><td class="trace">${e.traceId}</td><td>${e.metodo}</td><td>${e.ruta}</td><td>${e.estadoHttp}</td><td>${e.duracionMs} ms</td><td>${new Date(e.fecha).toLocaleString()}</td></tr>`).join("")||'<tr><td colspan="6">Aún no hay trazas.</td></tr>';
  }
  document.getElementById("recargar").addEventListener("click",()=>cargar().catch(e=>alert(e.message)));
  cargar().catch(e=>console.error(e));
})();
