const express = require("express");

const router = express.Router();

const postulacionController = require(
    "../controllers/postulacion.controller"
);


// LISTAR
router.get(
    "/",
    postulacionController.listar
);


// BUSCAR
router.get(
    "/buscar",
    postulacionController.buscar
);


module.exports = router;