const express = require('express')
const router = express.Router()
const { registro, verificar, login, recuperarContrasena, verificarRecuperacion, nuevaContrasena, activarModoDistribuidor } = require('../controllers/authController')

router.post('/registro', registro)
router.post('/verificar', verificar)
router.post('/login', login)
router.post('/recuperarContrasena', recuperarContrasena)
router.post('/verificarRecuperacion', verificarRecuperacion)
router.post('/nuevaContrasena', nuevaContrasena)
router.post('/activarModoDistribuidor', activarModoDistribuidor)

module.exports = router