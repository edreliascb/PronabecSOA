# EduPerú SOA — Arquitectura Hexagonal PRONABEC V2

Esta implementación aplica arquitectura hexagonal **solo al límite externo PRONABEC**, de forma progresiva y sin reescribir los 40 servicios.

## Capas

- **Domain**: contrato `PronabecPort`, catálogo/allowlist de recursos y errores de dominio.
- **Application**: `ConsultarPronabecUseCase`, que decide primario/fallback sin conocer Axios ni URLs.
- **Infrastructure**: `PronabecApiAdapter` y `PortalNacionalAdapter`, que reutilizan `integracionPronabec.service.js`.
- **Entrada HTTP**: controller + route protegida por JWT para demostrar la arquitectura en ejecución.

## Flujo

`HTTP -> Controller -> UseCase -> PronabecPort -> Adapter API -> PRONABEC`

Ante un fallo técnico recuperable:

`HTTP -> Controller -> UseCase -> Adapter API (falla) -> Adapter Portal Nacional -> respuesta`

No se usa fallback para errores de negocio no recuperables. Así se evita ocultar fallos reales.

## Seguridad y compatibilidad

- El endpoint requiere JWT.
- No modifica tablas de SQL Server.
- No reemplaza los 40 servicios empresariales.
- Conserva Timeout/Retry/Circuit Breaker de `integracionPronabec.service.js` si Resiliencia V1 ya está instalada.
- Conserva `traceId` cuando Observabilidad V1 está instalada.
- El instalador hace backup de `app.js` y `package.json` y los parchea en lugar de reemplazarlos completos.

## Endpoint de demostración

`GET /api/hexagonal/pronabec/recursos`

`GET /api/hexagonal/pronabec/ConvocatoriaCarreraVigentes`

Ambos requieren `Authorization: Bearer <JWT>`.
