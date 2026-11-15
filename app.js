/* =========================================================
   EDUPERÃš SOA
   SERVIDOR PRINCIPAL
========================================================= */

require("dotenv").config();

/* EDUPERU_PRONABEC_SYNC_REPO_V3 */
/* EDUPERU_PORTAL_DATOS_TODAS_PESTANAS_V1 */
const portalDatos =
    require(
        "./src/services/portalDatos.service"
    );


const pronabecSyncRepoV3 =
    require(
        "./src/services/pronabecCatalogoPostgres.service"
    );


const express =
    require("express");

const cors =
    require("cors");

const path =
    require("path");

const swaggerUi =
    require("swagger-ui-express");

const swaggerSpec =
    require("./src/config/swagger");

const traceMiddleware =
    require("./src/middleware/trace.middleware");

const observabilidadRoutes =
    require("./src/routes/observabilidad.routes");


/* =========================================================
   BASE DE DATOS
========================================================= */

const {
    probarConexion
} =
    require("./src/config/database");


/* =========================================================
   RUTAS SOA
========================================================= */

const convocatoriaRoutes =
    require("./src/routes/convocatoria.routes");

const postulacionRoutes =
    require("./src/routes/postulacion.routes");

const documentoRoutes =
    require("./src/routes/documentoRequisito.routes");

const convenioRoutes =
    require("./src/routes/convenio.routes");

const institucionRoutes =
    require("./src/routes/institucion.routes");

const regionRoutes =
    require("./src/routes/region.routes");

const ubigeoRoutes =
    require("./src/routes/ubigeo.routes");

const consultaRoutes =
    require("./src/routes/consultaEducativa.routes");

const contratosRoutes =
    require("./src/routes/contratos.routes");

const estadisticaRoutes =
    require("./src/routes/estadistica.routes");

const oportunidadDetalleRoutes =
    require("./src/routes/oportunidadDetalle.routes");

const comparadorOportunidadesRoutes =
    require("./src/routes/comparadorOportunidades.routes");

const healthCheckRoutes =
    require("./src/routes/healthCheck.routes");

const authRoutes =
    require("./src/routes/auth.routes");

const perfilRoutes =
    require("./src/routes/perfil.routes");

const favoritoRoutes =
    require("./src/routes/favorito.routes");

const alertaRoutes =
    require("./src/routes/alerta.routes");

const adminRoutes =
    require("./src/routes/admin.routes");


/* =========================================================
   SERVICIOS EMPRESARIALES 19 - 24
========================================================= */

const becaRoutes =
    require("./src/routes/beca.routes");

const programaEducativoRoutes =
    require("./src/routes/programaEducativo.routes");

const carreraRoutes =
    require("./src/routes/carrera.routes");

const modalidadEstudioRoutes =
    require("./src/routes/modalidadEstudio.routes");

const sedeEducativaRoutes =
    require("./src/routes/sedeEducativa.routes");

const beneficioRoutes =
    require("./src/routes/beneficio.routes");


/* =========================================================
   SERVICIOS EMPRESARIALES 25 - 30
========================================================= */

const cronogramaConvocatoriaRoutes =
    require("./src/routes/cronogramaConvocatoria.routes");

const requisitoElegibilidadRoutes =
    require("./src/routes/requisitoElegibilidad.routes");

const evaluacionElegibilidadRoutes =
    require("./src/routes/evaluacionElegibilidad.routes");

const seguimientoPostulacionRoutes =
    require("./src/routes/seguimientoPostulacion.routes");

const historialConsultaRoutes =
    require("./src/routes/historialConsulta.routes");

const recomendacionEducativaRoutes =
    require("./src/routes/recomendacionEducativa.routes");


/* =========================================================
   SERVICIOS EMPRESARIALES 31 - 35
========================================================= */

const busquedaAvanzadaRoutes =
    require("./src/routes/busquedaAvanzada.routes");

const notificacionRoutes =
    require("./src/routes/notificacion.routes");

const documentoUsuarioRoutes =
    require("./src/routes/documentoUsuario.routes");

const validacionDocumentoRoutes =
    require("./src/routes/validacionDocumento.routes");

const reporteRoutes =
    require("./src/routes/reporte.routes");


/* =========================================================
   SERVICIOS EMPRESARIALES 36 - 40
========================================================= */

