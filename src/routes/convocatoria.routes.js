const express = require("express");

const router = express.Router();

const convocatoriaController = require(
    "../controllers/convocatoria.controller"
);


// Listar convocatorias
router.get(
    "/",
    convocatoriaController.listar
);


// Buscar convocatorias
router.get(
    "/buscar",
    convocatoriaController.buscar
);


module.exports = router;