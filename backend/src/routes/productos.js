const express = require('express')
const router = express.Router()
const { verificarToken } = require('../middleware/autenticacion')
const upload = require('../middleware/upload')
const productosController = require('../controllers/productosController')

router.get('/categorias', productosController.listarCategorias)
router.get('/', verificarToken, productosController.listarProductos)
router.post('/', verificarToken, upload.single('imagen'), productosController.crearProducto)
router.get('/:id', verificarToken, productosController.obtenerProducto)
router.put('/:id', verificarToken, upload.single('imagen'), productosController.editarProducto)
router.patch('/:id/visibilidad', verificarToken, productosController.cambiarVisibilidad)
router.patch('/:id/umbral', verificarToken, productosController.configurarUmbral)
router.delete('/:id', verificarToken, productosController.eliminarProducto)

module.exports = router
