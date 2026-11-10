const express =
    require("express");


const router =
    express.Router();


const estadisticaController =
    require(
        "../controllers/estadistica.controller"
    );


router.get(
    "/",
    estadisticaController.obtener
);


module.exports =
    router;
    