const express = require("express");
const controller = require("../controllers/hermes.controller");
const { autenticarToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(autenticarToken);

router.get("/estado", controller.estado);
router.post("/demo", controller.demo);

module.exports = router;
