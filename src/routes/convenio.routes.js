const express = require("express");

const router = express.Router();

const convenioController = require(
    "../controllers/convenio.controller"
);


// LISTAR CONVENIOS
router.get(
    "/",
    convenioController.listar
);


// BUSCAR CONVENIOS
router.get(
    "/buscar",
    convenioController.buscar
);


module.exports = router;