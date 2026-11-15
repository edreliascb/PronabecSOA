# Patrón SAGA en EduPerú SOA

## Objetivo

La SAGA implementada coordina una operación compuesta de seguimiento de postulación sin utilizar una transacción distribuida global.

## Flujo

1. `SeguimientoPostulacionService` crea el seguimiento.
2. `DocumentoUsuarioService` registra metadatos de documento si fueron enviados.
3. `AlertaService` crea una alerta para el usuario.
4. `NotificacionService` crea una notificación.
5. `AuditoriaService` registra el resultado.

Si cualquiera de los pasos falla, `SagaSeguimientoService` ejecuta las compensaciones disponibles en orden inverso.

## Endpoint

```http
POST /api/seguimiento-postulaciones/saga
Authorization: Bearer <JWT>
Content-Type: application/json
```

Ejemplo mínimo:

```json
{
  "seguimiento": {
    "id_postulacion": "POST-001",
    "titulo": "Beca 18 - seguimiento",
    "estado": "EN_SEGUIMIENTO",
    "notas": "Prueba SAGA"
  }
}
```

## Prueba automática

Con SQL Server disponible y `.env` configurado:

```powershell
npm run saga:probar
```

El script ejecuta:

- una SAGA exitosa;
- una SAGA con fallo controlado antes de auditoría;
- la compensación inversa de notificación, alerta, documento y seguimiento.

El parámetro `forzar_fallo_en` del endpoint solo se acepta fuera de `NODE_ENV=production`.
