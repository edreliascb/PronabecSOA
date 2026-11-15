# Seguimiento visual de postulaciones

Pantalla: `/pages/seguimiento.html`

API protegida por JWT: `/api/seguimiento-postulaciones`

## Funciones
- crear un seguimiento personal;
- visualizar progreso y etapas;
- cambiar estado;
- editar título y notas;
- consultar historial real de cambios;
- filtrar activos, postulados y finalizados;
- resumen de progreso del usuario.

## Estados principales
`IDENTIFICADA`, `REQUISITOS_REVISADOS`, `DOCUMENTOS_EN_PROCESO`, `LISTA_PARA_POSTULAR`, `POSTULADA`, `EN_EVALUACION`, `RESULTADO_DISPONIBLE`, `ADMITIDA`, `NO_SELECCIONADA`, `CANCELADA`.

La tabla `dbo.HistorialSeguimientos` se crea de forma idempotente al usar el servicio si no existe.

Este módulo es de organización personal. No representa ni modifica el estado oficial de una postulación en PRONABEC.
