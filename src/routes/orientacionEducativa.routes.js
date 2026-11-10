const express = require("express");
const controller = require("../controllers/orientacionEducativa.controller");
const {
    autenticarToken
} = require("../middleware/auth.middleware");

const router = express.Router();

router.use(autenticarToken);

router.get(
    "/",
    controller.obtener
);

module.exports = router;
