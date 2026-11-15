const { obtenerPool, sql } = require('../config/database');
const { crearError } = require('./serviciosEmpresariales.helper');

const ESTADOS = {
    IDENTIFICADA: { orden: 1, progreso: 10, etiqueta: 'Oportunidad identificada' },
    EN_SEGUIMIENTO: { orden: 1, progreso: 15, etiqueta: 'En seguimiento' },
    REQUISITOS_REVISADOS: { orden: 2, progreso: 25, etiqueta: 'Requisitos revisados' },
    DOCUMENTOS_EN_PROCESO: { orden: 3, progreso: 45, etiqueta: 'Documentación en proceso' },
    LISTA_PARA_POSTULAR: { orden: 4, progreso: 60, etiqueta: 'Lista para postular' },
    POSTULADA: { orden: 5, progreso: 75, etiqueta: 'Postulación realizada' },
    EN_EVALUACION: { orden: 6, progreso: 88, etiqueta: 'En evaluación' },
    RESULTADO_DISPONIBLE: { orden: 7, progreso: 95, etiqueta: 'Resultado disponible' },
    ADMITIDA: { orden: 8, progreso: 100, etiqueta: 'Admitida / seleccionada' },
    NO_SELECCIONADA: { orden: 8, progreso: 100, etiqueta: 'No seleccionada' },
    CANCELADA: { orden: 8, progreso: 100, etiqueta: 'Seguimiento cancelado' }
};

const ETAPAS_VISUALES = [
    { clave: 'IDENTIFICADA', titulo: 'Oportunidad identificada', progreso: 10 },
    { clave: 'REQUISITOS_REVISADOS', titulo: 'Requisitos revisados', progreso: 25 },
    { clave: 'DOCUMENTOS_EN_PROCESO', titulo: 'Documentación', progreso: 45 },
    { clave: 'LISTA_PARA_POSTULAR', titulo: 'Lista para postular', progreso: 60 },
    { clave: 'POSTULADA', titulo: 'Postulación realizada', progreso: 75 },
    { clave: 'EN_EVALUACION', titulo: 'Evaluación', progreso: 88 },
    { clave: 'RESULTADO_DISPONIBLE', titulo: 'Resultado', progreso: 95 }
];

function normalizarEstado(estado) {
    const valor = String(estado || '').trim().toUpperCase();
    const alias = {
        PENDIENTE: 'IDENTIFICADA',
        EN_PROCESO: 'DOCUMENTOS_EN_PROCESO',
        POSTULADO: 'POSTULADA',
        EVALUACION: 'EN_EVALUACION',
        RESULTADO: 'RESULTADO_DISPONIBLE',
        SELECCIONADA: 'ADMITIDA',
        GANADA: 'ADMITIDA',
        RECHAZADA: 'NO_SELECCIONADA'
    };
    return alias[valor] || valor;
}

function metaEstado(estado) {
    const clave = normalizarEstado(estado);
    return ESTADOS[clave] || { orden: 0, progreso: 0, etiqueta: clave || 'Sin estado' };
}

function enriquecerSeguimiento(registro) {
    if (!registro) return null;
    const estado = normalizarEstado(registro.estado_visual || registro.estado);
    const meta = metaEstado(estado);
    const terminal = ['ADMITIDA', 'NO_SELECCIONADA', 'CANCELADA'].includes(estado);

    const limpio = { ...registro };
    delete limpio.estado_visual;

    return {
        ...limpio,
        estado,
        estado_etiqueta: meta.etiqueta,
        progreso: meta.progreso,
        terminal,
        etapas: ETAPAS_VISUALES.map((etapa) => ({
            ...etapa,
            completada: terminal ? true : meta.progreso >= etapa.progreso,
            actual: !terminal && meta.progreso >= etapa.progreso &&
                !ETAPAS_VISUALES.some((otra) => otra.progreso > etapa.progreso && otra.progreso <= meta.progreso)
        }))
    };
}

async function existeHistorial(pool) {
    const r = await pool.request().query(`
        SELECT CASE WHEN OBJECT_ID('dbo.HistorialSeguimientos', 'U') IS NULL THEN 0 ELSE 1 END AS existe
    `);
    return Number(r.recordset?.[0]?.existe || 0) === 1;
}

