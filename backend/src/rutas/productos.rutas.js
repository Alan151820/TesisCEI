const express = require('express')
const router = express.Router()
const { verificarToken } = require('../middleware/autenticacion')
const upload = require('../middleware/upload')
const productosControlador = require('../controladores/productos.controlador')

router.get('/categorias', productosControlador.listarCategorias)
router.get('/', verificarToken, productosControlador.listarProductos)
router.post('/', verificarToken, upload.single('imagen'), productosControlador.crearProducto)
router.get('/:id', verificarToken, productosControlador.obtenerProducto)
router.put('/:id', verificarToken, upload.single('imagen'), productosControlador.editarProducto)
router.delete('/:id', verificarToken, productosControlador.eliminarProducto)
router.patch('/:id/visibilidad', verificarToken, productosControlador.cambiarVisibilidad)

module.exports = router
