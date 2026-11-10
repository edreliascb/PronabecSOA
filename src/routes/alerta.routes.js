/* =========================================================
   EDUPERÚ SOA
   ALERTA ROUTES
========================================================= */

const express =
    require("express");


const router =
    express.Router();


const alertaController =
    require(
        "../controllers/alerta.controller"
    );


const {
    autenticarToken
} =
    require(
        "../middleware/auth.middleware"
    );


/* =========================================================
   TODAS REQUIEREN JWT
========================================================= */

router.use(
    autenticarToken
);


/* =========================================================
   GET /api/alertas
========================================================= */

router.get(
    "/",
    alertaController.listarAlertas
);


/* =========================================================
   GET /api/alertas/:id
========================================================= */

router.get(
    "/:id",
    alertaController.obtenerAlerta
);


/* =========================================================
   POST /api/alertas
========================================================= */

router.post(
    "/",
    alertaController.crearAlerta
);


/* =========================================================
   PUT /api/alertas/:id
========================================================= */

router.put(
    "/:id",
    alertaController.actualizarAlerta
);


/* =========================================================
   PATCH /api/alertas/:id/estado
========================================================= */

router.patch(
    "/:id/estado",
    alertaController.cambiarEstado
);


/* =========================================================
   DELETE /api/alertas/:id
========================================================= */

router.delete(
    "/:id",
    alertaController.eliminarAlerta
);


/* =========================================================
   EXPORTAR
========================================================= */

module.exports =
    router;