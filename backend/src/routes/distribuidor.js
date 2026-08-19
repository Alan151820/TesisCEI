import express from 'express'
import upload from '../config/multer.js'
import { verificarToken } from '../middleware/autenticacion.js'
import { obtenerPerfil, configurarPerfil, verificarPerfil, obtenerPerfilPropio, editarPerfil, subirLogo, actualizarDireccionPartida, obtenerProductosPublicados } from '../controllers/distribuidorController.js'

const router = express.Router()

router.get('/perfilDistribuidor/:id', obtenerPerfil)
router.post('/configurarPerfil', verificarToken, configurarPerfil)
router.post('/verificarPerfil', verificarToken, verificarPerfil)
router.post('/obtenerPerfilPropio', verificarToken, obtenerPerfilPropio)
router.put('/editarPerfil', verificarToken, editarPerfil)
router.post('/subirLogo', verificarToken, upload.single('logo'), subirLogo)
router.put('/direccionPartida', verificarToken, actualizarDireccionPartida)
router.get('/:id/productos', obtenerProductosPublicados)



export default router