const exportacionRoutes =
    require("./src/routes/exportacion.routes");

const auditoriaRoutes =
    require("./src/routes/auditoria.routes");

const configuracionRoutes =
    require("./src/routes/configuracion.routes");

const calendarioEducativoRoutes =
    require("./src/routes/calendarioEducativo.routes");

const orientacionEducativaRoutes =
    require("./src/routes/orientacionEducativa.routes");
const hexagonalPronabecRoutes =
    require("./src/routes/hexagonalPronabec.routes");



/*const hermesRoutes =
    require("./src/routes/hermes.routes");

 =========================================================
   CREAR APP
========================================================= */

const app =
    express();


const PORT =
    process.env.PORT ||
    3000;


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
    cors()
);


app.use(
    express.json({
        limit:
            "2mb"
    })
);


app.use(
    express.urlencoded({
        extended:
            true
    })
);


/* =========================================================
   TRACEID + OBSERVABILIDAD TECNICA
========================================================= */

app.use(
    traceMiddleware
);


/* =========================================================
   FRONTEND
========================================================= */


/* EDUPERU_ROOT_LOGIN_ENTRY_V1 */
app.get(
    "/",
    (req, res) => {

        return res.redirect(
            302,
            "/pages/login.html?entry=1"
        );

    }
);


app.use(
    express.static(path.join(
            __dirname,
            "public"
        ), { index: false })
);


/* =========================================================
   SWAGGER / OPENAPI
========================================================= */

app.get(
    "/api-docs.json",
    (req, res) => {

        res.json(
            swaggerSpec
        );

    }
);


app.use(
    "/api-docs",

    swaggerUi.serve,

    swaggerUi.setup(
        swaggerSpec,
        {
            customSiteTitle:
                "EduPerÃº SOA API",

            explorer:
                true,

            swaggerOptions: {

                persistAuthorization:
                    true,

                displayRequestDuration:
                    true,

                filter:
                    true,

                tryItOutEnabled:
                    true

            }
        }
    )
);


/* =========================================================
   API PRINCIPAL
========================================================= */

app.get(
    "/api",
    (req, res) => {

        res.json({

            success:
                true,

            proyecto:
                "EduPeruSOA",

            nombrePublico:
                "EduPerÃº",

            descripcion:
                "Plataforma de consulta de oportunidades educativas",

            arquitectura:
                "Arquitectura Orientada a Servicios - SOA",

            version:
                "1.9.0",

            estado:
                "OPERATIVO",

            tecnologias: {

                backend:
                    "Node.js + Express",

                baseDatos:
                    "Microsoft SQL Server",

                autenticacion:
                    "JWT",

                documentacion:
                    "OpenAPI / Swagger"

            },

            documentacion: {

                swagger:
                    "/api-docs",

                openapi:
                    "/api-docs.json"

            },

            servicios: {

                observabilidad:
                    "/api/observabilidad/resumen",

                health:
                    "/api/health",

                database:
                    "/api/database/health",

                auth:
                    "/api/auth",

                perfil:
                    "/api/perfil",

                favoritos:
                    "/api/favoritos",

                alertas:
                    "/api/alertas",

                admin:
                    "/api/admin",

                convocatorias:
                    "/api/convocatorias",

                postulaciones:
                    "/api/postulaciones",

                documentos:
                    "/api/documentos",

                convenios:
                    "/api/convenios",

                instituciones:
                    "/api/instituciones",

                regiones:
                    "/api/regiones",

                ubigeo:
                    "/api/ubigeo",

                consulta:
                    "/api/consulta",

                estadisticas:
                    "/api/estadisticas",

                contratos:
                    "/api/contratos",

                oportunidadDetalle:
                    "/api/oportunidades/:indice",

                comparadorOportunidades:
                    "/api/comparador-oportunidades",

                becas:
                    "/api/becas",

                programas:
                    "/api/programas",

                carreras:
                    "/api/carreras",

                modalidades:
                    "/api/modalidades",

                sedes:
                    "/api/sedes",

                beneficios:
                    "/api/beneficios",

                cronogramas:
                    "/api/cronogramas",

                requisitosElegibilidad:
                    "/api/requisitos-elegibilidad",

                elegibilidad:
                    "/api/elegibilidad",

                seguimientoPostulaciones:
                    "/api/seguimiento-postulaciones",

                historial:
                    "/api/historial",

                recomendaciones:
                    "/api/recomendaciones",

                busqueda:
                    "/api/busqueda",

                notificaciones:
                    "/api/notificaciones",

                misDocumentos:
                    "/api/mis-documentos",

                validacionDocumentos:
                    "/api/validacion-documentos",

                reportes:
                    "/api/reportes",

                exportaciones:
                    "/api/exportaciones",

                auditoria:
                    "/api/auditoria",

                configuracion:
                    "/api/configuracion",

                calendario:
                    "/api/calendario",

                orientacion:
                    "/api/orientacion"

            }

        });

    }
);



