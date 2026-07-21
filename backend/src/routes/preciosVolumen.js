const express = require('express')
const router = express.Router({ mergeParams: true })
const { verificarToken } = require('../middleware/autenticacion')
const preciosVolumenController = require('../controllers/preciosVolumenController')

router.get('/', verificarToken, preciosVolumenController.listarPrecios)
router.post('/', verificarToken, preciosVolumenController.registrarPrecio)
router.put('/:precioId', verificarToken, preciosVolumenController.editarPrecio)
router.delete('/:precioId', verificarToken, preciosVolumenController.eliminarPrecio)

module.exports = router
