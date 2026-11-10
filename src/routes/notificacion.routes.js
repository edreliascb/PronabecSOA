const express = require("express");
const controller = require("../controllers/notificacion.controller");
const { autenticarToken } = require("../middleware/auth.middleware");
const router = express.Router();

router.use(autenticarToken);
router.get("/", controller.listar);
router.post("/", controller.crear);
router.patch("/:id/leida", controller.marcarLeida);
router.delete("/:id", controller.eliminar);

module.exports = router;
