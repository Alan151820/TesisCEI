const express = require('express')
const router = express.Router()
const { verificarToken } = require('../middleware/autenticacion')
const notificacionesController = require('../controllers/notificacionesController')

router.get('/', verificarToken, notificacionesController.listar)
router.patch('/:id/leer', verificarToken, notificacionesController.marcarLeida)

module.exports = router
