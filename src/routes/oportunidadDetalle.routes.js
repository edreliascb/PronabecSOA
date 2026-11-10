const express =
    require("express");


const router =
    express.Router();


const oportunidadDetalleController =
    require(
        "../controllers/oportunidadDetalle.controller"
    );


router.get(
    "/:indice",
    oportunidadDetalleController.obtener
);


module.exports =
    router;