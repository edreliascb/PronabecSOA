/* =========================================================
   EDUPERÚ SOA
   FAVORITO ROUTES
========================================================= */

const express =
    require(
        "express"
    );


const router =
    express.Router();


const favoritoController =
    require(
        "../controllers/favorito.controller"
    );


const {
    autenticarToken
} =
    require(
        "../middleware/auth.middleware"
    );


/* =========================================================
   TODAS LAS RUTAS REQUIEREN JWT
========================================================= */

router.use(
    autenticarToken
);


/* =========================================================
   GET /api/favoritos
========================================================= */

router.get(
    "/",
    favoritoController.listarFavoritos
);


/* =========================================================
   GET /api/favoritos/:id
========================================================= */

router.get(
    "/:id",
    favoritoController.obtenerFavorito
);


/* =========================================================
   POST /api/favoritos
========================================================= */

router.post(
    "/",
    favoritoController.crearFavorito
);


/* =========================================================
   DELETE /api/favoritos/recurso/:tipo/:recursoId
========================================================= */

router.delete(
    "/recurso/:tipo/:recursoId",
    favoritoController.eliminarPorRecurso
);


/* =========================================================
   DELETE /api/favoritos/:id
========================================================= */

router.delete(
    "/:id",
    favoritoController.eliminarFavorito
);


/* =========================================================
   EXPORTAR
========================================================= */

module.exports =
    router;