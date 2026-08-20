import express from 'express'
import { verificarToken } from '../middleware/autenticacion.js'
import * as reportesController from '../controllers/reportesController.js'

const router = express.Router()

router.get('/rendimiento', verificarToken, reportesController.obtenerRendimiento)
router.get('/rentabilidad', verificarToken, reportesController.obtenerRentabilidad)

export default router
