const express = require("express");
const controller = require("../controllers/carrera.controller");
const router = express.Router();

router.get("/", controller.listar);
router.get("/buscar", controller.buscar);

module.exports = router;
