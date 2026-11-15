const express =
    require("express");

const controller =
    require("../controllers/evaluacionElegibilidad.controller");

const {
    autenticarToken
} =
    require("../middleware/auth.middleware");

const router =
    express.Router();


router.use(
    autenticarToken
);


router.post(
    "/evaluar",
    controller.evaluar
);


router.post(
    "/simular",
    controller.simular
);


module.exports =
    router;
