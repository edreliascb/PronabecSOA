/* =========================================================
   EDUPERÚ SOA
   HEALTH CHECK ROUTES
========================================================= */


const express =
    require(
        "express"
    );


const router =
    express.Router();


const healthCheckController =
    require(
        "../controllers/healthCheck.controller"
    );


router.get(
    "/",
    healthCheckController
        .obtenerEstado
);


module.exports =
    router;
