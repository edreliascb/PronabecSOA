const express = require("express");

const router = express.Router();

const consultaController = require(
    "../controllers/consultaEducativa.controller"
);


// CONSULTA ORQUESTADA ORIGINAL
router.get(
    "/",
    consultaController.consultar
);


// DEMOSTRACIÓN TÉCNICA DE ORQUESTACIÓN
router.get(
    "/orquestacion",
    consultaController.orquestar
);


module.exports = router;
