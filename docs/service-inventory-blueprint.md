# EDUPERÚ SOA
## Service Inventory & Architecture Blueprint

---

# 1. Información general

**Proyecto:** EduPerú SOA  
**Tipo:** Plataforma de consulta de oportunidades educativas  
**Arquitectura:** Arquitectura Orientada a Servicios - SOA  
**Backend:** Node.js + Express  
**Frontend:** HTML + CSS + JavaScript  
**Integración externa principal:** PRONABEC  
**Número actual de servicios SOA:** 12

EduPerú integra servicios educativos, territoriales,
analíticos y de monitoreo bajo una arquitectura orientada
a servicios.

El sistema está diseñado para mantener bajo acoplamiento,
reutilización, descubribilidad y composición entre servicios.

---

# 2. Objetivo arquitectónico

Centralizar información educativa proveniente de diferentes
servicios y presentarla mediante contratos independientes,
reutilizables y desacoplados.

La plataforma contempla:

- oportunidades educativas;
- postulaciones;
- documentos;
- convenios;
- instituciones;
- carreras;
- territorio;
- analítica;
- composición;
- contratos SOA;
- monitoreo de servicios.

---

# 3. Arquitectura general

```mermaid
flowchart TB

    USER[Usuario]

    FRONT[Frontend EduPerú]

    API[Node.js / Express API]

    USER --> FRONT

    FRONT --> API


    API --> CONV[ConvocatoriaService]

    API --> POST[PostulacionService]

    API --> DOC[DocumentoRequisitoService]

    API --> CONV2[ConvenioService]

    API --> INST[InstitucionService]

    API --> REGION[RegionService]

    API --> UBI[UbigeoService]

    API --> CONSULTA[ConsultaEducativaService]

    API --> EST[EstadisticaService]

    API --> OPORT[OportunidadDetalleService]

    API --> HEALTH[HealthCheckService]

    API --> CONTRACTS[ContratosService]


    CONV --> INTEGRACION[IntegracionPronabecService]

    POST --> INTEGRACION

    DOC --> INTEGRACION

    CONV2 --> INTEGRACION


    INTEGRACION --> PRONABEC[PRONABEC API]


    CONSULTA --> CONV

    CONSULTA --> POST

    CONSULTA --> DOC

    CONSULTA --> CONV2


    EST --> CONV

    EST --> POST

    EST --> DOC

    EST --> CONV2


    OPORT --> CONV

    OPORT --> DOC


    INST --> CONV2


    HEALTH --> CONV

    HEALTH --> POST

    HEALTH --> DOC

    HEALTH --> CONV2

    HEALTH --> INST

    HEALTH --> REGION

    HEALTH --> UBI