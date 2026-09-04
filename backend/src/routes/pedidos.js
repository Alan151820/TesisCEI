import express from 'express'
import { verificarToken } from '../middleware/autenticacion.js'
import * as pedidosController from '../controllers/pedidosController.js'

const router = express.Router()

router.post('/confirmar', verificarToken, pedidosController.confirmarPedido)
router.get('/disponibles-reparto', verificarToken, pedidosController.pedidosDisponiblesReparto)
router.get('/:id/detalle', verificarToken, pedidosController.detalleDistribuidor)
router.patch('/:id/aceptar', verificarToken, pedidosController.aceptarPedido)
router.patch('/:id/rechazar', verificarToken, pedidosController.rechazarPedido)
router.patch('/:id/avanzar', verificarToken, pedidosController.avanzarEstado)
router.patch('/:id/cancelar', verificarToken, pedidosController.cancelarPedido)
router.post('/:id/items/:itemId/proponer-sustituto', verificarToken, pedidosController.proponerSustituto)
router.patch('/sustituciones/:propuestaId/aceptar', verificarToken, pedidosController.aceptarSustitucion)
router.patch('/sustituciones/:propuestaId/rechazar', verificarToken, pedidosController.rechazarSustitucion)
router.get('/historial', verificarToken, pedidosController.historialDistribuidor)
router.get('/mis-pedidos', verificarToken, pedidosController.historialComprador)
router.get('/:id', verificarToken, pedidosController.detalleComprador)

export default router
