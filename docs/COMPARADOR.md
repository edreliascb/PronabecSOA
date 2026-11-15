# Comparador de oportunidades - EduPerú SOA

## Objetivo

Permite seleccionar entre 2 y 3 registros del catálogo de oportunidades y compararlos usando información disponible en servicios oficiales del proyecto.

## Endpoint

```http
POST /api/comparador-oportunidades
Content-Type: application/json
```

El cuerpo contiene `selecciones` con un máximo de 3 elementos.

## Datos comparados

- carrera;
- institución;
- región o sede;
- convocatoria;
- estado publicado;
- fechas oficiales cuando existe relación verificable;
- beneficios oficiales relacionados;
- requisitos oficiales relacionados;
- verificación de institución en el catálogo derivado;
- fuentes utilizadas.

## Política de integridad

El comparador no supone relaciones que la fuente no permite demostrar. Cuando no existe información oficial asociable, muestra `N/D`. Esto no significa que un beneficio o requisito no exista, sino que no pudo verificarse automáticamente con las fuentes consultadas.

## Prueba

```powershell
npm run comparador:probar
```
