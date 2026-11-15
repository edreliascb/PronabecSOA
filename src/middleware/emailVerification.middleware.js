const authEmailService = require("../services/authEmail.service");

async function exigirEmailVerificadoParaLogin(req, res, next) {
    try {
        await authEmailService.validarEmailAntesDeLogin(req.body?.email);
        return next();
    } catch (error) {
        return res.status(Number(error?.statusCode) || 500).json({
            success: false,
            servicio: "AuthenticationService",
            codigo: error?.codigo || null,
            mensaje: Number(error?.statusCode) >= 500
                ? "Ocurrió un error interno en el servicio de autenticación."
                : error.message
        });
    }
}

module.exports = { exigirEmailVerificadoParaLogin };
