const express = require("express");
const controller = require("../controllers/exportacion.controller");
const {
    autenticarToken,
    autorizarRoles
} = require("../middleware/auth.middleware");

const router = express.Router();

router.use(autenticarToken);

router.get(
    "/busqueda",
    controller.busqueda
);

router.get(
    "/reporte-resumen",
    autorizarRoles("ADMINISTRADOR"),
    controller.reporteResumen
);

module.exports = router;
