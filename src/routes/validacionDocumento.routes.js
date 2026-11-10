const express = require("express");
const controller = require("../controllers/validacionDocumento.controller");
const { autenticarToken } = require("../middleware/auth.middleware");
const router = express.Router();

router.use(autenticarToken);
router.post("/:id", controller.validar);

module.exports = router;
