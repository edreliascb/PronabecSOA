const express = require("express");
const controller = require("../controllers/reporte.controller");
const { autenticarToken, autorizarRoles } = require("../middleware/auth.middleware");
const router = express.Router();

router.use(autenticarToken);
router.use(autorizarRoles("ADMINISTRADOR"));

router.get("/resumen", controller.resumen);
router.get("/usuarios", controller.usuarios);

module.exports = router;
