/* =========================================================
   EDUPERÚ SOA
   OPENAPI 3.0 / SWAGGER CONFIGURATION
   40 SERVICIOS EMPRESARIALES + JWT
========================================================= */


const swaggerSpec = {


    /* =====================================================
       INFORMACIÓN GENERAL
    ===================================================== */

    openapi:
        "3.0.3",


    info: {

        title:
            "EduPerú SOA API",

        version:
            "1.9.0",

        description:
            `
API REST de EduPerú basada en Arquitectura Orientada
a Servicios (SOA).

La solución registra e implementa 40 servicios empresariales
organizados en servicios de entidad, tarea, utilidad,
composición, catálogo, seguridad, analítica y administración.

La plataforma integra:

- autenticación y autorización JWT;
- Microsoft SQL Server;
- perfil, favoritos y alertas;
- convocatorias y oportunidades educativas;
- becas, carreras, programas, modalidades y sedes;
- cronogramas y requisitos;
- preevaluación de elegibilidad;
- seguimiento de postulaciones e historial;
- recomendaciones y orientación educativa;
- documentos del usuario y validación;
- búsqueda avanzada;
- notificaciones;
- reportes y exportación;
- auditoría y configuración;
- calendario educativo;
- monitoreo y contratos SOA.

SERVICIOS EMPRESARIALES REGISTRADOS: 40.
SERVICIOS IMPLEMENTADOS: 40.

FUENTES:

Los servicios que consumen información de PRONABEC utilizan
fuentes oficiales disponibles. Si una fuente oficial no
publica un dato estructurado o no se encuentra disponible,
EduPerú devuelve una respuesta vacía o no determinable y no
fabrica información.

La evaluación de elegibilidad y la orientación son funciones
informativas del sistema. La decisión oficial corresponde a
PRONABEC.

Para probar rutas protegidas:

1. Ejecuta POST /api/auth/login.
2. Copia únicamente el token JWT recibido.
3. Pulsa "Authorize" en Swagger.
4. Pega el token.
5. Ejecuta las rutas protegidas.
            `.trim(),

        contact: {

            name:
                "EduPerú SOA"

        }

    },


    /* =====================================================
       SERVIDOR
    ===================================================== */

    servers: [

        {

            url:
                "/",

            description:
                "Servidor actual de EduPerú"

        }

    ],


    /* =====================================================
       TAGS
    ===================================================== */

    tags: [

        {
            name:
                "Sistema",
            description:
                "Información general y monitoreo."
        },

        {
            name:
                "Base de datos",
            description:
                "Estado de Microsoft SQL Server."
        },

        {
            name:
                "Autenticación",
            description:
                "Registro, inicio de sesión y validación de JWT."
        },

        {
            name:
                "Perfil",
            description:
                "Perfil personal del usuario autenticado."
        },

        {
            name:
                "Favoritos",
            description:
                "Favoritos persistidos en SQL Server por usuario."
        },

        {
            name:
                "Alertas",
            description:
                "Alertas educativas persistidas en SQL Server."
        },

        {
            name:
                "Administración",
            description:
                "Operaciones exclusivas para usuarios con rol ADMINISTRADOR."
        },

        {
            name:
                "Convocatorias",
            description:
                "Oportunidades y convocatorias educativas."
        },

        {
            name:
                "Postulaciones",
            description:
                "Registros relacionados con postulaciones."
        },

        {
            name:
                "Documentos",
            description:
                "Documentos y requisitos."
        },

        {
            name:
                "Convenios",
            description:
                "Convenios educativos."
        },

        {
            name:
                "Instituciones",
            description:
                "Catálogo institucional compuesto."
        },

        {
            name:
                "Regiones",
            description:
                "Catálogo departamental."
        },

        {
            name:
                "Ubigeo",
            description:
                "Catálogo territorial de cobertura parcial."
        },

        {
            name:
                "Composición",
            description:
                "Servicios que componen información de otros servicios."
        },

        {
            name:
                "Analítica",
            description:
                "Indicadores calculados sobre registros recuperados."
        },

        {
            name:
                "Becas",
            description:
                "Catálogo de becas derivado de información oficial disponible."
        },

        {
            name:
                "Programas educativos",
            description:
                "Programas y carreras educativas disponibles en fuentes oficiales."
        },

        {
            name:
                "Carreras",
            description:
                "Catálogo de carreras elegibles."
        },

        {
            name:
                "Modalidades",
            description:
                "Modalidades de estudio detectadas en los datos oficiales."
        },

        {
            name:
                "Sedes educativas",
            description:
                "Sedes educativas asociadas a carreras y programas."
        },

        {
            name:
                "Beneficios",
            description:
                "Beneficios explícitamente disponibles en las fuentes oficiales."
        },

        {
            name:
                "Cronogramas",
            description:
                "Fechas y etapas de convocatorias."
        },

        {
            name:
                "Elegibilidad",
            description:
                "Requisitos y preevaluación informativa de elegibilidad."
        },

        {
            name:
                "Seguimiento",
            description:
                "Seguimiento persistente de postulaciones."
        },

        {
            name:
                "Historial",
            description:
                "Historial de consultas del usuario autenticado."
        },

        {
            name:
                "Recomendaciones",
            description:
                "Recomendaciones educativas por coincidencia de perfil."
        },

        {
            name:
                "Búsqueda avanzada",
            description:
                "Búsqueda compuesta sobre catálogos y convocatorias."
        },

        {
            name:
                "Notificaciones",
            description:
                "Notificaciones persistidas por usuario."
        },

        {
            name:
                "Documentos del usuario",
            description:
                "Registro y administración de metadatos de documentos."
        },

        {
            name:
                "Validación documental",
            description:
                "Validación de consistencia de metadatos documentales."
        },

        {
            name:
                "Reportes",
            description:
                "Reportes administrativos y analíticos."
        },

        {
            name:
                "Exportación",
            description:
                "Exportación de resultados en JSON o CSV."
        },

        {
            name:
                "Auditoría",
            description:
                "Registro y consulta de eventos de auditoría."
        },

        {
            name:
                "Configuración",
            description:
                "Configuración funcional no sensible de la plataforma."
        },

        {
            name:
                "Calendario educativo",
            description:
                "Calendario compuesto de cronogramas, alertas y seguimientos."
        },

        {
            name:
                "Orientación educativa",
            description:
                "Orientación informativa compuesta a partir del perfil y fuentes disponibles."
        },

        {
            name:
                "Arquitectura SOA",
            description:
                "Inventario y contratos de servicios."
        }

    ],


    /* =====================================================
       PATHS
    ===================================================== */

    paths: {


        /* =================================================
           API PRINCIPAL
        ================================================= */

        "/api": {

            get: {

                tags:
                    ["Sistema"],

                summary:
                    "Información general de EduPerú",

                description:
                    "Devuelve información general, versión, arquitectura y catálogo de endpoints.",

                responses: {

                    "200":
                        respuestaJson(
                            "Información general de la API."
                        )

                }

            }

        },


        /* =================================================
           HEALTH
        ================================================= */

        "/api/health": {

            get: {

                tags:
                    ["Sistema"],

                summary:
                    "Comprobar estado del sistema",

                description:
                    "Ejecuta HealthCheckService y devuelve disponibilidad, modo de operación y latencia.",

                responses: {

                    "200": {

                        description:
                            "Estado actual de EduPerú.",

                        content: {

                            "application/json": {

                                schema: {

                                    $ref:
                                        "#/components/schemas/HealthResponse"

                                }

                            }

                        }

                    },

                    "500":
                        respuestaError(
                            "Error durante la comprobación."
                        )

                }

            }

        },


        /* =================================================
           DATABASE SERVICE
        ================================================= */

        "/api/database/health": {

            get: {

                tags:
                    ["Base de datos"],

                summary:
                    "Comprobar conexión con SQL Server",

                description:
                    "Valida la conexión de DatabaseService con EduPeruDB.",

                responses: {

                    "200":
                        respuestaJson(
                            "SQL Server conectado correctamente."
                        ),

                    "503":
                        respuestaError(
                            "SQL Server no disponible."
                        )

                }

            }

        },


        /* =================================================
           AUTHENTICATION SERVICE
        ================================================= */

        "/api/auth/register": {

            post: {

                tags:
                    ["Autenticación"],

                summary:
                    "Registrar usuario",

                description:
                    "Crea una nueva cuenta de usuario en SQL Server.",

                requestBody: {

                    required:
                        true,

                    content: {

                        "application/json": {

                            schema: {

                                $ref:
                                    "#/components/schemas/RegisterRequest"

                            }

                        }

                    }

                },

                responses: {

                    "201":
                        respuestaConSchema(
                            "Usuario registrado correctamente.",
                            "#/components/schemas/AuthResponse"
                        ),

                    "400":
                        respuestaError(
                            "Datos inválidos o incompletos."
                        ),

                    "409":
                        respuestaError(
                            "El correo ya se encuentra registrado."
                        ),

                    "500":
                        respuestaError(
                            "Error interno durante el registro."
                        )

                }

            }

        },


        "/api/auth/login": {

            post: {

                tags:
                    ["Autenticación"],

                summary:
                    "Iniciar sesión",

                description:
                    "Valida correo y contraseña y devuelve un JWT.",

                requestBody: {

                    required:
                        true,

                    content: {

                        "application/json": {

                            schema: {

                                $ref:
                                    "#/components/schemas/LoginRequest"

                            }

                        }

                    }

                },

                responses: {

                    "200":
                        respuestaConSchema(
                            "Inicio de sesión correcto.",
                            "#/components/schemas/AuthResponse"
                        ),

                    "400":
                        respuestaError(
                            "Solicitud inválida."
                        ),

                    "401":
                        respuestaError(
                            "Credenciales incorrectas."
                        )

                }

            }

        },


        "/api/auth/me": {

            get: {

                tags:
                    ["Autenticación"],

                summary:
                    "Consultar usuario autenticado",

                security:
                    seguridadJwt(),

                responses: {

                    "200":
                        respuestaConSchema(
                            "Usuario autenticado.",
                            "#/components/schemas/UserResponse"
                        ),

                    "401":
                        respuestaError(
                            "Token ausente, inválido o vencido."
                        )

                }

            }

        },


        "/api/auth/admin-test": {

            get: {

                tags:
                    ["Autenticación"],

                summary:
                    "Probar autorización de administrador",

                description:
                    "Endpoint de prueba protegido por JWT y rol ADMINISTRADOR.",

                security:
                    seguridadJwt(),

                responses: {

                    "200":
                        respuestaJson(
                            "Acceso administrativo autorizado."
                        ),

                    "401":
                        respuestaError(
                            "JWT inválido o ausente."
                        ),

                    "403":
                        respuestaError(
                            "Rol no autorizado."
                        )

                }

            }

        },


        /* =================================================
           PERFIL USUARIO
        ================================================= */

        "/api/perfil": {

            get: {

                tags:
                    ["Perfil"],

                summary:
                    "Consultar mi perfil",

                security:
                    seguridadJwt(),

                responses: {

                    "200":
                        respuestaConSchema(
                            "Perfil del usuario.",
                            "#/components/schemas/ProfileResponse"
                        ),

                    "401":
                        respuestaError(
                            "No autenticado."
                        )

                }

            },


            put: {

                tags:
                    ["Perfil"],

                summary:
                    "Actualizar mi perfil",

                security:
                    seguridadJwt(),

                requestBody: {

                    required:
                        true,

                    content: {

                        "application/json": {

                            schema: {

                                $ref:
                                    "#/components/schemas/ProfileUpdateRequest"

                            }

                        }

                    }

                },

                responses: {

                    "200":
                        respuestaConSchema(
                            "Perfil actualizado.",
                            "#/components/schemas/ProfileResponse"
                        ),

                    "400":
                        respuestaError(
                            "Datos de perfil inválidos."
                        ),

                    "401":
                        respuestaError(
                            "No autenticado."
                        )

                }

            }

        },


        /* =================================================
           FAVORITOS
        ================================================= */

        "/api/favoritos": {

            get: {

                tags:
                    ["Favoritos"],

                summary:
                    "Listar mis favoritos",

                security:
                    seguridadJwt(),

                responses: {

                    "200":
                        respuestaJson(
                            "Favoritos del usuario autenticado."
                        ),

                    "401":
                        respuestaError(
                            "No autenticado."
                        )

                }

            },


            post: {

                tags:
                    ["Favoritos"],

                summary:
                    "Agregar favorito",

                security:
                    seguridadJwt(),

                requestBody: {

                    required:
                        true,

                    content: {

                        "application/json": {

                            schema: {

                                $ref:
                                    "#/components/schemas/FavoriteRequest"

                            }

                        }

                    }

                },

                responses: {

                    "201":
                        respuestaJson(
                            "Favorito creado."
                        ),

                    "200":
                        respuestaJson(
                            "Favorito ya existente o procesado."
                        ),

                    "400":
                        respuestaError(
                            "Datos inválidos."
                        ),

                    "401":
                        respuestaError(
                            "No autenticado."
                        )

                }

            }

        },


        "/api/favoritos/{id}": {

            get: {

                tags:
                    ["Favoritos"],

                summary:
                    "Consultar favorito por ID",

                security:
                    seguridadJwt(),

                parameters:
                    [parametroId("id", "ID del favorito")],

                responses: {

                    "200":
                        respuestaJson(
                            "Favorito encontrado."
                        ),

                    "401":
                        respuestaError(
                            "No autenticado."
                        ),

                    "404":
                        respuestaError(
                            "Favorito no encontrado."
                        )

                }

            },


            delete: {

                tags:
                    ["Favoritos"],

                summary:
                    "Eliminar favorito por ID",

                security:
                    seguridadJwt(),

                parameters:
                    [parametroId("id", "ID del favorito")],

                responses: {

                    "200":
                        respuestaJson(
                            "Favorito eliminado."
                        ),

                    "401":
                        respuestaError(
                            "No autenticado."
                        ),

                    "404":
                        respuestaError(
                            "Favorito no encontrado."
                        )

                }

            }

        },


        "/api/favoritos/recurso/{tipo}/{recursoId}": {

            delete: {

                tags:
                    ["Favoritos"],

                summary:
                    "Eliminar favorito por tipo y recurso",

                security:
                    seguridadJwt(),

                parameters: [

                    {
                        name:
                            "tipo",

                        in:
                            "path",

                        required:
                            true,

                        schema: {
                            type:
                                "string"
                        },

                        example:
                            "CONVOCATORIA"
                    },

                    {
                        name:
                            "recursoId",

                        in:
                            "path",

                        required:
                            true,

                        schema: {
                            type:
                                "string"
                        },

                        example:
                            "1"
                    }

                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Favorito eliminado."
                        ),

                    "401":
                        respuestaError(
                            "No autenticado."
                        ),

                    "404":
                        respuestaError(
                            "Favorito no encontrado."
                        )

                }

            }

        },


        /* =================================================
           ALERTAS
        ================================================= */

        "/api/alertas": {

            get: {

                tags:
                    ["Alertas"],

                summary:
                    "Listar mis alertas",

                security:
                    seguridadJwt(),

                responses: {

                    "200":
                        respuestaJson(
                            "Alertas del usuario autenticado."
                        ),

                    "401":
                        respuestaError(
                            "No autenticado."
                        )

                }

            },


            post: {

                tags:
                    ["Alertas"],

                summary:
                    "Crear alerta",

                security:
                    seguridadJwt(),

                requestBody: {

                    required:
                        true,

                    content: {

                        "application/json": {

                            schema: {

                                $ref:
                                    "#/components/schemas/AlertRequest"

                            }

                        }

                    }

                },

                responses: {

                    "201":
                        respuestaJson(
                            "Alerta creada."
                        ),

                    "400":
                        respuestaError(
                            "Datos de alerta inválidos."
                        ),

                    "401":
                        respuestaError(
                            "No autenticado."
                        )

                }

            }

        },


        "/api/alertas/{id}": {

            get: {

                tags:
                    ["Alertas"],

                summary:
                    "Consultar alerta por ID",

                security:
                    seguridadJwt(),

                parameters:
                    [parametroId("id", "ID de la alerta")],

                responses: {

                    "200":
                        respuestaJson(
                            "Alerta encontrada."
                        ),

                    "401":
                        respuestaError(
                            "No autenticado."
                        ),

                    "404":
                        respuestaError(
                            "Alerta no encontrada."
                        )

                }

            },


            put: {

                tags:
                    ["Alertas"],

                summary:
                    "Editar alerta",

                security:
                    seguridadJwt(),

                parameters:
                    [parametroId("id", "ID de la alerta")],

                requestBody: {

                    required:
                        true,

                    content: {

                        "application/json": {

                            schema: {

                                $ref:
                                    "#/components/schemas/AlertRequest"

                            }

                        }

                    }

                },

                responses: {

                    "200":
                        respuestaJson(
                            "Alerta actualizada."
                        ),

                    "400":
                        respuestaError(
                            "Datos inválidos."
                        ),

                    "401":
                        respuestaError(
                            "No autenticado."
                        ),

                    "404":
                        respuestaError(
                            "Alerta no encontrada."
                        )

                }

            },


            delete: {

                tags:
                    ["Alertas"],

                summary:
                    "Eliminar alerta",

                security:
                    seguridadJwt(),

                parameters:
                    [parametroId("id", "ID de la alerta")],

                responses: {

                    "200":
                        respuestaJson(
                            "Alerta eliminada."
                        ),

                    "401":
                        respuestaError(
                            "No autenticado."
                        ),

                    "404":
                        respuestaError(
                            "Alerta no encontrada."
                        )

                }

            }

        },


        "/api/alertas/{id}/estado": {

            patch: {

                tags:
                    ["Alertas"],

                summary:
                    "Activar o desactivar alerta",

                security:
                    seguridadJwt(),

                parameters:
                    [parametroId("id", "ID de la alerta")],

                requestBody: {

                    required:
                        true,

                    content: {

                        "application/json": {

                            schema: {

                                $ref:
                                    "#/components/schemas/AlertStateRequest"

                            }

                        }

                    }

                },

                responses: {

                    "200":
                        respuestaJson(
                            "Estado actualizado."
                        ),

                    "400":
                        respuestaError(
                            "El campo activa debe ser true o false."
                        ),

                    "401":
                        respuestaError(
                            "No autenticado."
                        ),

                    "404":
                        respuestaError(
                            "Alerta no encontrada."
                        )

                }

            }

        },


        /* =================================================
           ADMIN SERVICE
        ================================================= */

        "/api/admin/resumen": {

            get: {

                tags:
                    ["Administración"],

                summary:
                    "Obtener resumen administrativo",

                description:
                    "Consulta indicadores de usuarios, perfiles, favoritos y alertas desde SQL Server.",

                security:
                    seguridadJwt(),

                responses: {

                    "200":
                        respuestaConSchema(
                            "Resumen administrativo.",
                            "#/components/schemas/AdminSummaryResponse"
                        ),

                    "401":
                        respuestaError(
                            "JWT inválido o ausente."
                        ),

                    "403":
                        respuestaError(
                            "Se requiere rol ADMINISTRADOR."
                        )

                }

            }

        },


        "/api/admin/usuarios": {

            get: {

                tags:
                    ["Administración"],

                summary:
                    "Listar usuarios",

                description:
                    "Devuelve las cuentas registradas. Solo ADMINISTRADOR.",

                security:
                    seguridadJwt(),

                responses: {

                    "200":
                        respuestaJson(
                            "Usuarios registrados."
                        ),

                    "401":
                        respuestaError(
                            "JWT inválido o ausente."
                        ),

                    "403":
                        respuestaError(
                            "Se requiere rol ADMINISTRADOR."
                        )

                }

            }

        },


        "/api/admin/usuarios/{id}/estado": {

            patch: {

                tags:
                    ["Administración"],

                summary:
                    "Activar o desactivar usuario",

                description:
                    "Actualiza el estado de una cuenta. Impide desactivar la propia cuenta administrativa y protege al último administrador activo.",

                security:
                    seguridadJwt(),

                parameters:
                    [parametroId("id", "ID del usuario")],

                requestBody: {

                    required:
                        true,

                    content: {

                        "application/json": {

                            schema: {

                                $ref:
                                    "#/components/schemas/UserStateRequest"

                            }

                        }

                    }

                },

                responses: {

                    "200":
                        respuestaJson(
                            "Estado del usuario actualizado."
                        ),

                    "400":
                        respuestaError(
                            "Cambio de estado no permitido."
                        ),

                    "401":
                        respuestaError(
                            "JWT inválido o ausente."
                        ),

                    "403":
                        respuestaError(
                            "Se requiere rol ADMINISTRADOR."
                        ),

                    "404":
                        respuestaError(
                            "Usuario no encontrado."
                        )

                }

            }

        },


        /* =================================================
           CONVOCATORIAS
        ================================================= */

        "/api/convocatorias": {

            get: {

                tags:
                    ["Convocatorias"],

                summary:
                    "Listar convocatorias",

                parameters:
                    crearParametrosPaginacion(),

                responses: {

                    "200":
                        respuestaConSchema(
                            "Convocatorias recuperadas.",
                            "#/components/schemas/ServiceResponse"
                        )

                }

            }

        },


        "/api/convocatorias/buscar": {

            get: {

                tags:
                    ["Convocatorias"],

                summary:
                    "Buscar convocatorias",

                parameters:
                    crearParametroTexto(),

                responses: {

                    "200":
                        respuestaJson(
                            "Resultados de búsqueda."
                        ),

                    "400":
                        respuestaError(
                            "Texto de búsqueda inválido."
                        )

                }

            }

        },


        /* =================================================
           POSTULACIONES
        ================================================= */

        "/api/postulaciones": {

            get: {

                tags:
                    ["Postulaciones"],

                summary:
                    "Listar postulaciones",

                parameters:
                    crearParametrosPaginacion(),

                responses: {

                    "200":
                        respuestaJson(
                            "Registros recuperados."
                        )

                }

            }

        },


        "/api/postulaciones/buscar": {

            get: {

                tags:
                    ["Postulaciones"],

                summary:
                    "Buscar postulaciones",

                parameters:
                    crearParametroTexto(),

                responses: {

                    "200":
                        respuestaJson(
                            "Resultados encontrados."
                        )

                }

            }

        },


        /* =================================================
           DOCUMENTOS
        ================================================= */

        "/api/documentos": {

            get: {

                tags:
                    ["Documentos"],

                summary:
                    "Listar documentos y requisitos",

                parameters:
                    crearParametrosPaginacion(),

                responses: {

                    "200":
                        respuestaJson(
                            "Documentos recuperados."
                        )

                }

            }

        },


        "/api/documentos/buscar": {

            get: {

                tags:
                    ["Documentos"],

                summary:
                    "Buscar documentos",

                parameters:
                    crearParametroTexto(),

                responses: {

                    "200":
                        respuestaJson(
                            "Resultados encontrados."
                        )

                }

            }

        },


        /* =================================================
           CONVENIOS
        ================================================= */

        "/api/convenios": {

            get: {

                tags:
                    ["Convenios"],

                summary:
                    "Listar convenios",

                parameters:
                    crearParametrosPaginacion(),

                responses: {

                    "200":
                        respuestaJson(
                            "Convenios recuperados."
                        )

                }

            }

        },


        "/api/convenios/buscar": {

            get: {

                tags:
                    ["Convenios"],

                summary:
                    "Buscar convenios",

                parameters:
                    crearParametroTexto(),

                responses: {

                    "200":
                        respuestaJson(
                            "Resultados encontrados."
                        )

                }

            }

        },


        /* =================================================
           INSTITUCIONES
        ================================================= */

        "/api/instituciones": {

            get: {

                tags:
                    ["Instituciones"],

                summary:
                    "Listar instituciones",

                description:
                    "Devuelve instituciones detectadas mediante la composición de información disponible.",

                responses: {

                    "200":
                        respuestaJson(
                            "Catálogo institucional."
                        )

                }

            }

        },


        "/api/instituciones/buscar": {

            get: {

                tags:
                    ["Instituciones"],

                summary:
                    "Buscar instituciones",

                parameters:
                    crearParametroTexto(),

                responses: {

                    "200":
                        respuestaJson(
                            "Instituciones encontradas."
                        )

                }

            }

        },


        "/api/instituciones/{id}": {

            get: {

                tags:
                    ["Instituciones"],

                summary:
                    "Obtener institución",

                parameters:
                    [parametroTextoPath("id", "ID de institución", "1")],

                responses: {

                    "200":
                        respuestaJson(
                            "Detalle institucional."
                        ),

                    "404":
                        respuestaError(
                            "Institución no encontrada."
                        )

                }

            }

        },


        /* =================================================
           REGIONES
        ================================================= */

        "/api/regiones": {

            get: {

                tags:
                    ["Regiones"],

                summary:
                    "Listar departamentos",

                responses: {

                    "200":
                        respuestaJson(
                            "Departamentos recuperados."
                        )

                }

            }

        },


        "/api/regiones/buscar": {

            get: {

                tags:
                    ["Regiones"],

                summary:
                    "Buscar departamento",

                parameters:
                    crearParametroTexto(),

                responses: {

                    "200":
                        respuestaJson(
                            "Departamentos encontrados."
                        )

                }

            }

        },


        "/api/regiones/{codigo}": {

            get: {

                tags:
                    ["Regiones"],

                summary:
                    "Consultar departamento por código",

                parameters:
                    [parametroTextoPath("codigo", "Código del departamento", "22")],

                responses: {

                    "200":
                        respuestaJson(
                            "Departamento encontrado."
                        ),

                    "404":
                        respuestaError(
                            "Departamento no encontrado."
                        )

                }

            }

        },


        /* =================================================
           UBIGEO
        ================================================= */

        "/api/ubigeo": {

            get: {

                tags:
                    ["Ubigeo"],

                summary:
                    "Resumen territorial",

                description:
                    "Devuelve información sobre la cobertura territorial disponible.",

                responses: {

                    "200":
                        respuestaJson(
                            "Resumen territorial."
                        )

                }

            }

        },


        "/api/ubigeo/departamentos": {

            get: {

                tags:
                    ["Ubigeo"],

                summary:
                    "Listar departamentos del catálogo territorial",

                responses: {

                    "200":
                        respuestaJson(
                            "Departamentos disponibles."
                        )

                }

            }

        },


        "/api/ubigeo/departamentos/{departamento}/provincias": {

            get: {

                tags:
                    ["Ubigeo"],

                summary:
                    "Listar provincias",

                parameters:
                    [parametroTextoPath("departamento", "Código de departamento", "22")],

                responses: {

                    "200":
                        respuestaJson(
                            "Provincias encontradas."
                        )

                }

            }

        },


        "/api/ubigeo/provincias/{provincia}/distritos": {

            get: {

                tags:
                    ["Ubigeo"],

                summary:
                    "Listar distritos",

                parameters:
                    [parametroTextoPath("provincia", "Código de provincia", "2201")],

                responses: {

                    "200":
                        respuestaJson(
                            "Distritos encontrados."
                        )

                }

            }

        },


        "/api/ubigeo/buscar": {

            get: {

                tags:
                    ["Ubigeo"],

                summary:
                    "Buscar ubicación",

                parameters:
                    crearParametroTexto(),

                responses: {

                    "200":
                        respuestaJson(
                            "Ubicaciones encontradas."
                        )

                }

            }

        },


        "/api/ubigeo/{codigo}": {

            get: {

                tags:
                    ["Ubigeo"],

                summary:
                    "Consultar ubicación por código",

                parameters:
                    [parametroTextoPath("codigo", "Código UBIGEO", "220101")],

                responses: {

                    "200":
                        respuestaJson(
                            "Ubicación encontrada."
                        ),

                    "404":
                        respuestaError(
                            "Ubicación no encontrada."
                        )

                }

            }

        },


        /* =================================================
           CONSULTA EDUCATIVA
        ================================================= */

        "/api/consulta": {

            get: {

                tags:
                    ["Composición"],

                summary:
                    "Ejecutar consulta educativa integrada",

                description:
                    "ConsultaEducativaService compone varios servicios educativos.",

                responses: {

                    "200":
                        respuestaJson(
                            "Información educativa consolidada."
                        )

                }

            }

        },


        /* =================================================
           OPORTUNIDAD DETALLE
        ================================================= */

        "/api/oportunidades/{indice}": {

            get: {

                tags:
                    ["Composición"],

                summary:
                    "Obtener detalle compuesto de una oportunidad",

                parameters: [

                    {

                        name:
                            "indice",

                        in:
                            "path",

                        required:
                            true,

                        schema: {

                            type:
                                "integer",

                            minimum:
                                0

                        },

                        example:
                            0

                    }

                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Detalle de oportunidad."
                        ),

                    "404":
                        respuestaError(
                            "Oportunidad no encontrada."
                        )

                }

            }

        },


        /* =================================================
           ESTADÍSTICAS
        ================================================= */

        "/api/estadisticas": {

            get: {

                tags:
                    ["Analítica"],

                summary:
                    "Obtener estadísticas",

                description:
                    "Devuelve indicadores calculados sobre los registros recuperados.",

                responses: {

                    "200":
                        respuestaJson(
                            "Indicadores y catálogos detectados."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 19 - BECAS
        ================================================= */

        "/api/becas": {

            get: {

                tags:
                    ["Becas"],

                summary:
                    "Listar becas",

                description:
                    "Agrupa oportunidades de beca utilizando información oficial disponible.",

                responses: {

                    "200":
                        respuestaJson(
                            "Listado de becas."
                        )

                }

            }

        },


        "/api/becas/buscar": {

            get: {

                tags:
                    ["Becas"],

                summary:
                    "Buscar becas",

                parameters:
                    crearParametroTexto(),

                responses: {

                    "200":
                        respuestaJson(
                            "Resultados de búsqueda de becas."
                        )

                }

            }

        },


        "/api/becas/{id}": {

            get: {

                tags:
                    ["Becas"],

                summary:
                    "Obtener una beca",

                parameters: [
                    parametroId(
                        "id",
                        "Identificador de la beca."
                    )
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Detalle de la beca."
                        ),

                    "404":
                        respuestaError(
                            "Beca no encontrada."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 20 - PROGRAMAS EDUCATIVOS
        ================================================= */

        "/api/programas": {

            get: {

                tags:
                    ["Programas educativos"],

                summary:
                    "Listar programas educativos",

                responses: {

                    "200":
                        respuestaJson(
                            "Programas educativos obtenidos de información oficial disponible."
                        )

                }

            }

        },


        "/api/programas/{id}": {

            get: {

                tags:
                    ["Programas educativos"],

                summary:
                    "Obtener programa educativo",

                parameters: [
                    parametroId(
                        "id",
                        "Identificador del programa."
                    )
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Detalle del programa educativo."
                        ),

                    "404":
                        respuestaError(
                            "Programa no encontrado."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 21 - CARRERAS
        ================================================= */

        "/api/carreras": {

            get: {

                tags:
                    ["Carreras"],

                summary:
                    "Listar carreras",

                responses: {

                    "200":
                        respuestaJson(
                            "Catálogo de carreras."
                        )

                }

            }

        },


        "/api/carreras/buscar": {

            get: {

                tags:
                    ["Carreras"],

                summary:
                    "Buscar carreras",

                parameters:
                    crearParametroTexto(),

                responses: {

                    "200":
                        respuestaJson(
                            "Resultados de carreras."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 22 - MODALIDADES
        ================================================= */

        "/api/modalidades": {

            get: {

                tags:
                    ["Modalidades"],

                summary:
                    "Listar modalidades de estudio",

                responses: {

                    "200":
                        respuestaJson(
                            "Modalidades de estudio detectadas."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 23 - SEDES
        ================================================= */

        "/api/sedes": {

            get: {

                tags:
                    ["Sedes educativas"],

                summary:
                    "Listar sedes educativas",

                responses: {

                    "200":
                        respuestaJson(
                            "Listado de sedes educativas."
                        )

                }

            }

        },


        "/api/sedes/{id}": {

            get: {

                tags:
                    ["Sedes educativas"],

                summary:
                    "Obtener sede educativa",

                parameters: [
                    parametroId(
                        "id",
                        "Identificador de la sede."
                    )
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Detalle de sede educativa."
                        ),

                    "404":
                        respuestaError(
                            "Sede no encontrada."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 24 - BENEFICIOS
        ================================================= */

        "/api/beneficios": {

            get: {

                tags:
                    ["Beneficios"],

                summary:
                    "Listar beneficios explícitos",

                description:
                    "Devuelve únicamente beneficios presentes de forma explícita en las fuentes oficiales disponibles. Puede devolver total 0.",

                responses: {

                    "200":
                        respuestaJson(
                            "Beneficios disponibles."
                        )

                }

            }

        },


        "/api/beneficios/oportunidad/{id}": {

            get: {

                tags:
                    ["Beneficios"],

                summary:
                    "Consultar beneficios por oportunidad",

                parameters: [
                    parametroId(
                        "id",
                        "Identificador de oportunidad."
                    )
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Beneficios de la oportunidad."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 25 - CRONOGRAMAS
        ================================================= */

        "/api/cronogramas": {

            get: {

                tags:
                    ["Cronogramas"],

                summary:
                    "Listar cronogramas de convocatorias",

                responses: {

                    "200":
                        respuestaJson(
                            "Cronogramas obtenidos desde convocatorias oficiales disponibles."
                        )

                }

            }

        },


        "/api/cronogramas/convocatoria/{id}": {

            get: {

                tags:
                    ["Cronogramas"],

                summary:
                    "Consultar cronograma por convocatoria",

                parameters: [
                    parametroId(
                        "id",
                        "Identificador de convocatoria."
                    )
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Cronograma de convocatoria."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 26 - REQUISITOS
        ================================================= */

        "/api/requisitos-elegibilidad": {

            get: {

                tags:
                    ["Elegibilidad"],

                summary:
                    "Listar requisitos de elegibilidad",

                description:
                    "Devuelve requisitos únicamente cuando están publicados en una forma estructurada utilizable. Puede devolver total 0.",

                responses: {

                    "200":
                        respuestaJson(
                            "Requisitos de elegibilidad disponibles."
                        )

                }

            }

        },


        "/api/requisitos-elegibilidad/oportunidad/{id}": {

            get: {

                tags:
                    ["Elegibilidad"],

                summary:
                    "Consultar requisitos de una oportunidad",

                parameters: [
                    parametroId(
                        "id",
                        "Identificador de oportunidad."
                    )
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Requisitos estructurados disponibles."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 27 - EVALUACIÓN DE ELEGIBILIDAD
        ================================================= */

        "/api/elegibilidad/evaluar": {

            post: {

                tags:
                    ["Elegibilidad"],

                summary:
                    "Realizar preevaluación de elegibilidad",

                description:
                    "Evalúa únicamente reglas estructuradas disponibles. Puede devolver NO_DETERMINABLE. No reemplaza la decisión oficial de PRONABEC.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                requestBody: {

                    required:
                        true,

                    content: {

                        "application/json": {

                            schema: {

                                type:
                                    "object",

                                required:
                                    ["oportunidadId"],

                                properties: {

                                    oportunidadId: {
                                        type:
                                            "integer",
                                        example:
                                            1
                                    }

                                }

                            }

                        }

                    }

                },

                responses: {

                    "200":
                        respuestaJson(
                            "Resultado de la preevaluación."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 28 - SEGUIMIENTO DE POSTULACIONES
        ================================================= */

        "/api/seguimiento-postulaciones": {

            get: {

                tags:
                    ["Seguimiento"],

                summary:
                    "Listar seguimientos del usuario",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Seguimientos registrados."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        )

                }

            },


            post: {

                tags:
                    ["Seguimiento"],

                summary:
                    "Crear seguimiento de postulación",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                requestBody: {

                    required:
                        true,

                    content: {

                        "application/json": {

                            schema: {

                                type:
                                    "object",

                                required:
                                    ["id_postulacion", "titulo"],

                                properties: {

                                    id_postulacion: {
                                        type:
                                            "string",
                                        example:
                                            "PRUEBA-001"
                                    },

                                    titulo: {
                                        type:
                                            "string",
                                        example:
                                            "Beca 18 - Convocatoria 2026"
                                    },

                                    estado: {
                                        type:
                                            "string",
                                        example:
                                            "EN_SEGUIMIENTO"
                                    },

                                    notas: {
                                        type:
                                            "string",
                                        example:
                                            "Registro de seguimiento."
                                    }

                                }

                            }

                        }

                    }

                },

                responses: {

                    "201":
                        respuestaJson(
                            "Seguimiento creado."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        )

                }

            }

        },


        "/api/seguimiento-postulaciones/{id}/estado": {

            patch: {

                tags:
                    ["Seguimiento"],

                summary:
                    "Cambiar estado de seguimiento",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [
                    parametroId(
                        "id",
                        "Identificador del seguimiento."
                    )
                ],

                requestBody: {

                    required:
                        true,

                    content: {

                        "application/json": {

                            schema: {

                                type:
                                    "object",

                                required:
                                    ["estado"],

                                properties: {

                                    estado: {
                                        type:
                                            "string",
                                        example:
                                            "COMPLETADO"
                                    }

                                }

                            }

                        }

                    }

                },

                responses: {

                    "200":
                        respuestaJson(
                            "Seguimiento actualizado."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        ),

                    "404":
                        respuestaError(
                            "Seguimiento no encontrado."
                        )

                }

            }

        },


        "/api/seguimiento-postulaciones/{id}": {

            delete: {

                tags:
                    ["Seguimiento"],

                summary:
                    "Eliminar seguimiento",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [
                    parametroId(
                        "id",
                        "Identificador del seguimiento."
                    )
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Seguimiento eliminado."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        ),

                    "404":
                        respuestaError(
                            "Seguimiento no encontrado."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 29 - HISTORIAL DE CONSULTA
        ================================================= */

        "/api/historial": {

            get: {

                tags:
                    ["Historial"],

                summary:
                    "Listar historial de consultas",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Historial del usuario."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        )

                }

            },


            post: {

                tags:
                    ["Historial"],

                summary:
                    "Registrar una consulta",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                requestBody: {

                    required:
                        true,

                    content: {

                        "application/json": {

                            schema: {

                                type:
                                    "object",

                                required:
                                    ["tipo_consulta"],

                                properties: {

                                    tipo_consulta: {
                                        type:
                                            "string",
                                        example:
                                            "BECAS"
                                    },

                                    termino: {
                                        type:
                                            "string",
                                        example:
                                            "Beca 18"
                                    },

                                    filtros: {
                                        type:
                                            "object",
                                        additionalProperties:
                                            true,
                                        example: {
                                            region:
                                                "San Martín"
                                        }
                                    }

                                }

                            }

                        }

                    }

                },

                responses: {

                    "201":
                        respuestaJson(
                            "Consulta registrada."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        )

                }

            },


            delete: {

                tags:
                    ["Historial"],

                summary:
                    "Limpiar historial del usuario",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Historial eliminado."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 30 - RECOMENDACIONES
        ================================================= */

        "/api/recomendaciones": {

            get: {

                tags:
                    ["Recomendaciones"],

                summary:
                    "Obtener recomendaciones educativas",

                description:
                    "Genera recomendaciones por coincidencia con el perfil. No representa una decisión oficial de PRONABEC.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Recomendaciones personalizadas."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 31 - BÚSQUEDA AVANZADA
        ================================================= */

        "/api/busqueda": {

            get: {

                tags:
                    ["Búsqueda avanzada"],

                summary:
                    "Buscar en múltiples catálogos",

                parameters: [

                    {
                        name:
                            "texto",
                        in:
                            "query",
                        required:
                            false,
                        schema: {
                            type:
                                "string"
                        },
                        example:
                            "Beca"
                    },

                    {
                        name:
                            "tipo",
                        in:
                            "query",
                        required:
                            false,
                        schema: {
                            type:
                                "string",
                            enum: [
                                "TODOS",
                                "CONVOCATORIA",
                                "CARRERA",
                                "INSTITUCION",
                                "REGION"
                            ]
                        }
                    },

                    {
                        name:
                            "region",
                        in:
                            "query",
                        required:
                            false,
                        schema: {
                            type:
                                "string"
                        },
                        example:
                            "San Martín"
                    }

                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Resultados de búsqueda compuesta."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 32 - NOTIFICACIONES
        ================================================= */

        "/api/notificaciones": {

            get: {

                tags:
                    ["Notificaciones"],

                summary:
                    "Listar notificaciones",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Notificaciones del usuario."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        )

                }

            },


            post: {

                tags:
                    ["Notificaciones"],

                summary:
                    "Crear notificación",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                requestBody: {

                    required:
                        true,

                    content: {

                        "application/json": {

                            schema: {

                                type:
                                    "object",

                                required:
                                    ["titulo", "mensaje"],

                                properties: {

                                    titulo: {
                                        type:
                                            "string",
                                        example:
                                            "Nueva oportunidad"
                                    },

                                    mensaje: {
                                        type:
                                            "string",
                                        example:
                                            "Se encontró una oportunidad relacionada con tu perfil."
                                    },

                                    tipo: {
                                        type:
                                            "string",
                                        example:
                                            "OPORTUNIDAD"
                                    }

                                }

                            }

                        }

                    }

                },

                responses: {

                    "201":
                        respuestaJson(
                            "Notificación creada."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        )

                }

            }

        },


        "/api/notificaciones/{id}/leida": {

            patch: {

                tags:
                    ["Notificaciones"],

                summary:
                    "Marcar notificación como leída",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [
                    parametroId(
                        "id",
                        "Identificador de la notificación."
                    )
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Notificación marcada como leída."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        ),

                    "404":
                        respuestaError(
                            "Notificación no encontrada."
                        )

                }

            }

        },


        "/api/notificaciones/{id}": {

            delete: {

                tags:
                    ["Notificaciones"],

                summary:
                    "Eliminar notificación",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [
                    parametroId(
                        "id",
                        "Identificador de la notificación."
                    )
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Notificación eliminada."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        ),

                    "404":
                        respuestaError(
                            "Notificación no encontrada."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 33 - DOCUMENTOS DEL USUARIO
        ================================================= */

        "/api/mis-documentos": {

            get: {

                tags:
                    ["Documentos del usuario"],

                summary:
                    "Listar documentos del usuario",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Documentos registrados."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        )

                }

            },


            post: {

                tags:
                    ["Documentos del usuario"],

                summary:
                    "Registrar metadatos de documento",

                description:
                    "Registra metadatos del documento para la demostración del servicio. No carga el archivo físico.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                requestBody: {

                    required:
                        true,

                    content: {

                        "application/json": {

                            schema: {

                                type:
                                    "object",

                                required:
                                    ["tipo_documento", "nombre_archivo"],

                                properties: {

                                    tipo_documento: {
                                        type:
                                            "string",
                                        example:
                                            "DNI"
                                    },

                                    nombre_archivo: {
                                        type:
                                            "string",
                                        example:
                                            "dni_usuario.pdf"
                                    },

                                    descripcion: {
                                        type:
                                            "string",
                                        example:
                                            "Documento registrado para prueba."
                                    },

                                    fecha_emision: {
                                        type:
                                            "string",
                                        format:
                                            "date",
                                        example:
                                            "2025-01-10"
                                    },

                                    fecha_vencimiento: {
                                        type:
                                            "string",
                                        format:
                                            "date",
                                        example:
                                            "2030-01-10"
                                    }

                                }

                            }

                        }

                    }

                },

                responses: {

                    "201":
                        respuestaJson(
                            "Documento registrado."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        )

                }

            }

        },


        "/api/mis-documentos/{id}": {

            delete: {

                tags:
                    ["Documentos del usuario"],

                summary:
                    "Eliminar documento registrado",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [
                    parametroId(
                        "id",
                        "Identificador del documento."
                    )
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Documento eliminado."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        ),

                    "404":
                        respuestaError(
                            "Documento no encontrado."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 34 - VALIDACIÓN DE DOCUMENTOS
        ================================================= */

        "/api/validacion-documentos/{id}": {

            post: {

                tags:
                    ["Validación documental"],

                summary:
                    "Validar metadatos de documento",

                description:
                    "Valida consistencia básica de los metadatos y fechas registradas.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [
                    parametroId(
                        "id",
                        "Identificador del documento."
                    )
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Resultado de validación."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        ),

                    "404":
                        respuestaError(
                            "Documento no encontrado."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 35 - REPORTES
        ================================================= */

        "/api/reportes/resumen": {

            get: {

                tags:
                    ["Reportes"],

                summary:
                    "Obtener reporte resumen",

                description:
                    "Requiere rol ADMINISTRADOR.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Resumen de indicadores del sistema."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        ),

                    "403":
                        respuestaError(
                            "Se requiere rol ADMINISTRADOR."
                        )

                }

            }

        },


        "/api/reportes/usuarios": {

            get: {

                tags:
                    ["Reportes"],

                summary:
                    "Obtener reporte de usuarios",

                description:
                    "Requiere rol ADMINISTRADOR.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Reporte de usuarios."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        ),

                    "403":
                        respuestaError(
                            "Se requiere rol ADMINISTRADOR."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 36 - EXPORTACIÓN
        ================================================= */

        "/api/exportaciones/busqueda": {

            get: {

                tags:
                    ["Exportación"],

                summary:
                    "Exportar una búsqueda",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [

                    {
                        name:
                            "texto",
                        in:
                            "query",
                        required:
                            false,
                        schema: {
                            type:
                                "string"
                        },
                        example:
                            "Beca"
                    },

                    {
                        name:
                            "tipo",
                        in:
                            "query",
                        required:
                            false,
                        schema: {
                            type:
                                "string"
                        }
                    },

                    {
                        name:
                            "region",
                        in:
                            "query",
                        required:
                            false,
                        schema: {
                            type:
                                "string"
                        }
                    },

                    {
                        name:
                            "formato",
                        in:
                            "query",
                        required:
                            false,
                        schema: {
                            type:
                                "string",
                            enum: [
                                "json",
                                "csv"
                            ],
                            default:
                                "json"
                        }
                    }

                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Exportación JSON o archivo CSV."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        )

                }

            }

        },


        "/api/exportaciones/reporte-resumen": {

            get: {

                tags:
                    ["Exportación"],

                summary:
                    "Exportar reporte resumen",

                description:
                    "Requiere rol ADMINISTRADOR.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [

                    {
                        name:
                            "formato",
                        in:
                            "query",
                        required:
                            false,
                        schema: {
                            type:
                                "string",
                            enum: [
                                "json",
                                "csv"
                            ],
                            default:
                                "json"
                        }
                    }

                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Exportación del reporte resumen."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        ),

                    "403":
                        respuestaError(
                            "Se requiere rol ADMINISTRADOR."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 37 - AUDITORÍA
        ================================================= */

        "/api/auditoria": {

            get: {

                tags:
                    ["Auditoría"],

                summary:
                    "Consultar eventos de auditoría",

                description:
                    "Requiere rol ADMINISTRADOR.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [

                    {
                        name:
                            "limite",
                        in:
                            "query",
                        required:
                            false,
                        schema: {
                            type:
                                "integer",
                            minimum:
                                1,
                            maximum:
                                500,
                            default:
                                100
                        }
                    }

                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Eventos de auditoría."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        ),

                    "403":
                        respuestaError(
                            "Se requiere rol ADMINISTRADOR."
                        )

                }

            },


            post: {

                tags:
                    ["Auditoría"],

                summary:
                    "Registrar evento de auditoría",

                description:
                    "Requiere rol ADMINISTRADOR.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                requestBody: {

                    required:
                        true,

                    content: {

                        "application/json": {

                            schema: {

                                type:
                                    "object",

                                required:
                                    ["accion"],

                                properties: {

                                    accion: {
                                        type:
                                            "string",
                                        example:
                                            "PRUEBA_AUDITORIA"
                                    },

                                    entidad: {
                                        type:
                                            "string",
                                        example:
                                            "EDUPERU"
                                    },

                                    detalle: {
                                        type:
                                            "string",
                                        example:
                                            "Validación del servicio 37."
                                    }

                                }

                            }

                        }

                    }

                },

                responses: {

                    "201":
                        respuestaJson(
                            "Evento registrado."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        ),

                    "403":
                        respuestaError(
                            "Se requiere rol ADMINISTRADOR."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 38 - CONFIGURACIÓN
        ================================================= */

        "/api/configuracion": {

            get: {

                tags:
                    ["Configuración"],

                summary:
                    "Consultar configuración funcional",

                description:
                    "Requiere rol ADMINISTRADOR. No expone secretos del archivo .env.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Configuración funcional."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        ),

                    "403":
                        respuestaError(
                            "Se requiere rol ADMINISTRADOR."
                        )

                }

            }

        },


        "/api/configuracion/{clave}": {

            put: {

                tags:
                    ["Configuración"],

                summary:
                    "Actualizar configuración funcional",

                description:
                    "Requiere rol ADMINISTRADOR. Las claves relacionadas con secretos, passwords, tokens, API keys, JWT o credenciales de base de datos están bloqueadas.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                parameters: [
                    parametroTextoPath(
                        "clave",
                        "Clave funcional a modificar.",
                        "TAMANO_PAGINA"
                    )
                ],

                requestBody: {

                    required:
                        true,

                    content: {

                        "application/json": {

                            schema: {

                                type:
                                    "object",

                                required:
                                    ["valor"],

                                properties: {

                                    valor: {
                                        type:
                                            "string",
                                        example:
                                            "25"
                                    },

                                    descripcion: {
                                        type:
                                            "string",
                                        example:
                                            "Registros por página."
                                    }

                                }

                            }

                        }

                    }

                },

                responses: {

                    "200":
                        respuestaJson(
                            "Configuración actualizada."
                        ),

                    "400":
                        respuestaError(
                            "Clave no permitida o datos inválidos."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        ),

                    "403":
                        respuestaError(
                            "Se requiere rol ADMINISTRADOR."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 39 - CALENDARIO EDUCATIVO
        ================================================= */

        "/api/calendario": {

            get: {

                tags:
                    ["Calendario educativo"],

                summary:
                    "Obtener calendario educativo",

                description:
                    "Compone cronogramas oficiales disponibles, alertas del usuario y seguimientos de postulaciones.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Calendario educativo del usuario."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        )

                }

            }

        },


        /* =================================================
           SERVICIO 40 - ORIENTACIÓN EDUCATIVA
        ================================================= */

        "/api/orientacion": {

            get: {

                tags:
                    ["Orientación educativa"],

                summary:
                    "Obtener orientación educativa",

                description:
                    "Compone perfil, recomendaciones, cronogramas y requisitos disponibles. Es informativo y no reemplaza una evaluación oficial de PRONABEC.",

                security: [
                    {
                        bearerAuth: []
                    }
                ],

                responses: {

                    "200":
                        respuestaJson(
                            "Orientación educativa personalizada."
                        ),

                    "401":
                        respuestaError(
                            "Autenticación requerida."
                        )

                }

            }

        },


        /* =================================================
           CONTRATOS
        ================================================= */

        "/api/contratos": {

            get: {

                tags:
                    ["Arquitectura SOA"],

                summary:
                    "Consultar contratos SOA",

                description:
                    "Devuelve el inventario formal de los 40 servicios empresariales SOA de EduPerú y su estado de implementación.",

                responses: {

                    "200":
                        respuestaConSchema(
                            "Catálogo de contratos.",
                            "#/components/schemas/ContractsResponse"
                        )

                }

            }

        }

    },


    /* =====================================================
       COMPONENTS
    ===================================================== */

    components: {


        /* =================================================
           SEGURIDAD JWT
        ================================================= */

        securitySchemes: {

            bearerAuth: {

                type:
                    "http",

                scheme:
                    "bearer",

                bearerFormat:
                    "JWT",

                description:
                    "Ingresa únicamente el token JWT obtenido en POST /api/auth/login."

            }

        },


        /* =================================================
           SCHEMAS
        ================================================= */

        schemas: {


            ErrorResponse: {

                type:
                    "object",

                properties: {

                    success: {
                        type:
                            "boolean",
                        example:
                            false
                    },

                    mensaje: {
                        type:
                            "string",
                        example:
                            "No autorizado."
                    }

                }

            },


            LoginRequest: {

                type:
                    "object",

                required:
                    ["email", "password"],

                properties: {

                    email: {
                        type:
                            "string",
                        format:
                            "email",
                        example:
                            "usuario@eduperu.pe"
                    },

                    password: {
                        type:
                            "string",
                        format:
                            "password",
                        example:
                            "TuPasswordSeguro123!"
                    }

                }

            },


            RegisterRequest: {

                type:
                    "object",

                required:
                    ["nombres", "apellidos", "email", "password"],

                properties: {

                    nombres: {
                        type:
                            "string",
                        example:
                            "Usuario"
                    },

                    apellidos: {
                        type:
                            "string",
                        example:
                            "EduPerú"
                    },

                    email: {
                        type:
                            "string",
                        format:
                            "email",
                        example:
                            "nuevo@eduperu.pe"
                    },

                    password: {
                        type:
                            "string",
                        format:
                            "password",
                        example:
                            "PasswordSeguro123!"
                    }

                }

            },


            AuthResponse: {

                type:
                    "object",

                properties: {

                    success: {
                        type:
                            "boolean",
                        example:
                            true
                    },

                    token: {
                        type:
                            "string",
                        description:
                            "JWT de acceso."
                    },

                    usuario: {

                        $ref:
                            "#/components/schemas/User"

                    }

                }

            },


            User: {

                type:
                    "object",

                properties: {

                    id_usuario: {
                        type:
                            "integer",
                        example:
                            1
                    },

                    nombres: {
                        type:
                            "string",
                        example:
                            "Usuario"
                    },

                    apellidos: {
                        type:
                            "string",
                        example:
                            "EduPerú"
                    },

                    email: {
                        type:
                            "string",
                        format:
                            "email",
                        example:
                            "usuario@eduperu.pe"
                    },

                    rol: {
                        type:
                            "string",
                        example:
                            "ADMINISTRADOR"
                    },

                    activo: {
                        type:
                            "boolean",
                        example:
                            true
                    }

                }

            },


            UserResponse: {

                type:
                    "object",

                properties: {

                    success: {
                        type:
                            "boolean",
                        example:
                            true
                    },

                    usuario: {
                        $ref:
                            "#/components/schemas/User"
                    },

                    resultado: {
                        $ref:
                            "#/components/schemas/User"
                    }

                }

            },


            ProfileUpdateRequest: {

                type:
                    "object",

                properties: {

                    departamento: {
                        type:
                            "string",
                        example:
                            "San Martín"
                    },

                    provincia: {
                        type:
                            "string",
                        example:
                            "Moyobamba"
                    },

                    distrito: {
                        type:
                            "string",
                        example:
                            "Moyobamba"
                    },

                    carrera_interes: {
                        type:
                            "string",
                        example:
                            "Ingeniería de Sistemas"
                    },

                    nivel_estudio: {
                        type:
                            "string",
                        example:
                            "Universitario"
                    },

                    institucion: {
                        type:
                            "string",
                        example:
                            "Universidad"
                    }

                }

            },


            ProfileResponse: {

                type:
                    "object",

                properties: {

                    success: {
                        type:
                            "boolean",
                        example:
                            true
                    },

                    resultado: {

                        allOf: [

                            {
                                $ref:
                                    "#/components/schemas/ProfileUpdateRequest"
                            },

                            {
                                type:
                                    "object",

                                properties: {

                                    fecha_actualizacion: {
                                        type:
                                            "string",
                                        format:
                                            "date-time"
                                    }

                                }

                            }

                        ]

                    }

                }

            },


            FavoriteRequest: {

                type:
                    "object",

                required:
                    ["tipo_recurso", "recurso_id", "titulo"],

                properties: {

                    tipo_recurso: {
                        type:
                            "string",
                        example:
                            "CONVOCATORIA"
                    },

                    recurso_id: {
                        type:
                            "string",
                        example:
                            "1"
                    },

                    titulo: {
                        type:
                            "string",
                        example:
                            "Beca 18 - Ingeniería de Sistemas"
                    },

                    subtitulo: {
                        type:
                            "string",
                        nullable:
                            true,
                        example:
                            "Oportunidad educativa"
                    },

                    datos_json: {
                        type:
                            "object",
                        nullable:
                            true,
                        additionalProperties:
                            true
                    }

                }

            },


            AlertRequest: {

                type:
                    "object",

                required:
                    ["nombre"],

                properties: {

                    nombre: {
                        type:
                            "string",
                        maxLength:
                            100,
                        example:
                            "Becas de Sistemas"
                    },

                    palabra_clave: {
                        type:
                            "string",
                        maxLength:
                            150,
                        nullable:
                            true,
                        example:
                            "Ingeniería de Sistemas"
                    },

                    region: {
                        type:
                            "string",
                        maxLength:
                            100,
                        nullable:
                            true,
                        example:
                            "San Martín"
                    }

                }

            },


            AlertStateRequest: {

                type:
                    "object",

                required:
                    ["activa"],

                properties: {

                    activa: {
                        type:
                            "boolean",
                        example:
                            true
                    }

                }

            },


            UserStateRequest: {

                type:
                    "object",

                required:
                    ["activo"],

                properties: {

                    activo: {
                        type:
                            "boolean",
                        example:
                            true
                    }

                }

            },


            AdminSummaryResponse: {

                type:
                    "object",

                properties: {

                    success: {
                        type:
                            "boolean",
                        example:
                            true
                    },

                    servicio: {
                        type:
                            "string",
                        example:
                            "AdminService"
                    },

                    resultado: {

                        type:
                            "object",

                        properties: {

                            usuarios: {

                                type:
                                    "object",

                                properties: {

                                    total: {
                                        type:
                                            "integer",
                                        example:
                                            3
                                    },

                                    activos: {
                                        type:
                                            "integer",
                                        example:
                                            3
                                    },

                                    administradores: {
                                        type:
                                            "integer",
                                        example:
                                            1
                                    }

                                }

                            },

                            favoritos: {

                                type:
                                    "object",

                                properties: {

                                    total: {
                                        type:
                                            "integer",
                                        example:
                                            2
                                    }

                                }

                            },

                            alertas: {

                                type:
                                    "object",

                                properties: {

                                    total: {
                                        type:
                                            "integer",
                                        example:
                                            2
                                    },

                                    activas: {
                                        type:
                                            "integer",
                                        example:
                                            1
                                    }

                                }

                            },

                            perfiles: {

                                type:
                                    "object",

                                properties: {

                                    configurados: {
                                        type:
                                            "integer",
                                        example:
                                            1
                                    }

                                }

                            }

                        }

                    }

                }

            },


            ServiceResponse: {

                type:
                    "object",

                properties: {

                    servicio: {
                        type:
                            "string",
                        example:
                            "ConvocatoriaService"
                    },

                    tipo: {
                        type:
                            "string",
                        example:
                            "Servicio de Entidad"
                    },

                    resultado: {
                        type:
                            "object",
                        additionalProperties:
                            true
                    }

                }

            },


            HealthResponse: {

                type:
                    "object",

                properties: {

                    proyecto: {
                        type:
                            "string",
                        example:
                            "EduPeruSOA"
                    },

                    arquitectura: {
                        type:
                            "string",
                        example:
                            "Arquitectura Orientada a Servicios - SOA"
                    },

                    resultado: {

                        type:
                            "object",

                        properties: {

                            servicio: {
                                type:
                                    "string",
                                example:
                                    "HealthCheckService"
                            },

                            version: {
                                type:
                                    "string",
                                example:
                                    "1.9.0"
                            },

                            estado: {
                                type:
                                    "string",
                                enum: [
                                    "OPERATIVO",
                                    "OPERATIVO_PARCIAL",
                                    "DEGRADADO"
                                ]
                            },

                            disponible: {
                                type:
                                    "boolean",
                                example:
                                    true
                            },

                            politicaDatos: {
                                type:
                                    "string",
                                example:
                                    "Solo fuentes oficiales; no se generan datos ficticios de respaldo."
                            },

                            fecha: {
                                type:
                                    "string",
                                format:
                                    "date-time"
                            },

                            inventarioSOA: {

                                type:
                                    "object",

                                properties: {

                                    total: {
                                        type:
                                            "integer",
                                        example:
                                            40
                                    },

                                    implementados: {
                                        type:
                                            "integer",
                                        example:
                                            40
                                    },

                                    planificados: {
                                        type:
                                            "integer",
                                        example:
                                            0
                                    }

                                }

                            },

                            resumenMonitoreo: {

                                type:
                                    "object",

                                properties: {

                                    totalServiciosMonitoreados: {
                                        type:
                                            "integer",
                                        example:
                                            8
                                    },

                                    operativos: {
                                        type:
                                            "integer",
                                        example:
                                            8
                                    },

                                    noDisponibles: {
                                        type:
                                            "integer",
                                        example:
                                            0
                                    },

                                    errores: {
                                        type:
                                            "integer",
                                        example:
                                            0
                                    },

                                    apiPronabec: {
                                        type:
                                            "integer",
                                        example:
                                            0
                                    },

                                    portalNacional: {
                                        type:
                                            "integer",
                                        example:
                                            4
                                    },

                                    portalPronabec: {
                                        type:
                                            "integer",
                                        example:
                                            0
                                    },

                                    locales: {
                                        type:
                                            "integer",
                                        example:
                                            3
                                    },

                                    disponibilidadPorcentaje: {
                                        type:
                                            "number",
                                        example:
                                            100
                                    }

                                }

                            },

                            serviciosMonitoreados: {

                                type:
                                    "array",

                                items: {
                                    $ref:
                                        "#/components/schemas/HealthService"
                                }

                            }

                        }

                    }

                }

            },


            HealthService: {

                type:
                    "object",

                properties: {

                    nombre: {
                        type:
                            "string",
                        example:
                            "ConvocatoriaService"
                    },

                    tipo: {
                        type:
                            "string"
                    },

                    endpoint: {
                        type:
                            "string",
                        example:
                            "/api/convocatorias"
                    },

                    estado: {
                        type:
                            "string",
                        enum: [
                            "OPERATIVO",
                            "NO_DISPONIBLE",
                            "ERROR"
                        ]
                    },

                    modo: {
                        type:
                            "string",
                        enum: [
                            "API_PRONABEC",
                            "PORTAL_NACIONAL",
                            "PORTAL_PRONABEC",
                            "NO_DISPONIBLE",
                            "LOCAL",
                            "OPERATIVO",
                            "ERROR"
                        ]
                    },

                    latenciaMs: {
                        type:
                            "number"
                    },

                    disponible: {
                        type:
                            "boolean"
                    },

                    detalle: {
                        type:
                            "string"
                    }

                }

            },


            ContractsResponse: {

                type:
                    "object",

                properties: {

                    proyecto: {
                        type:
                            "string",
                        example:
                            "EduPeruSOA"
                    },

                    arquitectura: {
                        type:
                            "string"
                    },

                    cantidadServicios: {
                        type:
                            "integer",
                        example:
                            40
                    },

                    principiosThomasErl: {

                        type:
                            "array",

                        items: {
                            type:
                                "string"
                        }

                    },

                    contratos: {

                        type:
                            "array",

                        items: {
                            $ref:
                                "#/components/schemas/ServiceContract"
                        }

                    }

                }

            },


            ServiceContract: {

                type:
                    "object",

                properties: {

                    id: {
                        type:
                            "integer"
                    },

                    nombre: {
                        type:
                            "string",
                        example:
                            "AdminService"
                    },

                    dominio: {
                        type:
                            "string"
                    },

                    tipo: {
                        type:
                            "string"
                    },

                    descripcion: {
                        type:
                            "string"
                    },

                    endpoint: {
                        type:
                            "string",
                        example:
                            "/api/admin"
                    }

                }

            }

        }

    }

};


/* =========================================================
   HELPERS
========================================================= */

function seguridadJwt() {

    return [

        {
            bearerAuth:
                []
        }

    ];

}


function respuestaJson(
    descripcion
) {

    return {

        description:
            descripcion,

        content: {

            "application/json": {

                schema: {
                    type:
                        "object",
                    additionalProperties:
                        true
                }

            }

        }

    };

}


function respuestaConSchema(
    descripcion,
    referencia
) {

    return {

        description:
            descripcion,

        content: {

            "application/json": {

                schema: {
                    $ref:
                        referencia
                }

            }

        }

    };

}


function respuestaError(
    descripcion
) {

    return {

        description:
            descripcion,

        content: {

            "application/json": {

                schema: {
                    $ref:
                        "#/components/schemas/ErrorResponse"
                }

            }

        }

    };

}


function parametroId(
    nombre,
    descripcion
) {

    return {

        name:
            nombre,

        in:
            "path",

        required:
            true,

        description:
            descripcion,

        schema: {
            type:
                "integer",
            minimum:
                1
        }

    };

}


function parametroTextoPath(
    nombre,
    descripcion,
    ejemplo
) {

    return {

        name:
            nombre,

        in:
            "path",

        required:
            true,

        description:
            descripcion,

        schema: {
            type:
                "string"
        },

        example:
            ejemplo

    };

}


function crearParametrosPaginacion() {

    return [

        {

            name:
                "page",

            in:
                "query",

            required:
                false,

            schema: {

                type:
                    "integer",

                default:
                    1,

                minimum:
                    1

            }

        },

        {

            name:
                "rows",

            in:
                "query",

            required:
                false,

            schema: {

                type:
                    "integer",

                default:
                    10,

                minimum:
                    1

            }

        }

    ];

}


function crearParametroTexto() {

    return [

        {

            name:
                "texto",

            in:
                "query",

            required:
                true,

            schema: {
                type:
                    "string"
            },

            example:
                "Ingeniería"

        }

    ];

}


/* =========================================================
   EXPORTAR
========================================================= */

module.exports =
    swaggerSpec;
