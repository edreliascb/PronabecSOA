const express = require("express");
const controller = require("../controllers/documentoUsuario.controller");
const { autenticarToken } = require("../middleware/auth.middleware");
const router = express.Router();

router.use(autenticarToken);
router.get("/", controller.listar);
router.post("/", controller.registrar);
router.delete("/:id", controller.eliminar);

module.exports = router;