/* =========================================================
   RENDER HEALTH CHECK LIGERO
========================================================= */


/* EDUPERU_PRONABEC_SYNC_RESUMEN_V3 */
app.get(
    "/api/pronabec-sync/resumen",
    async (req, res) => {

        try {

            const resultado =
                await pronabecSyncRepoV3
                    .obtenerResumen();


            return res
                .status(200)
                .json({
                    success:
                        true,

                    resultado
                });

        } catch (error) {

            console.error(
                "[PRONABEC-SYNC-RESUMEN]",
                error.message
            );


            return res
                .status(500)
                .json({
                    success:
                        false,

                    mensaje:
                        "No fue posible consultar el resumen sincronizado."
                });

        }

    }
);



/* EDUPERU_PORTAL_RUTAS_TODAS_PESTANAS_V1 */

app.get(
    "/api/portal/resumen",
    async (req, res) => {

        try {

            res.json({
                success:
                    true,
                resultado:
                    await portalDatos
                        .resumen()
            });

        } catch (error) {

            res.status(500)
                .json({
                    success:
                        false,
                    mensaje:
                        error.message
                });

        }

    }
);


app.get(
    "/api/portal/estadisticas",
    async (req, res) => {

        try {

            res.json({
                success:
                    true,
                resultado:
                    await portalDatos
                        .estadisticas()
            });

        } catch (error) {

            res.status(500)
                .json({
                    success:
                        false,
                    mensaje:
                        error.message
                });

        }

    }
);


app.get(
    "/api/portal/consulta-general",
    async (req, res) => {

        try {

            res.json({
                success:
                    true,
                resultado:
                    await portalDatos
                        .consultaGeneral()
            });

        } catch (error) {

            res.status(500)
                .json({
                    success:
                        false,
                    mensaje:
                        error.message
                });

        }

    }
);



/* EDUPERU_PORTAL_CONVOCATORIAS_V2 */
app.get(
    "/api/portal/convocatorias",
    async (req, res) => {

        try {

            res.json({
                success:
                    true,

                resultado:
                    await portalDatos
                        .listarRegistros(
                            "ConvocatoriaCarreraVigentes",
                            req.query,
                            {
                                rowsDefecto:
                                    100,
                                rowsMax:
                                    500
                            }
                        )
            });

        } catch (error) {

            res.status(500)
                .json({
                    success:
                        false,

                    mensaje:
                        error.message
                });

        }

    }
);


app.get(
    "/api/portal/oportunidades",
    async (req, res) => {

        try {

            res.json({
                success:
                    true,
                resultado:
                    await portalDatos
                        .listarRegistros(
                            "CarrerasElegiblesNacional",
                            req.query,
                            {
                                rowsDefecto:
                                    50,
                                rowsMax:
                                    500
                            }
                        )
            });

        } catch (error) {

            res.status(500)
                .json({
                    success:
                        false,
                    mensaje:
                        error.message
                });

        }

    }
);


app.get(
    "/api/portal/postulaciones",
    async (req, res) => {

        try {

            res.json({
                success:
                    true,
                resultado:
                    await portalDatos
                        .listarRegistros(
                            "PostulacionesVigentes",
                            req.query,
                            {
                                rowsDefecto:
                                    50,
                                rowsMax:
                                    500
                            }
                        )
            });

        } catch (error) {

            res.status(500)
                .json({
                    success:
                        false,
                    mensaje:
                        error.message
                });

        }

    }
);


