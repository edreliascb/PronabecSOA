const service = require('../services/seguimientoPostulacion.service');
const sagaService = require('../services/sagaSeguimiento.service');

function responderError(res, error, servicio) {
    const status = Number(error?.statusCode) || 500;
    if (status >= 500) console.error(`[${servicio}]`, error);

    const esProduccion = String(process.env.NODE_ENV || 'development').toLowerCase() === 'production';

    const respuesta = {
        success: false,
        servicio,
        mensaje: status >= 500 ? 'No se pudo completar la operación.' : error.message
    };

    if (status >= 500 && !esProduccion) {
        respuesta.detalle = error?.message || 'Error interno sin detalle.';
        if (error?.number !== undefined) respuesta.codigo_sql = error.number;
        if (error?.code) respuesta.codigo = error.code;
    }

    if (error?.saga) {
        respuesta.mensaje = error.message;
        respuesta.causa = error.causa || null;
        respuesta.saga = error.saga;
    }

    return res.status(status).json(respuesta);
}

async function listar(req, res) {
    try {
        const resultado = await service.listarSeguimientos(req.usuario.id);
        return res.json({ success: true, servicio: 'SeguimientoPostulacionService', total: resultado.length, resultado });
    } catch (error) {
        return responderError(res, error, 'SeguimientoPostulacionService');
    }
}

async function resumen(req, res) {
    try {
        const resultado = await service.obtenerResumen(req.usuario.id);
        return res.json({ success: true, servicio: 'SeguimientoPostulacionService', resultado });
    } catch (error) {
        return responderError(res, error, 'SeguimientoPostulacionService');
    }
}

async function estados(req, res) {
    return res.json({ success: true, servicio: 'SeguimientoPostulacionService', resultado: service.listarEstadosDisponibles() });
}

async function obtener(req, res) {
    try {
        const resultado = await service.obtenerSeguimiento(req.usuario.id, req.params.id);
        return res.json({ success: true, servicio: 'SeguimientoPostulacionService', resultado });
    } catch (error) {
        return responderError(res, error, 'SeguimientoPostulacionService');
    }
}

async function historial(req, res) {
    try {
        const resultado = await service.listarHistorialSeguimiento(req.usuario.id, req.params.id);
        return res.json({ success: true, servicio: 'SeguimientoPostulacionService', total: resultado.length, resultado });
    } catch (error) {
        return responderError(res, error, 'SeguimientoPostulacionService');
    }
}

async function crear(req, res) {
    try {
        const resultado = await service.crearSeguimiento(req.usuario.id, req.body);
        return res.status(201).json({ success: true, servicio: 'SeguimientoPostulacionService', resultado });
    } catch (error) {
        return responderError(res, error, 'SeguimientoPostulacionService');
    }
}

async function editar(req, res) {
    try {
        const resultado = await service.actualizarSeguimiento(req.usuario.id, req.params.id, req.body);
        return res.json({ success: true, servicio: 'SeguimientoPostulacionService', resultado });
    } catch (error) {
        return responderError(res, error, 'SeguimientoPostulacionService');
    }
}

async function crearSaga(req, res) {
    try {
        const permitirFalloControlado = String(process.env.NODE_ENV || 'development').trim().toLowerCase() !== 'production';
        const forzarFalloEn = permitirFalloControlado ? req.body?.forzar_fallo_en : null;
        const resultado = await sagaService.ejecutarSagaSeguimiento(req.usuario.id, req.body, { forzarFalloEn });
        return res.status(201).json({ success: true, servicio: 'SagaSeguimientoService', mensaje: 'SAGA completada correctamente.', resultado });
    } catch (error) {
        return responderError(res, error, 'SagaSeguimientoService');
    }
}

async function cambiarEstado(req, res) {
    try {
        const resultado = await service.cambiarEstado(req.usuario.id, req.params.id, req.body?.estado);
        return res.json({ success: true, servicio: 'SeguimientoPostulacionService', resultado });
    } catch (error) {
        return responderError(res, error, 'SeguimientoPostulacionService');
    }
}

async function eliminar(req, res) {
    try {
        const resultado = await service.eliminarSeguimiento(req.usuario.id, req.params.id);
        return res.json({ success: true, servicio: 'SeguimientoPostulacionService', resultado });
    } catch (error) {
        return responderError(res, error, 'SeguimientoPostulacionService');
    }
}


async function diagnostico(req, res) {
    try {
        const resultado = await service.diagnosticarEsquema();
        return res.json({ success: true, servicio: 'SeguimientoPostulacionService', resultado });
    } catch (error) {
        return responderError(res, error, 'SeguimientoPostulacionService');
    }
}

module.exports = { listar, resumen, estados, diagnostico, obtener, historial, crear, editar, crearSaga, cambiarEstado, eliminar };
