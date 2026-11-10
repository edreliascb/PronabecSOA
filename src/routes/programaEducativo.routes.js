const express = require("express");
const controller = require("../controllers/programaEducativo.controller");
const router = express.Router();

router.get("/", controller.listar);
router.get("/:id", controller.obtenerPorId);

module.exports = router;
