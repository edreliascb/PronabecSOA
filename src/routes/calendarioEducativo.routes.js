const express = require("express");
const controller = require("../controllers/calendarioEducativo.controller");
const {
    autenticarToken
} = require("../middleware/auth.middleware");

const router = express.Router();

router.use(autenticarToken);

router.get(
    "/",
    controller.listar
);

module.exports = router;
