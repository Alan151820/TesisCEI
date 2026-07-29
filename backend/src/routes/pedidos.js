const express = require('express')
const router = express.Router()
const { verificarToken } = require('../middleware/autenticacion')
const pedidosController = require('../controllers/pedidosController')

router.post('/confirmar', verificarToken, pedidosController.confirmarPedido)
router.get('/activos', verificarToken, pedidosController.pedidosActivos)
router.patch('/:id/aceptar', verificarToken, pedidosController.aceptarPedido)
router.get('/historial', verificarToken, pedidosController.historialDistribuidor)
router.get('/mis-pedidos', verificarToken, pedidosController.historialComprador)

module.exports = router
