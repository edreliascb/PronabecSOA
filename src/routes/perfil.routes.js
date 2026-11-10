/* =========================================================
   EDUPERÚ SOA
   PERFIL ROUTES
========================================================= */

const express =
    require(
        "express"
    );


const router =
    express.Router();


const perfilController =
    require(
        "../controllers/perfil.controller"
    );


const {
    autenticarToken
} =
    require(
        "../middleware/auth.middleware"
    );


/* =========================================================
   TODAS LAS RUTAS REQUIEREN LOGIN
========================================================= */

router.use(
    autenticarToken
);


/* =========================================================
   GET /api/perfil
========================================================= */

router.get(
    "/",
    perfilController.obtenerPerfil
);


/* =========================================================
   PUT /api/perfil
========================================================= */

router.put(
    "/",
    perfilController.guardarPerfil
);


/* =========================================================
   EXPORTAR
========================================================= */

module.exports =
    router;