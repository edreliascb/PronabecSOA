const express = require("express");
const controller = require("../controllers/busquedaAvanzada.controller");
const router = express.Router();

router.get("/", controller.buscar);

module.exports = router;
