const express = require("express");
const controller = require("../controllers/configuracion.controller");
const {
    autenticarToken,
    autorizarRoles
} = require("../middleware/auth.middleware");

const router = express.Router();

router.use(autenticarToken);
router.use(autorizarRoles("ADMINISTRADOR"));

router.get(
    "/",
    controller.listar
);

router.put(
    "/:clave",
    controller.actualizar
);

module.exports = router;
