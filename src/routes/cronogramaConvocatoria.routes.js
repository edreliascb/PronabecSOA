const express = require("express");
const controller = require("../controllers/cronogramaConvocatoria.controller");
const router = express.Router();

router.get("/", controller.listar);
router.get("/convocatoria/:id", controller.porConvocatoria);

module.exports = router;
