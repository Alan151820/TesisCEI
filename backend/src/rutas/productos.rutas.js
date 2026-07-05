const express = require('express')
const router = express.Router()
const { verificarToken } = require('../middleware/autenticacion')
const upload = require('../middleware/upload')
const productosControlador = require('../controladores/productos.controlador')

router.get('/categorias', productosControlador.listarCategorias)
router.get('/', verificarToken, productosControlador.listarProductos)
router.post('/', verificarToken, upload.single('imagen'), productosControlador.crearProducto)

module.exports = router