app.get(
    "/api/portal/convenios",
    async (req, res) => {

        try {

            res.json({
                success:
                    true,
                resultado: {
                    modo:
                        "POSTGRES_SINCRONIZADO",
                    fuente:
                        "PRONABEC - PostgreSQL",
                    disponible:
                        true,
                    datos:
                        await portalDatos
                            .listarRegistros(
                                "Convenio",
                                req.query,
                                {
                                    rowsDefecto:
                                        5000,
                                    rowsMax:
                                        5000
                                }
                            )
                }
            });

        } catch (error) {

            res.status(500)
                .json({
                    success:
                        false,
                    mensaje:
                        error.message
                });

        }

    }
);


app.get(
    "/api/portal/carreras",
    async (req, res) => {

        try {

            const resultado =
                await portalDatos
                    .listarCarreras(
                        req.query
                    );


            res.json({
                success:
                    true,
                resultado
            });

        } catch (error) {

            res.status(500)
                .json({
                    success:
                        false,
                    mensaje:
                        error.message
                });

        }

    }
);


app.get(
    "/api/portal/instituciones",
    async (req, res) => {

        try {

            const resultado =
                await portalDatos
                    .listarInstituciones(
                        req.query
                    );


            res.json({
                success:
                    true,
                resultado
            });

        } catch (error) {

            res.status(500)
                .json({
                    success:
                        false,
                    mensaje:
                        error.message
                });

        }

    }
);


app.get(
    "/healthz",
    (req, res) => {

        return res
            .status(200)
            .json({
                status:
                    "ok",
                service:
                    "EduPeruSOA",
                databaseCheck:
                    false,
                externalChecks:
                    false
            });

    }
);


/* =========================================================
   DATABASE SERVICE
========================================================= */

app.get(
    "/api/database/health",
    async (req, res) => {

        try {

            const resultado =
                await probarConexion();


            return res.json({

                success:
                    true,

                proyecto:
                    "EduPeruSOA",

                servicio:
                    "DatabaseService",

                tipo:
                    "Utility Service",

                estado:
                    "OPERATIVO",

                motor:
                    "Microsoft SQL Server",

                resultado

            });

        } catch (error) {

            console.error(
                "Error SQL Server:",
                error.message
            );


            return res
                .status(503)
                .json({

                    success:
                        false,

                    proyecto:
                        "EduPeruSOA",

                    servicio:
                        "DatabaseService",

                    estado:
                        "ERROR",

                    motor:
                        "Microsoft SQL Server",

                    mensaje:
                        error.message

                });

        }

    }
);


/* =========================================================
   RUTAS DE APLICACIÃ“N
========================================================= */

app.use(
    "/api/auth",
    authRoutes
);


app.use(
    "/api/perfil",
    perfilRoutes
);


app.use(
    "/api/favoritos",
    favoritoRoutes
);


app.use(
    "/api/alertas",
    alertaRoutes
);


app.use(
    "/api/admin",
    adminRoutes
);


app.use(
    "/api/convocatorias",
    convocatoriaRoutes
);


app.use(
    "/api/postulaciones",
    postulacionRoutes
);


app.use(
    "/api/documentos",
    documentoRoutes
);


app.use(
    "/api/convenios",
    convenioRoutes
);


app.use(
    "/api/instituciones",
    institucionRoutes
);


app.use(
    "/api/regiones",
    regionRoutes
);


app.use(
    "/api/ubigeo",
    ubigeoRoutes
);


app.use(
    "/api/consulta",
    consultaRoutes
);


app.use(
    "/api/contratos",
    contratosRoutes
);


app.use(
    "/api/estadisticas",
    estadisticaRoutes
);


app.use(
    "/api/oportunidades",
    oportunidadDetalleRoutes
);


app.use(
    "/api/comparador-oportunidades",
    comparadorOportunidadesRoutes
);


/* =========================================================
   SERVICIOS EMPRESARIALES 19 - 24
========================================================= */

app.use(
    "/api/becas",
    becaRoutes
);


app.use(
    "/api/programas",
    programaEducativoRoutes
);


app.use(
    "/api/carreras",
    carreraRoutes
);


app.use(
    "/api/modalidades",
    modalidadEstudioRoutes
);


app.use(
    "/api/sedes",
    sedeEducativaRoutes
);


app.use(
    "/api/beneficios",
    beneficioRoutes
);


