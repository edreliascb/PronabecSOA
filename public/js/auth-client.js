/* =========================================================
   EDUPERÚ
   CLIENTE GLOBAL DE AUTENTICACIÓN
========================================================= */

const EduPeruAuth = {

    tokenKey:
        "eduperu_token",

    userKey:
        "eduperu_usuario",


    /* =====================================================
       TOKEN
    ===================================================== */

    obtenerToken() {

        return localStorage.getItem(
            this.tokenKey
        );

    },


    guardarToken(
        token
    ) {

        if (!token) {

            return;

        }


        localStorage.setItem(
            this.tokenKey,
            token
        );

    },


    eliminarToken() {

        localStorage.removeItem(
            this.tokenKey
        );

    },


    /* =====================================================
       USUARIO
    ===================================================== */

    obtenerUsuarioLocal() {

        try {

            const datos =
                localStorage.getItem(
                    this.userKey
                );


            if (!datos) {

                return null;

            }


            return JSON.parse(
                datos
            );

        } catch {

            return null;

        }

    },


    guardarUsuario(
        usuario
    ) {

        if (!usuario) {

            return;

        }


        localStorage.setItem(

            this.userKey,

            JSON.stringify(
                usuario
            )

        );

    },


    eliminarUsuario() {

        localStorage.removeItem(
            this.userKey
        );

    },


    /* =====================================================
       SESIÓN
    ===================================================== */

    guardarSesion(
        resultado
    ) {

        if (
            resultado?.token
        ) {

            this.guardarToken(
                resultado.token
            );

        }


        if (
            resultado?.usuario
        ) {

            this.guardarUsuario(
                resultado.usuario
            );

        }


        document.dispatchEvent(
            new CustomEvent(
                "eduperu:sesion-actualizada"
            )
        );

    },


    cerrarSesion() {

        this.eliminarToken();

        this.eliminarUsuario();


        document.dispatchEvent(
            new CustomEvent(
                "eduperu:sesion-actualizada"
            )
        );

    },


    estaAutenticado() {

        return Boolean(
            this.obtenerToken()
        );

    },


    /* =====================================================
       REQUEST
    ===================================================== */

    async request(
        endpoint,
        options = {}
    ) {

        const headers = {

            "Content-Type":
                "application/json",

            ...(
                options.headers ||
                {}
            )

        };


        const token =
            this.obtenerToken();


        if (token) {

            headers.Authorization =
                `Bearer ${token}`;

        }


        const response =
            await fetch(
                endpoint,
                {
                    ...options,
                    headers
                }
            );


        let datos =
            {};


        try {

            datos =
                await response.json();

        } catch {

            datos =
                {};

        }


        if (
            !response.ok
        ) {

            const error =
                new Error(

                    datos?.mensaje ||
                    `Error HTTP ${response.status}`

                );


            error.status =
                response.status;


            throw error;

        }


        return datos;

    },


    /* =====================================================
       REGISTRO
    ===================================================== */

    async registrar(
        datos
    ) {

        return await this.request(

            "/api/auth/register",

            {

                method:
                    "POST",

                body:
                    JSON.stringify(
                        datos
                    )

            }

        );

    },


    /* =====================================================
       LOGIN
    ===================================================== */

    async login(
        email,
        password
    ) {

        return await this.request(

            "/api/auth/login",

            {

                method:
                    "POST",

                body:
                    JSON.stringify({

                        email,

                        password

                    })

            }

        );

    },


    /* =====================================================
       USUARIO ACTUAL
    ===================================================== */

    async obtenerUsuarioActual() {

        const respuesta =
            await this.request(
                "/api/auth/me"
            );


        const usuario =
            respuesta?.resultado ||
            null;


        if (usuario) {

            this.guardarUsuario(
                usuario
            );

        }


        return usuario;

    },


    /* =====================================================
       VALIDAR SESIÓN
    ===================================================== */

    async validarSesion() {

        if (
            !this.estaAutenticado()
        ) {

            return null;

        }


        try {

            return await this
                .obtenerUsuarioActual();

        } catch (error) {

            if (
                error.status === 401
            ) {

                this.cerrarSesion();

            }


            return null;

        }

    },


    /* =====================================================
       ROL
    ===================================================== */

    tieneRol(
        ...roles
    ) {

        const usuario =
            this.obtenerUsuarioLocal();


        if (!usuario) {

            return false;

        }


        return roles.includes(
            String(
                usuario.rol ||
                ""
            )
            .toUpperCase()
        );

    },


    esAdministrador() {

        return this.tieneRol(
            "ADMINISTRADOR"
        );

    },


    /* =====================================================
       VALIDACIÓN ADMIN EN BACKEND
    ===================================================== */

    async validarAdministrador() {

        try {

            const respuesta =
                await this.request(
                    "/api/auth/admin-test"
                );


            return Boolean(
                respuesta?.success
            );

        } catch {

            return false;

        }

    }

};


window.EduPeruAuth =
    EduPeruAuth;