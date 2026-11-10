const express = require("express");
const controller = require("../controllers/beneficio.controller");
const router = express.Router();

router.get("/", controller.listar);
router.get("/oportunidad/:id", controller.porOportunidad);

module.exports = router;
