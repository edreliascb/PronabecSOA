/* =========================================================
   EDUPERÚ SOA - RESILIENCIA HTTP
   Timeout + Retry + Circuit Breaker
========================================================= */

const estados = new Map();

function obtenerEstado(nombre) {
    if (!estados.has(nombre)) {
        estados.set(nombre, {
            estado: "CERRADO",
            fallosConsecutivos: 0,
            abiertoHasta: 0,
            ultimaFalla: null,
            ultimoExito: null
        });
    }
    return estados.get(nombre);
}

function errorCircuitoAbierto(nombre, estado) {
    const error = new Error(`Circuit breaker ${nombre} abierto temporalmente.`);
    error.code = "CIRCUIT_OPEN";
    error.codigoTecnico = "CIRCUIT_OPEN";
    error.reintentarEnMs = Math.max(0, estado.abiertoHasta - Date.now());
    return error;
}

function dormir(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function esErrorTransitorio(error) {
    const codigo = error?.codigoTecnico || error?.code || error?.cause?.code;
    const status = error?.response?.status || error?.status;

    return [
        "ENOTFOUND", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET",
        "ECONNABORTED", "ETIMEDOUT", "EPIPE"
    ].includes(codigo) || status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 599);
}

async function conTimeout(promesa, timeoutMs, nombre) {
    let temporizador;
    try {
        return await Promise.race([
            Promise.resolve().then(() => promesa()),
            new Promise((_, reject) => {
                temporizador = setTimeout(() => {
                    const error = new Error(`Timeout de ${timeoutMs} ms en ${nombre}.`);
                    error.code = "ETIMEDOUT";
                    error.codigoTecnico = "ETIMEDOUT";
                    reject(error);
                }, timeoutMs);
            })
        ]);
    } finally {
        if (temporizador) clearTimeout(temporizador);
    }
}

async function ejecutarConResiliencia(nombre, operacion, opciones = {}) {
    const {
        timeoutMs = 7000,
        reintentos = 2,
        esperaBaseMs = 250,
        umbralFallos = 3,
        tiempoAbiertoMs = 60000,
        reintentarSi = esErrorTransitorio
    } = opciones;

    const estado = obtenerEstado(nombre);
    const ahora = Date.now();

    if (estado.estado === "ABIERTO") {
        if (ahora < estado.abiertoHasta) {
            throw errorCircuitoAbierto(nombre, estado);
        }
        estado.estado = "SEMI_ABIERTO";
    }

    let ultimoError;

    for (let intento = 0; intento <= reintentos; intento += 1) {
        try {
            const resultado = await conTimeout(operacion, timeoutMs, nombre);
            estado.estado = "CERRADO";
            estado.fallosConsecutivos = 0;
            estado.abiertoHasta = 0;
            estado.ultimoExito = new Date().toISOString();
            return resultado;
        } catch (error) {
            ultimoError = error;
            const transitorio = reintentarSi(error);

            if (!transitorio || intento >= reintentos) break;
            await dormir(esperaBaseMs * Math.pow(2, intento));
        }
    }

    estado.fallosConsecutivos += 1;
    estado.ultimaFalla = {
        fecha: new Date().toISOString(),
        mensaje: ultimoError?.message || "Error desconocido",
        codigo: ultimoError?.codigoTecnico || ultimoError?.code || null
    };

    if (estado.fallosConsecutivos >= umbralFallos) {
        estado.estado = "ABIERTO";
        estado.abiertoHasta = Date.now() + tiempoAbiertoMs;
    } else if (estado.estado === "SEMI_ABIERTO") {
        estado.estado = "ABIERTO";
        estado.abiertoHasta = Date.now() + tiempoAbiertoMs;
    } else {
        estado.estado = "CERRADO";
    }

    throw ultimoError;
}

function obtenerEstadoCircuito(nombre) {
    const e = obtenerEstado(nombre);
    return {
        nombre,
        estado: e.estado,
        fallosConsecutivos: e.fallosConsecutivos,
        abiertoHasta: e.abiertoHasta ? new Date(e.abiertoHasta).toISOString() : null,
        ultimaFalla: e.ultimaFalla,
        ultimoExito: e.ultimoExito
    };
}

function reiniciarCircuito(nombre) {
    estados.delete(nombre);
    return obtenerEstadoCircuito(nombre);
}

module.exports = {
    ejecutarConResiliencia,
    esErrorTransitorio,
    obtenerEstadoCircuito,
    reiniciarCircuito
};