async function asegurarHistorial(pool) {
    try {
        if (!(await existeHistorial(pool))) {
            /*
               Se usa SQL dinámico para evitar problemas de compilación de SQL Server
               cuando CREATE TABLE y CREATE INDEX apuntan a un objeto recién creado
               dentro del mismo batch.
            */
            await pool.request().query(`
                EXEC(N'
                    CREATE TABLE dbo.HistorialSeguimientos (
                        id_historial INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                        id_seguimiento INT NOT NULL,
                        id_usuario INT NOT NULL,
                        accion NVARCHAR(60) NOT NULL,
                        estado_anterior NVARCHAR(50) NULL,
                        estado_nuevo NVARCHAR(50) NULL,
                        detalle NVARCHAR(500) NULL,
                        fecha_evento DATETIME2 NOT NULL
                            CONSTRAINT DF_HistorialSeguimientos_Fecha DEFAULT SYSDATETIME()
                    )
                ')
            `);
        }

        const indice = await pool.request().query(`
            SELECT CASE WHEN EXISTS (
                SELECT 1
                FROM sys.indexes
                WHERE name = 'IX_HistorialSeguimientos_Seguimiento'
                  AND object_id = OBJECT_ID('dbo.HistorialSeguimientos')
            ) THEN 1 ELSE 0 END AS existe
        `);

        if (Number(indice.recordset?.[0]?.existe || 0) === 0) {
            await pool.request().query(`
                CREATE INDEX IX_HistorialSeguimientos_Seguimiento
                ON dbo.HistorialSeguimientos(id_seguimiento, id_usuario, fecha_evento DESC)
            `);
        }

        return true;
    } catch (error) {
        // El seguimiento principal debe seguir funcionando aunque la tabla de historial
        // no pueda crearse por permisos. El error queda disponible en el log del servidor.
        console.error('[SeguimientoPostulacionService] No se pudo preparar HistorialSeguimientos:', error.message);
        return false;
    }
}

async function registrarHistorial(pool, datos) {
    const disponible = await asegurarHistorial(pool);
    if (!disponible) return false;

    await pool.request()
        .input('idSeguimiento', sql.Int, Number(datos.idSeguimiento))
        .input('idUsuario', sql.Int, Number(datos.idUsuario))
        .input('accion', sql.NVarChar(60), String(datos.accion || 'ACTUALIZACION').slice(0, 60))
        .input('estadoAnterior', sql.NVarChar(50), datos.estadoAnterior || null)
        .input('estadoNuevo', sql.NVarChar(50), datos.estadoNuevo || null)
        .input('detalle', sql.NVarChar(500), datos.detalle ? String(datos.detalle).slice(0, 500) : null)
        .query(`
            INSERT INTO dbo.HistorialSeguimientos
                (id_seguimiento, id_usuario, accion, estado_anterior, estado_nuevo, detalle)
            VALUES
                (@idSeguimiento, @idUsuario, @accion, @estadoAnterior, @estadoNuevo, @detalle)
        `);
    return true;
}

async function obtenerEstadosPermitidosBD(pool) {
    try {
        const r = await pool.request().query(`
            SELECT cc.definition
            FROM sys.check_constraints cc
            WHERE cc.parent_object_id = OBJECT_ID('dbo.SeguimientosPostulacion')
              AND cc.definition LIKE '%estado%'
        `);

        const permitidos = new Set();
        for (const row of r.recordset || []) {
            const texto = String(row.definition || '');
            for (const m of texto.matchAll(/N?'([^']+)'/g)) {
                permitidos.add(String(m[1]).trim().toUpperCase());
            }
        }
        return permitidos;
    } catch {
        return new Set();
    }
}

async function estadoFisicoCompatible(pool, estadoLogico) {
    const deseado = normalizarEstado(estadoLogico);
    const permitidos = await obtenerEstadosPermitidosBD(pool);

    // Sin CHECK detectable, la tabla admite el estado visual directamente.
    if (!permitidos.size || permitidos.has(deseado)) return deseado;

    const tempranos = ['IDENTIFICADA', 'REQUISITOS_REVISADOS', 'DOCUMENTOS_EN_PROCESO', 'LISTA_PARA_POSTULAR'];
    const postulacion = ['POSTULADA', 'EN_EVALUACION', 'RESULTADO_DISPONIBLE'];
    const terminales = ['ADMITIDA', 'NO_SELECCIONADA', 'CANCELADA'];

    let candidatos = [deseado];
    if (tempranos.includes(deseado)) {
        candidatos = ['EN_SEGUIMIENTO', 'EN_PROCESO', 'PENDIENTE', deseado];
    } else if (postulacion.includes(deseado)) {
        candidatos = ['POSTULADA', 'POSTULADO', 'EN_SEGUIMIENTO', 'EN_PROCESO', deseado];
    } else if (terminales.includes(deseado)) {
        candidatos = ['FINALIZADA', 'FINALIZADO', 'COMPLETADA', 'COMPLETADO', 'EN_SEGUIMIENTO', deseado];
    }

    return candidatos.find((x) => permitidos.has(x)) || [...permitidos][0] || deseado;
}

