const express = require("express");

const router = express.Router();

const consultaController = require(
    "../controllers/consultaEducativa.controller"
);


// CONSULTA ORQUESTADA
router.get(
    "/",
    consultaController.consultar
);


module.exports = router;