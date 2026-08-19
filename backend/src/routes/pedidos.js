import express from 'express'
import { verificarToken } from '../middleware/autenticacion.js'
import * as pedidosController from '../controllers/pedidosController.js'

const router = express.Router()

router.post('/confirmar', verificarToken, pedidosController.confirmarPedido)
router.get('/activos', verificarToken, pedidosController.pedidosActivos)
router.get('/:id/detalle', verificarToken, pedidosController.detalleDistribuidor)
router.patch('/:id/aceptar', verificarToken, pedidosController.aceptarPedido)
router.patch('/:id/rechazar', verificarToken, pedidosController.rechazarPedido)
router.patch('/:id/avanzar', verificarToken, pedidosController.avanzarEstado)
router.get('/historial', verificarToken, pedidosController.historialDistribuidor)
router.get('/mis-pedidos', verificarToken, pedidosController.historialComprador)
router.get('/:id', verificarToken, pedidosController.detalleComprador)

export default router
