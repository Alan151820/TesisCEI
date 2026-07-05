const express = require('express')
const router = express.Router({ mergeParams: true })
const { verificarToken } = require('../middleware/autenticacion')
const preciosVolumenControlador = require('../controladores/preciosVolumen.controlador')

router.get('/', verificarToken, preciosVolumenControlador.listarPrecios)
router.post('/', verificarToken, preciosVolumenControlador.registrarPrecio)

module.exports = router
