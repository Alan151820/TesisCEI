const express = require('express')
const router = express.Router()
const { obtenerPerfil } = require('../controllers/distribuidorController')

router.get('/perfilDistribuidor/:id', obtenerPerfil)

module.exports = router