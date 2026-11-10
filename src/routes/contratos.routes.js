const express =
    require("express");


const router =
    express.Router();


const contratosController =
    require(
        "../controllers/contratos.controller"
    );


router.get(
    "/",
    contratosController.listar
);


module.exports =
    router;