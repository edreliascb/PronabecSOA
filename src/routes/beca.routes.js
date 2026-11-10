const express = require("express");
const controller = require("../controllers/beca.controller");
const router = express.Router();

router.get("/", controller.listar);
router.get("/buscar", controller.buscar);
router.get("/:id", controller.obtenerPorId);

module.exports = router;
