const express = require("express");
const controller = require("../controllers/modalidadEstudio.controller");
const router = express.Router();

router.get("/", controller.listar);

module.exports = router;