async function listarSeguimientos(idUsuario) {
    const pool = await obtenerPool();
    const historialDisponible = await asegurarHistorial(pool);

    const consulta = historialDisponible ? `
        SELECT
            s.id_seguimiento,
            s.id_postulacion,
            s.titulo,
            s.estado,
            ult.estado_nuevo AS estado_visual,
            s.notas,
            s.fecha_creacion,
            s.fecha_actualizacion
        FROM dbo.SeguimientosPostulacion s
        OUTER APPLY (
            SELECT TOP 1 h.estado_nuevo
            FROM dbo.HistorialSeguimientos h
            WHERE h.id_usuario = s.id_usuario
              AND h.id_seguimiento = s.id_seguimiento
              AND h.estado_nuevo IS NOT NULL
            ORDER BY h.fecha_evento DESC, h.id_historial DESC
        ) ult
        WHERE s.id_usuario = @idUsuario
        ORDER BY s.fecha_actualizacion DESC, s.id_seguimiento DESC
    ` : `
        SELECT
            id_seguimiento,
            id_postulacion,
            titulo,
            estado,
            notas,
            fecha_creacion,
            fecha_actualizacion
        FROM dbo.SeguimientosPostulacion
        WHERE id_usuario = @idUsuario
        ORDER BY fecha_actualizacion DESC, id_seguimiento DESC
    `;

    const resultado = await pool.request()
        .input('idUsuario', sql.Int, Number(idUsuario))
        .query(consulta);

    return resultado.recordset.map(enriquecerSeguimiento);
}

async function obtenerSeguimiento(idUsuario, idSeguimiento) {
    const pool = await obtenerPool();
    const historialDisponible = await asegurarHistorial(pool);

    const consulta = historialDisponible ? `
        SELECT TOP 1
            s.id_seguimiento,
            s.id_postulacion,
            s.titulo,
            s.estado,
            ult.estado_nuevo AS estado_visual,
            s.notas,
            s.fecha_creacion,
            s.fecha_actualizacion
        FROM dbo.SeguimientosPostulacion s
        OUTER APPLY (
            SELECT TOP 1 h.estado_nuevo
            FROM dbo.HistorialSeguimientos h
            WHERE h.id_usuario = s.id_usuario
              AND h.id_seguimiento = s.id_seguimiento
              AND h.estado_nuevo IS NOT NULL
            ORDER BY h.fecha_evento DESC, h.id_historial DESC
        ) ult
        WHERE s.id_usuario = @idUsuario AND s.id_seguimiento = @idSeguimiento
    ` : `
        SELECT TOP 1
            id_seguimiento,
            id_postulacion,
            titulo,
            estado,
            notas,
            fecha_creacion,
            fecha_actualizacion
        FROM dbo.SeguimientosPostulacion
        WHERE id_usuario = @idUsuario AND id_seguimiento = @idSeguimiento
    `;

    const resultado = await pool.request()
        .input('idUsuario', sql.Int, Number(idUsuario))
        .input('idSeguimiento', sql.Int, Number(idSeguimiento))
        .query(consulta);

    if (!resultado.recordset.length) throw crearError('Seguimiento no encontrado.', 404);
    return enriquecerSeguimiento(resultado.recordset[0]);
}