/* =========================================================
   SERVICIOS EMPRESARIALES 25 - 30
========================================================= */

app.use(
    "/api/cronogramas",
    cronogramaConvocatoriaRoutes
);


app.use(
    "/api/requisitos-elegibilidad",
    requisitoElegibilidadRoutes
);


app.use(
    "/api/elegibilidad",
    evaluacionElegibilidadRoutes
);


app.use(
    "/api/seguimiento-postulaciones",
    seguimientoPostulacionRoutes
);


app.use(
    "/api/historial",
    historialConsultaRoutes
);


app.use(
    "/api/recomendaciones",
    recomendacionEducativaRoutes
);


/* =========================================================
   SERVICIOS EMPRESARIALES 31 - 35
========================================================= */

app.use(
    "/api/busqueda",
    busquedaAvanzadaRoutes
);


app.use(
    "/api/notificaciones",
    notificacionRoutes
);


app.use(
    "/api/mis-documentos",
    documentoUsuarioRoutes
);


app.use(
    "/api/validacion-documentos",
    validacionDocumentoRoutes
);


app.use(
    "/api/reportes",
    reporteRoutes
);


/* =========================================================
   SERVICIOS EMPRESARIALES 36 - 40
========================================================= */

app.use(
    "/api/exportaciones",
    exportacionRoutes
);


app.use(
    "/api/auditoria",
    auditoriaRoutes
);


app.use(
    "/api/configuracion",
    configuracionRoutes
);


app.use(
    "/api/calendario",
    calendarioEducativoRoutes
);


app.use(
    "/api/orientacion",
    orientacionEducativaRoutes
);


app.use(
    "/api/observabilidad",
    observabilidadRoutes
);




app.use(
    "/api/hexagonal/pronabec",
    hexagonalPronabecRoutes
);

app.use(
    "/api/health",
    healthCheckRoutes
);


/*app.use(
    "/api/hermes",
    hermesRoutes
);

 =========================================================
   HOME
========================================================= */

app.get(
    "/",
    (req, res) => {
        return res.redirect(
            302,
            "/pages/login.html"
        );
    }
);


/* =========================================================
   404
========================================================= */

app.use(
    (req, res) => {

        res
            .status(404)
            .json({

                success:
                    false,

                proyecto:
                    "EduPeruSOA",

                mensaje:
                    "Ruta no encontrada.",

                ruta:
                    req.originalUrl

            });

    }
);


/* =========================================================
   MANEJADOR GLOBAL DE ERRORES
========================================================= */

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error("");
        console.error("==============================================");
        console.error("ERROR NO CONTROLADO");
        console.error("==============================================");

        console.error(
            "MÃ©todo:",
            req.method
        );

        console.error(
            "Ruta:",
            req.originalUrl
        );

        console.error(
            "Mensaje:",
            error.message
        );

        console.error("==============================================");
        console.error("");


        return res
            .status(
                error.statusCode ||
                500
            )
            .json({

                success:
                    false,

                proyecto:
                    "EduPeruSOA",

                mensaje:
                    error.message ||
                    "OcurriÃ³ un error interno en el servidor."

            });

    }
);


/* =========================================================
   INICIAR SERVIDOR
========================================================= */

