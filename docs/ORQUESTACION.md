# Orquestación demostrable de EduPerú SOA

Endpoint: `GET /api/consulta/orquestacion`

La demostración coordina seis servicios:
- ConvocatoriaService
- PostulacionService
- DocumentoRequisitoService
- ConvenioService
- RegionService
- InstitucionService

Cada servicio tiene un timeout individual de 15 segundos. Si una fuente externa no responde, el orquestador registra `NO_DISPONIBLE` y continúa con los demás servicios. No se generan datos ficticios.

La prueba se ejecuta con:

```powershell
npm run orquestacion:probar
```
