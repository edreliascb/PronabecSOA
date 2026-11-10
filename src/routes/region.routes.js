const express =
    require("express");


const router =
    express.Router();


const regionController =
    require(
        "../controllers/region.controller"
    );


// ======================================================
// LISTAR
// ======================================================

router.get(
    "/",
    regionController.listar
);


// ======================================================
// BUSCAR
// ======================================================

router.get(
    "/buscar",
    regionController.buscar
);


// ======================================================
// DETALLE
// ======================================================

router.get(
    "/:codigo",
    regionController.obtener
);


module.exports =
    router;