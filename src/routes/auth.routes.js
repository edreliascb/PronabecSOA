/* =========================================================
   EDUPERÚ SOA
   AUTH ROUTES + EMAIL VERIFICATION V1
========================================================= */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authEmailController = require("../controllers/authEmail.controller");
const { autenticarToken, autorizarRoles } = require("../middleware/auth.middleware");
const { exigirEmailVerificadoParaLogin } = require("../middleware/emailVerification.middleware");

function noCache(req, res, next) {
    res.set("Cache-Control", "no-store");
    res.set("Pragma", "no-cache");
    return next();
}

// Nuevas cuentas: registro con verificación de correo.
router.post("/register", noCache, authEmailController.registrar);

// Login normal, pero cuentas nuevas deben estar verificadas.
// Las cuentas existentes anteriores a esta mejora siguen funcionando.
router.post("/login", noCache, exigirEmailVerificadoParaLogin, authController.login);

router.post("/email/resend-verification", noCache, authEmailController.reenviar);
router.post("/email/verify", noCache, authEmailController.verificar);
router.get("/email/configuration", noCache, authEmailController.configuracion);
router.get("/email/status", noCache, autenticarToken, authEmailController.estado);

router.post("/password/forgot", noCache, authEmailController.olvidarPassword);
router.post("/password/reset", noCache, authEmailController.resetPassword);

router.get("/me", noCache, autenticarToken, authController.me);
router.get("/admin-test", noCache, autenticarToken, autorizarRoles("ADMINISTRADOR"), authController.adminTest);

module.exports = router;