async function crearSeguimiento(idUsuario, datos) {
    const idPostulacion = String(datos?.id_postulacion ?? datos?.idPostulacion ?? '').trim();
    const titulo = String(datos?.titulo ?? '').trim();
    const estadoLogico = normalizarEstado(datos?.estado ?? 'IDENTIFICADA');
    const notas = String(datos?.notas ?? '').trim();

    if (!idPostulacion || !titulo) throw crearError('id_postulacion y titulo son obligatorios.', 400);
    if (!ESTADOS[estadoLogico]) throw crearError('Estado de seguimiento no válido.', 400);
    if (titulo.length > 220 || notas.length > 1000 || estadoLogico.length > 50 || idPostulacion.length > 120) {
        throw crearError('Uno de los campos supera la longitud permitida.', 400);
    }

    const pool = await obtenerPool();
    const estadoFisico = await estadoFisicoCompatible(pool, estadoLogico);

    try {
        const resultado = await pool.request()
            .input('idUsuario', sql.Int, Number(idUsuario))
            .input('idPostulacion', sql.NVarChar(120), idPostulacion)
            .input('titulo', sql.NVarChar(220), titulo)
            .input('estado', sql.NVarChar(50), estadoFisico)
            .input('notas', sql.NVarChar(1000), notas || null)
            .query(`
                INSERT INTO dbo.SeguimientosPostulacion
                    (id_usuario, id_postulacion, titulo, estado, notas)
                OUTPUT INSERTED.*
                VALUES (@idUsuario, @idPostulacion, @titulo, @estado, @notas)
            `);

        const creado = resultado.recordset[0];
        await registrarHistorial(pool, {
            idSeguimiento: creado.id_seguimiento,
            idUsuario,
            accion: 'CREACION',
            estadoNuevo: estadoLogico,
            detalle: estadoFisico === estadoLogico
                ? 'Seguimiento creado por el usuario.'
                : `Seguimiento creado. Estado físico compatible: ${estadoFisico}.`
        });

        return enriquecerSeguimiento({ ...creado, estado_visual: estadoLogico });
    } catch (error) {
        if (error?.number === 2601 || error?.number === 2627) {
            throw crearError('Esta postulación ya se encuentra en seguimiento.', 409);
        }
        throw error;
    }
}

async function actualizarSeguimiento(idUsuario, idSeguimiento, datos) {
    const actual = await obtenerSeguimiento(idUsuario, idSeguimiento);
    const titulo = datos?.titulo === undefined ? actual.titulo : String(datos.titulo || '').trim();
    const notas = datos?.notas === undefined ? (actual.notas || '') : String(datos.notas || '').trim();

    if (!titulo) throw crearError('El título es obligatorio.', 400);
    if (titulo.length > 220 || notas.length > 1000) throw crearError('Uno de los campos supera la longitud permitida.', 400);

    const pool = await obtenerPool();
    const resultado = await pool.request()
        .input('idUsuario', sql.Int, Number(idUsuario))
        .input('idSeguimiento', sql.Int, Number(idSeguimiento))
        .input('titulo', sql.NVarChar(220), titulo)
        .input('notas', sql.NVarChar(1000), notas || null)
        .query(`
            UPDATE dbo.SeguimientosPostulacion
            SET titulo = @titulo, notas = @notas, fecha_actualizacion = SYSDATETIME()
            OUTPUT INSERTED.*
            WHERE id_seguimiento = @idSeguimiento AND id_usuario = @idUsuario
        `);

    if (!resultado.recordset.length) throw crearError('Seguimiento no encontrado.', 404);

    await registrarHistorial(pool, {
        idSeguimiento,
        idUsuario,
        accion: 'EDICION',
        estadoAnterior: actual.estado,
        estadoNuevo: actual.estado,
        detalle: 'Se actualizaron el título o las notas del seguimiento.'
    });

    return enriquecerSeguimiento({ ...resultado.recordset[0], estado_visual: actual.estado });
}

async function cambiarEstado(idUsuario, idSeguimiento, estado) {
    const nuevoEstado = normalizarEstado(estado);
    if (!nuevoEstado) throw crearError('El estado es obligatorio.', 400);
    if (!ESTADOS[nuevoEstado]) throw crearError('Estado de seguimiento no válido.', 400);

    const actual = await obtenerSeguimiento(idUsuario, idSeguimiento);
    const pool = await obtenerPool();
    const estadoFisico = await estadoFisicoCompatible(pool, nuevoEstado);

    const resultado = await pool.request()
        .input('idUsuario', sql.Int, Number(idUsuario))
        .input('idSeguimiento', sql.Int, Number(idSeguimiento))
        .input('estado', sql.NVarChar(50), estadoFisico)
        .query(`
            UPDATE dbo.SeguimientosPostulacion
            SET estado = @estado, fecha_actualizacion = SYSDATETIME()
            OUTPUT INSERTED.*
            WHERE id_seguimiento = @idSeguimiento AND id_usuario = @idUsuario
        `);

    if (!resultado.recordset.length) throw crearError('Seguimiento no encontrado.', 404);

    if (actual.estado !== nuevoEstado) {
        await registrarHistorial(pool, {
            idSeguimiento,
            idUsuario,
            accion: 'CAMBIO_ESTADO',
            estadoAnterior: actual.estado,
            estadoNuevo: nuevoEstado,
            detalle: `${metaEstado(actual.estado).etiqueta} → ${metaEstado(nuevoEstado).etiqueta}`
        });
    }

    return enriquecerSeguimiento({ ...resultado.recordset[0], estado_visual: nuevoEstado });
}

