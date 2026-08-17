const express = require('express')
const router = express.Router()
const { verificarToken } = require('../middleware/autenticacion')
const authController = require('../controllers/authController')

router.post('/registro', authController.registro)
router.post('/verificar', authController.verificar)
router.post('/login', authController.login)
router.post('/activarModoDistribuidor', verificarToken, authController.activarModoDistribuidor)
router.post('/recuperarContrasena', authController.recuperarContrasena)
router.post('/verificarRecuperacion', authController.verificarRecuperacion)
router.post('/nuevaContrasena', authController.nuevaContrasena)

module.exports = router
