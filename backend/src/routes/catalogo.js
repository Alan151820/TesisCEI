const express = require('express')
const router = express.Router()
const catalogoController = require('../controllers/catalogoController')

router.get('/', catalogoController.listarCatalogo)
router.get('/:id', catalogoController.obtenerDetalle)

module.exports = router
