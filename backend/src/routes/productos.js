import express from 'express'
import { verificarToken } from '../middleware/autenticacion.js'
import upload from '../middleware/upload.js'
import * as productosController from '../controllers/productosController.js'

const router = express.Router()

router.get('/categorias', productosController.listarCategorias)
router.get('/', verificarToken, productosController.listarProductos)
router.post('/', verificarToken, upload.single('imagen'), productosController.crearProducto)
router.get('/:id', verificarToken, productosController.obtenerProducto)
router.put('/:id', verificarToken, upload.single('imagen'), productosController.editarProducto)
router.patch('/:id/visibilidad', verificarToken, productosController.cambiarVisibilidad)
router.patch('/:id/umbral', verificarToken, productosController.configurarUmbral)
router.delete('/:id', verificarToken, productosController.eliminarProducto)

export default router
