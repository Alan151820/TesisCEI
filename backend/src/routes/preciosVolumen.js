import express from 'express'
import { verificarToken } from '../middleware/autenticacion.js'
import * as preciosVolumenController from '../controllers/preciosVolumenController.js'

const router = express.Router({ mergeParams: true })

router.get('/', verificarToken, preciosVolumenController.listarPrecios)
router.post('/', verificarToken, preciosVolumenController.registrarPrecio)
router.post('/descuento-total', verificarToken, preciosVolumenController.aplicarDescuentoTotal)
router.put('/:precioId', verificarToken, preciosVolumenController.editarPrecio)
router.delete('/:precioId', verificarToken, preciosVolumenController.eliminarPrecio)

export default router
