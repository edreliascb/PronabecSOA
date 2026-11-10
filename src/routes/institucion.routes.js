const express =
    require("express");


const router =
    express.Router();


const institucionController =
    require(
        "../controllers/institucion.controller"
    );


// LISTADO
router.get(
    "/",
    institucionController.listar
);


// BÚSQUEDA
router.get(
    "/buscar",
    institucionController.buscar
);


// DETALLE
router.get(
    "/:id",
    institucionController.obtener
);


module.exports =
    router;