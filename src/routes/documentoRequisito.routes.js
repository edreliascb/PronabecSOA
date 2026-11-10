const express = require("express");

const router = express.Router();

const documentoController = require(
    "../controllers/documentoRequisito.controller"
);


// LISTAR DOCUMENTOS
router.get(
    "/",
    documentoController.listar
);


// BUSCAR DOCUMENTOS
router.get(
    "/buscar",
    documentoController.buscar
);


module.exports = router;
