import express from 'express'
import { verificarToken } from '../middleware/autenticacion.js'
import * as notificacionesController from '../controllers/notificacionesController.js'

const router = express.Router()

router.get('/', verificarToken, notificacionesController.listar)
router.patch('/:id/leer', verificarToken, notificacionesController.marcarLeida)

export default router
