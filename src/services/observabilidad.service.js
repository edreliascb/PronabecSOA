/* =========================================================
   EDUPERÚ SOA - OBSERVABILIDAD EN MEMORIA
   No crea tablas ni modifica los 40 servicios empresariales.
========================================================= */

const MAX_EVENTOS = 250;
const eventos = [];
const metricas = new Map();

function normalizarRuta(req) {
    const ruta = String(req.baseUrl || req.path || req.originalUrl || "/").split("?")[0];
    return ruta || "/";
}

function claveServicio(req) {
    const original = String(req.originalUrl || "").split("?")[0];
    const match = original.match(/^\/api\/([^/]+)/i);
    return match ? match[1] : "web";
}

function registrar({ traceId, metodo, ruta, servicio, estadoHttp, duracionMs, fecha, error = false }) {
    const evento = {
        traceId,
        metodo,
        ruta,
        servicio,
        estadoHttp,
        duracionMs,
        error,
        fecha
    };

    eventos.unshift(evento);
    if (eventos.length > MAX_EVENTOS) eventos.length = MAX_EVENTOS;

    const actual = metricas.get(servicio) || {
        servicio,
        peticiones: 0,
        errores: 0,
        duracionTotalMs: 0,
        duracionMaxMs: 0,
        ultimaEjecucion: null,
        ultimoEstadoHttp: null
    };

    actual.peticiones += 1;
    actual.errores += error ? 1 : 0;
    actual.duracionTotalMs += duracionMs;
    actual.duracionMaxMs = Math.max(actual.duracionMaxMs, duracionMs);
    actual.ultimaEjecucion = fecha;
    actual.ultimoEstadoHttp = estadoHttp;
    metricas.set(servicio, actual);
}

function obtenerResumen() {
    const lista = [...metricas.values()]
        .map((m) => ({
            servicio: m.servicio,
            peticiones: m.peticiones,
            errores: m.errores,
            tasaErrorPorcentaje: m.peticiones ? Number(((m.errores / m.peticiones) * 100).toFixed(1)) : 0,
            promedioMs: m.peticiones ? Math.round(m.duracionTotalMs / m.peticiones) : 0,
            maximoMs: m.duracionMaxMs,
            ultimaEjecucion: m.ultimaEjecucion,
            ultimoEstadoHttp: m.ultimoEstadoHttp
        }))
        .sort((a, b) => b.peticiones - a.peticiones);

    const totalPeticiones = lista.reduce((s, x) => s + x.peticiones, 0);
    const totalErrores = lista.reduce((s, x) => s + x.errores, 0);

    return {
        servicio: "ObservabilidadTecnica",
        tipo: "Cross-cutting concern / monitoreo",
        estado: "OPERATIVO",
        almacenamiento: "MEMORIA",
        nota: "Las métricas se reinician cuando el servidor se reinicia.",
        fecha: new Date().toISOString(),
        totalPeticiones,
        totalErrores,
        tasaErrorPorcentaje: totalPeticiones ? Number(((totalErrores / totalPeticiones) * 100).toFixed(1)) : 0,
        serviciosObservados: lista.length,
        metricas: lista,
        ultimosEventos: eventos.slice(0, 30)
    };
}

function obtenerTraza(traceId) {
    return eventos.filter((e) => e.traceId === traceId);
}

function limpiar() {
    eventos.length = 0;
    metricas.clear();
}

module.exports = {
    normalizarRuta,
    claveServicio,
    registrar,
    obtenerResumen,
    obtenerTraza,
    limpiar
};
