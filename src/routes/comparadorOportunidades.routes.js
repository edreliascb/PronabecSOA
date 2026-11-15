const express =
    require("express");

const router =
    express.Router();

const controller =
    require(
        "../controllers/comparadorOportunidades.controller"
    );


router.post(
    "/",
    controller.comparar
);


module.exports =
    router;
