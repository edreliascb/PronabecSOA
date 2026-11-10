const express = require("express");
const controller = require("../controllers/historialConsulta.controller");
const { autenticarToken } = require("../middleware/auth.middleware");
const router = express.Router();

router.use(autenticarToken);
router.get("/", controller.listar);
router.post("/", controller.registrar);
router.delete("/", controller.limpiar);

module.exports = router;
