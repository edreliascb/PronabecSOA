const express = require("express");
const router = express.Router();
const controller = require("../controllers/observabilidad.controller");
const { autenticarToken } = require("../middleware/auth.middleware");

router.get("/resumen", autenticarToken, controller.resumen);
router.get("/trazas/:traceId", autenticarToken, controller.traza);

module.exports = router;
