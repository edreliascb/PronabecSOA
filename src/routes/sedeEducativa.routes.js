const express = require("express");
const controller = require("../controllers/sedeEducativa.controller");
const router = express.Router();

router.get("/", controller.listar);
router.get("/:id", controller.obtenerPorId);

module.exports = router;
