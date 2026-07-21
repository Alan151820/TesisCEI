require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const productosRoutes = require('./routes/productos')
const preciosVolumenRoutes = require('./routes/preciosVolumen')
const distribuidorRoutes = require('./routes/distribuidor')
const catalogoRoutes = require('./routes/catalogo')

const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(require('path').join(__dirname, '../public/uploads')))

app.use('/auth', authRoutes)
app.use('/api/productos', productosRoutes)
app.use('/api/productos/:productoId/precios', preciosVolumenRoutes)
app.use('/distribuidor', distribuidorRoutes)
app.use('/api/catalogo', catalogoRoutes)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'No fue posible completar la operación. Intente nuevamente más tarde.' })
})

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000')
})
