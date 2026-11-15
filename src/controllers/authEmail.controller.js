const authEmailService = require("../services/authEmail.service");
const emailService = require("../services/email.service");

function ipCliente(req) {
    return req.ip || req.socket?.remoteAddress || null;
}

function responderError(res, error) {
    const status = Number(error?.statusCode) || 500;
    if (status >= 500) console.error("[AuthEmailController]", error);
    return res.status(status).json({
        success: false,
        servicio: "AuthEmailService",
        codigo: error?.codigo || null,
        mensaje: status >= 500 ? "No fue posible completar la operación." : error.message
    });
}

async function registrar(req, res) {
    try {
        const resultado = await authEmailService.registrarConVerificacion(req.body, { ip: ipCliente(req) });
        return res.status(201).json({
            success: true,
            servicio: "AuthEmailService",
            mensaje: "Cuenta creada. Revisa tu correo para verificarla antes de iniciar sesión.",
            resultado
        });
    } catch (error) { return responderError(res, error); }
}

async function reenviar(req, res) {
    try {
        const resultado = await authEmailService.reenviarVerificacion(req.body?.email, { ip: ipCliente(req) });
        return res.json({ success: true, servicio: "AuthEmailService", ...resultado });
    } catch (error) { return responderError(res, error); }
}

async function verificar(req, res) {
    try {
        const resultado = await authEmailService.verificarEmail(req.body?.token);
        return res.json({ success: true, servicio: "AuthEmailService", mensaje: "Correo verificado correctamente.", resultado });
    } catch (error) { return responderError(res, error); }
}

async function olvidarPassword(req, res) {
    try {
        const resultado = await authEmailService.solicitarRecuperacion(req.body?.email, { ip: ipCliente(req) });
        return res.json({ success: true, servicio: "AuthEmailService", ...resultado });
    } catch (error) { return responderError(res, error); }
}

async function resetPassword(req, res) {
    try {
        const resultado = await authEmailService.restablecerPassword(req.body?.token, req.body?.password);
        return res.json({ success: true, servicio: "AuthEmailService", mensaje: "Contraseña actualizada correctamente.", resultado });
    } catch (error) { return responderError(res, error); }
}

async function estado(req, res) {
    try {
        const resultado = await authEmailService.estadoEmail(req.usuario.id);
        return res.json({ success: true, servicio: "AuthEmailService", resultado });
    } catch (error) { return responderError(res, error); }
}

function configuracion(req, res) {
    return res.json({ success: true, servicio: "EmailService", resultado: emailService.obtenerEstadoConfiguracion() });
}

module.exports = { registrar, reenviar, verificar, olvidarPassword, resetPassword, estado, configuracion };