app.listen(
    PORT,
    "0.0.0.0",
    async () => {

        console.log("");
        console.log("==============================================");
        console.log("               EDUPERÃš SOA");
        console.log("==============================================");
        console.log("");

        console.log(
            `Frontend:        http://localhost:${PORT}`
        );

        console.log(
            `API:             http://localhost:${PORT}/api`
        );

        console.log(
            `Swagger:         http://localhost:${PORT}/api-docs`
        );

        console.log(
            `OpenAPI JSON:    http://localhost:${PORT}/api-docs.json`
        );

        console.log(
            `Health:          http://localhost:${PORT}/api/health`
        );

        console.log(
            `Database:        http://localhost:${PORT}/api/database/health`
        );

        console.log(
            `Login:           http://localhost:${PORT}/api/auth/login`
        );

        console.log(
            `Mi perfil:       http://localhost:${PORT}/api/perfil`
        );

        console.log(
            `Favoritos:       http://localhost:${PORT}/api/favoritos`
        );

        console.log(
            `Alertas:         http://localhost:${PORT}/api/alertas`
        );

        console.log(
            `AdministraciÃ³n:  http://localhost:${PORT}/api/admin/resumen`
        );

        console.log(
            `Observabilidad:  http://localhost:${PORT}/api/observabilidad/resumen`
        );

        console.log(
            `Contratos:       http://localhost:${PORT}/api/contratos`
        );

        console.log(
            `Becas:           http://localhost:${PORT}/api/becas`
        );

        console.log(
            `Programas:       http://localhost:${PORT}/api/programas`
        );

        console.log(
            `Carreras:        http://localhost:${PORT}/api/carreras`
        );

        console.log(
            `Modalidades:     http://localhost:${PORT}/api/modalidades`
        );

        console.log(
            `Sedes:           http://localhost:${PORT}/api/sedes`
        );

        console.log(
            `Beneficios:      http://localhost:${PORT}/api/beneficios`
        );


        console.log("");
        console.log("----------------------------------------------");
        console.log("SQL SERVER");
        console.log("----------------------------------------------");


        try {

            const db =
                await probarConexion();


            console.log(
                "Estado:          CONECTADO"
            );

            console.log(
                `Base de datos:   ${db.baseDatos}`
            );

            console.log(
                `Fecha servidor:  ${db.fechaServidor}`
            );

        } catch (error) {

            console.log(
                "Estado:          NO CONECTADO"
            );

            console.log(
                `Motivo:          ${error.message}`
            );

        }


        console.log("");
        console.log("----------------------------------------------");
        console.log("SERVICIOS EDUPERÃš SOA");
        console.log("----------------------------------------------");

        console.log("01. ConvocatoriaService");
        console.log("02. PostulacionService");
        console.log("03. DocumentoRequisitoService");
        console.log("04. ConvenioService");
        console.log("05. IntegracionPronabecService");
        console.log("06. ConsultaEducativaService");
        console.log("07. EstadisticaService");
        console.log("08. OportunidadDetalleService");
        console.log("09. InstitucionService");
        console.log("10. RegionService");
        console.log("11. UbigeoService");
        console.log("12. HealthCheckService");
        console.log("13. AuthenticationService");
        console.log("14. DatabaseService");
        console.log("15. PerfilUsuarioService");
        console.log("16. FavoritoService");
        console.log("17. AlertaService");
        console.log("18. AdminService");
        console.log("19. BecaService");
        console.log("20. ProgramaEducativoService");
        console.log("21. CarreraService");
        console.log("22. ModalidadEstudioService");
        console.log("23. SedeEducativaService");
        console.log("24. BeneficioService");
        console.log("25. CronogramaConvocatoriaService");
        console.log("26. RequisitoElegibilidadService");
        console.log("27. EvaluacionElegibilidadService");
        console.log("28. SeguimientoPostulacionService");
        console.log("29. HistorialConsultaService");
        console.log("30. RecomendacionEducativaService");
        console.log("31. BusquedaAvanzadaService");
        console.log("32. NotificacionService");
        console.log("33. DocumentoUsuarioService");
        console.log("34. ValidacionDocumentoService");
        console.log("35. ReporteService");
        console.log("36. ExportacionService");
        console.log("37. AuditoriaService");
        console.log("38. ConfiguracionService");
        console.log("39. CalendarioEducativoService");
        console.log("40. OrientacionEducativaService");


        console.log("");
        console.log("----------------------------------------------");
        console.log("CONFIGURACIÃ“N");
        console.log("----------------------------------------------");

        console.log(
            "40 servicios implementados / 40 servicios empresariales registrados"
        );

        console.log(
            "SQL Server habilitado"
        );

        console.log(
            "AutenticaciÃ³n JWT habilitada"
        );

        console.log(
            "Perfil de usuario habilitado"
        );

        console.log(
            "Favoritos SQL Server habilitados"
        );

        console.log(
            "Alertas SQL Server habilitadas"
        );

        console.log(
            "Panel administrativo protegido por rol"
        );

        console.log(
            "DocumentaciÃ³n OpenAPI disponible"
        );


        console.log("");
        console.log("==============================================");
        console.log("              EDUPERÃš LISTO");
        console.log("==============================================");
        console.log("");

    }
);


/* =========================================================
   EXPORTAR APP
========================================================= */

module.exports =
    app;


