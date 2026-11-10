const express =
    require("express");


const router =
    express.Router();


const ubigeoController =
    require(
        "../controllers/ubigeo.controller"
    );


// ======================================================
// RESUMEN
// ======================================================

router.get(
    "/",
    ubigeoController.resumen
);


// ======================================================
// DEPARTAMENTOS
// ======================================================

router.get(
    "/departamentos",
    ubigeoController.departamentos
);


// ======================================================
// PROVINCIAS DE UN DEPARTAMENTO
// ======================================================

router.get(
    "/departamentos/:departamento/provincias",
    ubigeoController.provincias
);


// ======================================================
// DISTRITOS DE UNA PROVINCIA
// ======================================================

router.get(
    "/provincias/:provincia/distritos",
    ubigeoController.distritos
);


// ======================================================
// BÚSQUEDA
// ======================================================

router.get(
    "/buscar",
    ubigeoController.buscar
);


// ======================================================
// DETALLE POR CÓDIGO
// ======================================================

router.get(
    "/:codigo",
    ubigeoController.obtener
);


module.exports =
    router;