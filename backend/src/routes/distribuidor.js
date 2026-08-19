const express = require('express')
const router = express.Router()
const upload = require('../config/multer')
const { verificarToken } = require('../middleware/autenticacion')
const { obtenerPerfil, configurarPerfil, verificarPerfil, obtenerPerfilPropio, editarPerfil, subirLogo, actualizarDireccionPartida, obtenerProductosPublicados } = require('../controllers/distribuidorController')

router.get('/perfilDistribuidor/:id', obtenerPerfil)
router.post('/configurarPerfil', verificarToken, configurarPerfil)
router.post('/verificarPerfil', verificarToken, verificarPerfil)
router.post('/obtenerPerfilPropio', verificarToken, obtenerPerfilPropio)
router.put('/editarPerfil', verificarToken, editarPerfil)
router.post('/subirLogo', verificarToken, upload.single('logo'), subirLogo)
router.put('/direccionPartida', verificarToken, actualizarDireccionPartida)
router.get('/:id/productos', obtenerProductosPublicados)



module.exports = router