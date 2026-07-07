const express = require('express')
const router = express.Router()
const { obtenerPerfil, configurarPerfil, verificarPerfil } = require('../controllers/distribuidorController')

router.get('/perfilDistribuidor/:id', obtenerPerfil)
router.post('/configurarPerfil', configurarPerfil)
router.post('/verificarPerfil', verificarPerfil)


module.exports = router