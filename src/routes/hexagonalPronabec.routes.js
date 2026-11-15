"use strict";

const express = require("express");
const router = express.Router();
const controller = require("../controllers/hexagonalPronabec.controller");
const { autenticarToken } = require("../middleware/auth.middleware");

router.use(autenticarToken);
router.get("/recursos", controller.recursos);
router.get("/:recurso", controller.consultar);

module.exports = router;
