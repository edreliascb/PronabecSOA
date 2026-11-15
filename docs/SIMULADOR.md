# Simulador informativo de becas - EduPerú SOA

## Objetivo

Agregar una función visible para que un usuario autenticado pueda realizar una preevaluación informativa sobre oportunidades de beca recuperadas de las fuentes oficiales configuradas en EduPerú.

## Principio de integridad

El simulador no inventa requisitos ni declara elegibilidad oficial. Solo automatiza reglas que aparezcan de forma estructurada en la fuente oficial disponible. Cuando no existen datos suficientes, devuelve `NO_DETERMINABLE` o `REQUIERE_VALIDACION`.

## Endpoint

```http
POST /api/elegibilidad/simular
Authorization: Bearer <JWT>
Content-Type: application/json
```

Campos opcionales:

- `edad`
- `promedio`
- `departamento`
- `provincia`
- `distrito`
- `nivel_estudio`
- `carrera_interes`
- `institucion`
- `situacion_economica`
- `texto` para filtrar una beca o concurso

Si se omiten los campos de perfil, el servicio reutiliza los datos guardados en `PerfilesUsuario` cuando están disponibles.

## Estados

- `CUMPLE_PREEVALUACION`: los criterios estructurados automatizables coinciden.
- `REQUIERE_VALIDACION`: existen reglas o documentos que necesitan revisión manual.
- `NO_DETERMINABLE`: no hay reglas oficiales estructuradas suficientes.
- `NO_CUMPLE_PREEVALUACION`: al menos un criterio estructurado evaluable no coincide.

## Interfaz

Abrir:

```text
http://localhost:3000/pages/simulador.html
```

## Prueba por terminal

Con el servidor activo:

```powershell
npm run simulador:probar
```

El script solicita un usuario real de EduPerú, obtiene un JWT y ejecuta una simulación usando el perfil almacenado.
