/* =========================================================
   EDUPERÚ SOA
   AUTH ROUTES - SEGURIDAD FINAL
========================================================= */

const express =
    require(
        "express"
    );


const router =
    express.Router();


const authController =
    require(
        "../controllers/auth.controller"
    );


const {

    autenticarToken,

    autorizarRoles

} =
    require(
        "../middleware/auth.middleware"
    );


/* =========================================================
   CABECERAS PARA AUTH
========================================================= */

function noCache(
    req,
    res,
    next
) {

    res.set(
        "Cache-Control",
        "no-store"
    );

    res.set(
        "Pragma",
        "no-cache"
    );


    return next();

}


/* =========================================================
   REGISTER
========================================================= */

router.post(
    "/register",
    noCache,
    authController.registrar
);


/* =========================================================
   LOGIN
========================================================= */

router.post(
    "/login",
    noCache,
    authController.login
);


/* =========================================================
   USUARIO ACTUAL
========================================================= */

router.get(
    "/me",
    noCache,
    autenticarToken,
    authController.me
);


/* =========================================================
   PRUEBA ADMINISTRADOR
========================================================= */

router.get(
    "/admin-test",
    noCache,
    autenticarToken,
    autorizarRoles(
        "ADMINISTRADOR"
    ),
    authController.adminTest
);


/* =========================================================
   EXPORTAR
========================================================= */

module.exports =
    router;
