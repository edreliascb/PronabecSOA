/* =========================================================
   EDUPERÚ SOA
   CATÁLOGO DE 40 SERVICIOS EMPRESARIALES

   INVENTARIO ACTUAL:
   - 40 servicios se encuentran IMPLEMENTADOS.
   - 0 servicios están PLANIFICADOS.
   - Catálogo sincronizado con la versión 1.9.0.
========================================================= */

const principiosThomasErl = [
    "Standardized Service Contract",
    "Service Loose Coupling",
    "Service Abstraction",
    "Service Reusability",
    "Service Autonomy",
    "Service Statelessness",
    "Service Discoverability",
    "Service Composability"
];

const contratos = [
    {
        "id": 1,
        "nombre": "ConvocatoriaService",
        "dominio": "Oportunidades educativas",
        "tipo": "Servicio de Entidad",
        "descripcion": "Consulta convocatorias y oportunidades educativas desde fuentes oficiales de PRONABEC.",
        "endpoint": "/api/convocatorias",
        "dependencias": [
            "IntegracionPronabecService"
        ],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ],
        "fuenteDatos": "Fuentes oficiales PRONABEC / Plataforma Nacional de Datos Abiertos",
        "fuenteOficial": true,
        "usaDatosDemo": false
    },
    {
        "id": 2,
        "nombre": "PostulacionService",
        "dominio": "Postulaciones",
        "tipo": "Servicio de Entidad",
        "descripcion": "Gestiona información de postulaciones publicada por PRONABEC.",
        "endpoint": "/api/postulaciones",
        "dependencias": [
            "IntegracionPronabecService"
        ],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ],
        "fuenteDatos": "Fuentes oficiales PRONABEC / Plataforma Nacional de Datos Abiertos",
        "fuenteOficial": true,
        "usaDatosDemo": false
    },
    {
        "id": 3,
        "nombre": "DocumentoRequisitoService",
        "dominio": "Requisitos y documentos",
        "tipo": "Servicio de Entidad",
        "descripcion": "Consulta documentos y requisitos disponibles en fuentes oficiales integradas.",
        "endpoint": "/api/documentos",
        "dependencias": [
            "IntegracionPronabecService"
        ],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ],
        "fuenteDatos": "Fuentes oficiales PRONABEC / Plataforma Nacional de Datos Abiertos",
        "fuenteOficial": true,
        "usaDatosDemo": false
    },
    {
        "id": 4,
        "nombre": "ConvenioService",
        "dominio": "Convenios",
        "tipo": "Servicio de Entidad",
        "descripcion": "Consulta convenios educativos publicados por PRONABEC.",
        "endpoint": "/api/convenios",
        "dependencias": [
            "IntegracionPronabecService"
        ],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ],
        "fuenteDatos": "Fuentes oficiales PRONABEC / Plataforma Nacional de Datos Abiertos",
        "fuenteOficial": true,
        "usaDatosDemo": false
    },
    {
        "id": 5,
        "nombre": "IntegracionPronabecService",
        "dominio": "Integración externa",
        "tipo": "Servicio Utility",
        "descripcion": "Centraliza el consumo de fuentes oficiales PRONABEC sin datos ficticios.",
        "endpoint": "Interno",
        "dependencias": [],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability",
            "Service Autonomy"
        ],
        "fuenteDatos": "Fuentes oficiales PRONABEC / Plataforma Nacional de Datos Abiertos",
        "fuenteOficial": true,
        "usaDatosDemo": false
    },
    {
        "id": 6,
        "nombre": "ConsultaEducativaService",
        "dominio": "Consulta integrada",
        "tipo": "Servicio Orquestador",
        "descripcion": "Compone varios servicios educativos para entregar una consulta consolidada.",
        "endpoint": "/api/consulta",
        "dependencias": [
            "ConvocatoriaService",
            "PostulacionService",
            "DocumentoRequisitoService",
            "ConvenioService"
        ],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability",
            "Service Composability"
        ]
    },
    {
        "id": 7,
        "nombre": "EstadisticaService",
        "dominio": "Analítica",
        "tipo": "Servicio de Tarea / Analítica",
        "descripcion": "Genera indicadores sobre los registros recuperados por EduPerú.",
        "endpoint": "/api/estadisticas",
        "dependencias": [
            "ConvocatoriaService",
            "PostulacionService"
        ],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 8,
        "nombre": "OportunidadDetalleService",
        "dominio": "Oportunidades educativas",
        "tipo": "Servicio de Tarea / Composición",
        "descripcion": "Compone información detallada de una oportunidad educativa.",
        "endpoint": "/api/oportunidades/:indice",
        "dependencias": [
            "ConvocatoriaService",
            "DocumentoRequisitoService"
        ],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability",
            "Service Composability"
        ]
    },
    {
        "id": 9,
        "nombre": "InstitucionService",
        "dominio": "Instituciones educativas",
        "tipo": "Servicio de Catálogo / Composición",
        "descripcion": "Construye el catálogo institucional disponible para la plataforma.",
        "endpoint": "/api/instituciones",
        "dependencias": [
            "ConvenioService"
        ],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability",
            "Service Composability"
        ]
    },
    {
        "id": 10,
        "nombre": "RegionService",
        "dominio": "Territorio",
        "tipo": "Servicio de Catálogo",
        "descripcion": "Proporciona el catálogo departamental utilizado por EduPerú.",
        "endpoint": "/api/regiones",
        "dependencias": [],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 11,
        "nombre": "UbigeoService",
        "dominio": "Territorio",
        "tipo": "Servicio de Catálogo Territorial",
        "descripcion": "Gestiona navegación territorial por departamento, provincia y distrito.",
        "endpoint": "/api/ubigeo",
        "dependencias": [],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 12,
        "nombre": "HealthCheckService",
        "dominio": "Monitoreo y disponibilidad",
        "tipo": "Servicio Utility / Monitoreo",
        "descripcion": "Supervisa disponibilidad, modo de operación y latencia de servicios principales.",
        "endpoint": "/api/health",
        "dependencias": [],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability",
            "Service Autonomy"
        ]
    },
    {
        "id": 13,
        "nombre": "AuthenticationService",
        "dominio": "Identidad y acceso",
        "tipo": "Servicio de Seguridad",
        "descripcion": "Gestiona registro, inicio de sesión, JWT y autorización por roles.",
        "endpoint": "/api/auth",
        "dependencias": [
            "DatabaseService"
        ],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 14,
        "nombre": "DatabaseService",
        "dominio": "Persistencia e infraestructura",
        "tipo": "Servicio Utility / Infraestructura",
        "descripcion": "Centraliza la conexión y verificación de Microsoft SQL Server.",
        "endpoint": "/api/database/health",
        "dependencias": [],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability",
            "Service Autonomy"
        ]
    },
    {
        "id": 15,
        "nombre": "PerfilUsuarioService",
        "dominio": "Usuario",
        "tipo": "Servicio de Entidad",
        "descripcion": "Gestiona información académica y territorial del usuario.",
        "endpoint": "/api/perfil",
        "dependencias": [
            "AuthenticationService",
            "DatabaseService"
        ],
        "autenticacion": "JWT",
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 16,
        "nombre": "FavoritoService",
        "dominio": "Personalización",
        "tipo": "Servicio de Entidad",
        "descripcion": "Gestiona recursos favoritos del usuario autenticado.",
        "endpoint": "/api/favoritos",
        "dependencias": [
            "AuthenticationService",
            "DatabaseService"
        ],
        "autenticacion": "JWT",
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 17,
        "nombre": "AlertaService",
        "dominio": "Personalización y seguimiento",
        "tipo": "Servicio de Entidad / Tarea",
        "descripcion": "Gestiona alertas personalizadas sobre oportunidades educativas.",
        "endpoint": "/api/alertas",
        "dependencias": [
            "AuthenticationService",
            "DatabaseService"
        ],
        "autenticacion": "JWT",
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 18,
        "nombre": "AdminService",
        "dominio": "Administración del sistema",
        "tipo": "Servicio de Tarea / Administración",
        "descripcion": "Expone funciones administrativas protegidas por rol ADMINISTRADOR.",
        "endpoint": "/api/admin",
        "dependencias": [
            "AuthenticationService",
            "DatabaseService"
        ],
        "autenticacion": "JWT + ADMINISTRADOR",
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 19,
        "nombre": "BecaService",
        "dominio": "Becas",
        "tipo": "Servicio de Entidad",
        "descripcion": "Centraliza el catálogo de becas y consulta de oportunidades.",
        "endpoint": "/api/becas",
        "dependencias": [
            "ConvocatoriaService"
        ],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 20,
        "nombre": "ProgramaEducativoService",
        "dominio": "Programas educativos",
        "tipo": "Servicio de Entidad",
        "descripcion": "Gestiona programas educativos asociados a instituciones y oportunidades.",
        "endpoint": "/api/programas",
        "dependencias": [
            "InstitucionService",
            "ConvocatoriaService"
        ],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 21,
        "nombre": "CarreraService",
        "dominio": "Carreras",
        "tipo": "Servicio de Catálogo",
        "descripcion": "Expone un catálogo normalizado de carreras y especialidades.",
        "endpoint": "/api/carreras",
        "dependencias": [
            "ConvocatoriaService",
            "ProgramaEducativoService"
        ],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 22,
        "nombre": "ModalidadEstudioService",
        "dominio": "Oferta académica",
        "tipo": "Servicio de Catálogo",
        "descripcion": "Clasifica modalidades de estudio presencial, virtual e híbrida.",
        "endpoint": "/api/modalidades",
        "dependencias": [],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 23,
        "nombre": "SedeEducativaService",
        "dominio": "Instituciones educativas",
        "tipo": "Servicio de Entidad / Catálogo",
        "descripcion": "Gestiona sedes asociadas a instituciones educativas.",
        "endpoint": "/api/sedes",
        "dependencias": [
            "InstitucionService",
            "UbigeoService"
        ],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 24,
        "nombre": "BeneficioService",
        "dominio": "Beneficios",
        "tipo": "Servicio de Entidad",
        "descripcion": "Gestiona beneficios asociados a becas y convocatorias.",
        "endpoint": "/api/beneficios",
        "dependencias": [
            "BecaService",
            "ConvocatoriaService"
        ],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 25,
        "nombre": "CronogramaConvocatoriaService",
        "dominio": "Convocatorias",
        "tipo": "Servicio de Entidad / Calendario",
        "descripcion": "Organiza etapas y fechas relevantes de convocatorias.",
        "endpoint": "/api/cronogramas",
        "dependencias": [
            "ConvocatoriaService"
        ],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 26,
        "nombre": "RequisitoElegibilidadService",
        "dominio": "Elegibilidad",
        "tipo": "Servicio de Reglas de Negocio",
        "descripcion": "Expone reglas y requisitos de elegibilidad.",
        "endpoint": "/api/requisitos-elegibilidad",
        "dependencias": [
            "DocumentoRequisitoService",
            "ConvocatoriaService"
        ],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 27,
        "nombre": "EvaluacionElegibilidadService",
        "dominio": "Elegibilidad",
        "tipo": "Servicio de Tarea / Reglas",
        "descripcion": "Evalúa el perfil del usuario frente a requisitos de una oportunidad.",
        "endpoint": "/api/elegibilidad",
        "dependencias": [
            "PerfilUsuarioService",
            "RequisitoElegibilidadService",
            "ConvocatoriaService"
        ],
        "autenticacion": "JWT",
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 28,
        "nombre": "SeguimientoPostulacionService",
        "dominio": "Postulaciones",
        "tipo": "Servicio de Tarea",
        "descripcion": "Permite registrar y consultar seguimiento personal de postulaciones.",
        "endpoint": "/api/seguimiento-postulaciones",
        "dependencias": [
            "AuthenticationService",
            "PostulacionService",
            "DatabaseService"
        ],
        "autenticacion": "JWT",
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 29,
        "nombre": "HistorialConsultaService",
        "dominio": "Usuario y analítica",
        "tipo": "Servicio de Entidad",
        "descripcion": "Registra el historial de consultas del usuario.",
        "endpoint": "/api/historial",
        "dependencias": [
            "AuthenticationService",
            "DatabaseService"
        ],
        "autenticacion": "JWT",
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 30,
        "nombre": "RecomendacionEducativaService",
        "dominio": "Personalización",
        "tipo": "Servicio de Tarea / Composición",
        "descripcion": "Genera recomendaciones personalizadas según perfil e intereses.",
        "endpoint": "/api/recomendaciones",
        "dependencias": [
            "PerfilUsuarioService",
            "FavoritoService",
            "EvaluacionElegibilidadService"
        ],
        "autenticacion": "JWT",
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability",
            "Service Composability"
        ]
    },
    {
        "id": 31,
        "nombre": "BusquedaAvanzadaService",
        "dominio": "Búsqueda",
        "tipo": "Servicio de Tarea / Composición",
        "descripcion": "Realiza búsquedas multicriterio sobre oportunidades y catálogos.",
        "endpoint": "/api/busqueda",
        "dependencias": [
            "ConvocatoriaService",
            "CarreraService",
            "InstitucionService",
            "RegionService"
        ],
        "autenticacion": null,
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability",
            "Service Composability"
        ]
    },
    {
        "id": 32,
        "nombre": "NotificacionService",
        "dominio": "Comunicación",
        "tipo": "Servicio de Tarea",
        "descripcion": "Gestiona notificaciones internas del usuario.",
        "endpoint": "/api/notificaciones",
        "dependencias": [
            "AlertaService",
            "CronogramaConvocatoriaService",
            "DatabaseService"
        ],
        "autenticacion": "JWT",
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 33,
        "nombre": "DocumentoUsuarioService",
        "dominio": "Documentación personal",
        "tipo": "Servicio de Entidad",
        "descripcion": "Gestiona metadatos de documentos personales.",
        "endpoint": "/api/mis-documentos",
        "dependencias": [
            "AuthenticationService",
            "DatabaseService"
        ],
        "autenticacion": "JWT",
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 34,
        "nombre": "ValidacionDocumentoService",
        "dominio": "Documentación personal",
        "tipo": "Servicio de Tarea / Validación",
        "descripcion": "Valida metadatos, vigencia y correspondencia documental.",
        "endpoint": "/api/validacion-documentos",
        "dependencias": [
            "DocumentoUsuarioService",
            "DocumentoRequisitoService"
        ],
        "autenticacion": "JWT",
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 35,
        "nombre": "ReporteService",
        "dominio": "Reportes",
        "tipo": "Servicio de Tarea / Analítica",
        "descripcion": "Genera reportes consolidados del sistema.",
        "endpoint": "/api/reportes",
        "dependencias": [
            "AdminService",
            "EstadisticaService",
            "AuditoriaService"
        ],
        "autenticacion": "JWT + ADMINISTRADOR",
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 36,
        "nombre": "ExportacionService",
        "dominio": "Interoperabilidad",
        "tipo": "Servicio Utility",
        "descripcion": "Convierte resultados y reportes a formatos exportables.",
        "endpoint": "/api/exportaciones",
        "dependencias": [
            "ReporteService",
            "BusquedaAvanzadaService"
        ],
        "autenticacion": "JWT",
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 37,
        "nombre": "AuditoriaService",
        "dominio": "Seguridad y auditoría",
        "tipo": "Servicio Utility / Auditoría",
        "descripcion": "Registra eventos relevantes para trazabilidad y seguridad.",
        "endpoint": "/api/auditoria",
        "dependencias": [
            "AuthenticationService",
            "AdminService",
            "DatabaseService"
        ],
        "autenticacion": "JWT + ADMINISTRADOR",
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 38,
        "nombre": "ConfiguracionService",
        "dominio": "Configuración",
        "tipo": "Servicio Utility / Administración",
        "descripcion": "Gestiona parámetros funcionales no sensibles del sistema.",
        "endpoint": "/api/configuracion",
        "dependencias": [
            "AuthenticationService",
            "DatabaseService"
        ],
        "autenticacion": "JWT + ADMINISTRADOR",
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability"
        ]
    },
    {
        "id": 39,
        "nombre": "CalendarioEducativoService",
        "dominio": "Planificación educativa",
        "tipo": "Servicio de Composición",
        "descripcion": "Consolida fechas de convocatorias, alertas y seguimientos.",
        "endpoint": "/api/calendario",
        "dependencias": [
            "CronogramaConvocatoriaService",
            "AlertaService",
            "SeguimientoPostulacionService"
        ],
        "autenticacion": "JWT",
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability",
            "Service Composability"
        ]
    },
    {
        "id": 40,
        "nombre": "OrientacionEducativaService",
        "dominio": "Orientación educativa",
        "tipo": "Servicio de Tarea / Composición",
        "descripcion": "Genera orientación educativa personalizada a partir del perfil.",
        "endpoint": "/api/orientacion",
        "dependencias": [
            "PerfilUsuarioService",
            "CarreraService",
            "ProgramaEducativoService",
            "RecomendacionEducativaService"
        ],
        "autenticacion": "JWT",
        "estadoImplementacion": "IMPLEMENTADO",
        "principiosThomasErl": [
            "Standardized Service Contract",
            "Service Loose Coupling",
            "Service Abstraction",
            "Service Reusability",
            "Service Discoverability",
            "Service Composability"
        ]
    }
];

function obtenerContratos() {
    return contratos;
}

function obtenerContratoPorNombre(nombre) {
    if (!nombre) return null;

    const buscado = String(nombre).trim().toLowerCase();

    return contratos.find(
        contrato =>
            String(contrato.nombre)
                .toLowerCase() === buscado
    ) || null;
}

function obtenerPrincipiosThomasErl() {
    return principiosThomasErl;
}

function obtenerResumenContratos() {
    const porTipo = {};

    contratos.forEach(contrato => {
        const tipo = contrato.tipo || "Sin clasificar";
        porTipo[tipo] = (porTipo[tipo] || 0) + 1;
    });

    const implementados = contratos.filter(
        contrato =>
            contrato.estadoImplementacion === "IMPLEMENTADO"
    ).length;

    const planificados = contratos.filter(
        contrato =>
            contrato.estadoImplementacion === "PLANIFICADO"
    ).length;

    return {
        total: contratos.length,
        implementados,
        planificados,
        conAutenticacion: contratos.filter(
            contrato => Boolean(contrato.autenticacion)
        ).length,
        porTipo
    };
}

module.exports = {
    obtenerContratos,
    obtenerContratoPorNombre,
    obtenerPrincipiosThomasErl,
    obtenerResumenContratos
};