async function listarHistorialSeguimiento(idUsuario, idSeguimiento) {
    await obtenerSeguimiento(idUsuario, idSeguimiento);
    const pool = await obtenerPool();
    const disponible = await asegurarHistorial(pool);
    if (!disponible) return [];

    const resultado = await pool.request()
        .input('idUsuario', sql.Int, Number(idUsuario))
        .input('idSeguimiento', sql.Int, Number(idSeguimiento))
        .query(`
            SELECT
                id_historial,
                id_seguimiento,
                accion,
                estado_anterior,
                estado_nuevo,
                detalle,
                fecha_evento
            FROM dbo.HistorialSeguimientos
            WHERE id_usuario = @idUsuario AND id_seguimiento = @idSeguimiento
            ORDER BY fecha_evento DESC, id_historial DESC
        `);

    return resultado.recordset.map((item) => ({
        ...item,
        estado_anterior_etiqueta: item.estado_anterior ? metaEstado(item.estado_anterior).etiqueta : null,
        estado_nuevo_etiqueta: item.estado_nuevo ? metaEstado(item.estado_nuevo).etiqueta : null
    }));
}

async function obtenerResumen(idUsuario) {
    const seguimientos = await listarSeguimientos(idUsuario);
    const finalizados = seguimientos.filter((s) => s.terminal).length;
    const activos = seguimientos.length - finalizados;
    const postulados = seguimientos.filter((s) => ['POSTULADA', 'EN_EVALUACION', 'RESULTADO_DISPONIBLE', 'ADMITIDA', 'NO_SELECCIONADA'].includes(s.estado)).length;
    const progresoPromedio = seguimientos.length
        ? Math.round(seguimientos.reduce((acc, s) => acc + Number(s.progreso || 0), 0) / seguimientos.length)
        : 0;

    return { total: seguimientos.length, activos, finalizados, postulados, progreso_promedio: progresoPromedio };
}

async function eliminarSeguimiento(idUsuario, idSeguimiento) {
    const actual = await obtenerSeguimiento(idUsuario, idSeguimiento);
    const pool = await obtenerPool();

    await registrarHistorial(pool, {
        idSeguimiento,
        idUsuario,
        accion: 'ELIMINACION',
        estadoAnterior: actual.estado,
        detalle: 'Seguimiento eliminado por el usuario.'
    });

    const resultado = await pool.request()
        .input('idUsuario', sql.Int, Number(idUsuario))
        .input('idSeguimiento', sql.Int, Number(idSeguimiento))
        .query(`
            DELETE FROM dbo.SeguimientosPostulacion
            OUTPUT DELETED.id_seguimiento
            WHERE id_seguimiento = @idSeguimiento AND id_usuario = @idUsuario
        `);

    if (!resultado.recordset.length) throw crearError('Seguimiento no encontrado.', 404);
    return { eliminado: true, id_seguimiento: Number(idSeguimiento) };
}

async function diagnosticarEsquema() {
    const pool = await obtenerPool();
    const tabla = await pool.request().query(`
        SELECT CASE WHEN OBJECT_ID('dbo.SeguimientosPostulacion', 'U') IS NULL THEN 0 ELSE 1 END AS seguimientos,
               CASE WHEN OBJECT_ID('dbo.HistorialSeguimientos', 'U') IS NULL THEN 0 ELSE 1 END AS historial,
               HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE TABLE') AS puede_crear_tabla
    `);
    const constraints = await pool.request().query(`
        SELECT cc.name, cc.definition
        FROM sys.check_constraints cc
        WHERE cc.parent_object_id = OBJECT_ID('dbo.SeguimientosPostulacion')
    `);
    const columnas = await pool.request().query(`
        SELECT c.name, TYPE_NAME(c.user_type_id) AS tipo, c.max_length, c.is_nullable
        FROM sys.columns c
        WHERE c.object_id = OBJECT_ID('dbo.SeguimientosPostulacion')
        ORDER BY c.column_id
    `);

    const historialPreparado = await asegurarHistorial(pool);
    return {
        ...tabla.recordset[0],
        historial_preparado: historialPreparado,
        columnas: columnas.recordset,
        restricciones: constraints.recordset
    };
}

function listarEstadosDisponibles() {
    return Object.entries(ESTADOS).map(([clave, meta]) => ({ clave, ...meta }));
}

module.exports = {
    listarSeguimientos,
    obtenerSeguimiento,
    crearSeguimiento,
    actualizarSeguimiento,
    cambiarEstado,
    listarHistorialSeguimiento,
    obtenerResumen,
    eliminarSeguimiento,
    diagnosticarEsquema,
    listarEstadosDisponibles
};
