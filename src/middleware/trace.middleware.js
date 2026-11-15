const crypto = require("crypto");
const observabilidad = require("../services/observabilidad.service");

function generarTraceId() {
    return `edu-${Date.now().toString(36)}-${crypto.randomBytes(5).toString("hex")}`;
}

function traceMiddleware(req, res, next) {
    if (!String(req.originalUrl || "").startsWith("/api")) return next();

    const recibido = String(req.headers["x-trace-id"] || "").trim();
    const traceId = recibido && recibido.length <= 120 ? recibido : generarTraceId();
    const inicio = process.hrtime.bigint();

    req.traceId = traceId;
    res.setHeader("X-Trace-Id", traceId);

    res.on("finish", () => {
        const fin = process.hrtime.bigint();
        const duracionMs = Number(fin - inicio) / 1e6;
        const evento = {
            traceId,
            metodo: req.method,
            ruta: observabilidad.normalizarRuta(req),
            servicio: observabilidad.claveServicio(req),
            estadoHttp: res.statusCode,
            duracionMs: Number(duracionMs.toFixed(2)),
            fecha: new Date().toISOString(),
            error: res.statusCode >= 400
        };

        observabilidad.registrar(evento);

        console.log(
            `[TRACE ${traceId}] ${evento.metodo} ${req.originalUrl} -> ${evento.estadoHttp} | ${evento.duracionMs} ms`
        );
    });

    next();
}

module.exports = traceMiddleware;
