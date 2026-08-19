import express from 'express'
import { verificarToken } from '../middleware/autenticacion.js'
import * as authController from '../controllers/authController.js'

const router = express.Router()

router.post('/registro', authController.registro)
router.post('/verificar', authController.verificar)
router.post('/login', authController.login)
router.post('/activarModoDistribuidor', verificarToken, authController.activarModoDistribuidor)
router.post('/recuperarContrasena', authController.recuperarContrasena)
router.post('/verificarRecuperacion', authController.verificarRecuperacion)
router.post('/nuevaContrasena', authController.nuevaContrasena)

export default router
