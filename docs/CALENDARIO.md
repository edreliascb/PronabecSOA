# Calendario educativo — EduPerú SOA

## Endpoint

`GET /api/calendario` requiere JWT.

Opcionalmente acepta `?anio=2026&mes=11`.

## Fuentes

- `CronogramaConvocatoriaService`: fechas publicadas por fuentes oficiales disponibles.
- `AlertaService`: recordatorios del usuario almacenados en EduPeruDB.
- `SeguimientoPostulacionService`: actividad personal almacenada en EduPeruDB.

Si la fuente oficial no publica o no responde, EduPerú no genera fechas ficticias.

## Frontend

`/pages/calendario.html` muestra:

- vista mensual;
- filtros Todos / Oficiales / Mi espacio;
- próximos eventos;
- detalle del mes;
- disponibilidad de fuente oficial.

## Prueba

```powershell
npm run calendario:probar
```
