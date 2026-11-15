const express = require('express');
const controller = require('../controllers/seguimientoPostulacion.controller');
const { autenticarToken } = require('../middleware/auth.middleware');
const router = express.Router();

router.use(autenticarToken);

router.get('/', controller.listar);
router.get('/resumen', controller.resumen);
router.get('/estados', controller.estados);
router.get('/diagnostico', controller.diagnostico);
router.post('/', controller.crear);
router.post('/saga', controller.crearSaga);
router.get('/:id/historial', controller.historial);
router.get('/:id', controller.obtener);
router.patch('/:id', controller.editar);
router.patch('/:id/estado', controller.cambiarEstado);
router.delete('/:id', controller.eliminar);

module.exports = router;
