const express = require('express')
const router = express.Router()
const upload = require('../config/multer')
const { obtenerPerfil, configurarPerfil, verificarPerfil, obtenerPerfilPropio, editarPerfil, subirLogo } = require('../controllers/distribuidorController')

router.get('/perfilDistribuidor/:id', obtenerPerfil)
router.post('/configurarPerfil', configurarPerfil)
router.post('/verificarPerfil', verificarPerfil)
router.post('/obtenerPerfilPropio', obtenerPerfilPropio)
router.put('/editarPerfil', editarPerfil)
router.post('/subirLogo', upload.single('logo'), subirLogo)



module.exports = router