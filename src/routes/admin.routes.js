/* =========================================================
   EDUPERÚ SOA
   ADMIN ROUTES
========================================================= */

const express =
    require("express");


const router =
    express.Router();


const adminController =
    require(
        "../controllers/admin.controller"
    );


const {
    autenticarToken,
    autorizarRoles
} =
    require(
        "../middleware/auth.middleware"
    );


/* =========================================================
   TODAS LAS RUTAS ADMIN REQUIEREN:
   1. JWT VÁLIDO
   2. ROL ADMINISTRADOR
========================================================= */

router.use(
    autenticarToken
);


router.use(
    autorizarRoles(
        "ADMINISTRADOR"
    )
);


/* =========================================================
   GET /api/admin/resumen
========================================================= */

router.get(
    "/resumen",
    adminController.obtenerResumen
);


/* =========================================================
   GET /api/admin/usuarios
========================================================= */

router.get(
    "/usuarios",
    adminController.listarUsuarios
);


/* =========================================================
   PATCH /api/admin/usuarios/:id/estado
========================================================= */

router.patch(
    "/usuarios/:id/estado",
    adminController.cambiarEstadoUsuario
);


module.exports =
    router;
