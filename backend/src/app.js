require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')
const productosRutas = require('./rutas/productos.rutas')
const preciosVolumenRutas = require('./rutas/preciosVolumen.rutas')

const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(require('path').join(__dirname, '../public/uploads')))

app.use('/auth', authRoutes)
app.use('/api/productos', productosRutas)
app.use('/api/productos/:productoId/precios', preciosVolumenRutas)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'No fue posible completar la operación. Intente nuevamente más tarde.' })
})

const distribuidorRoutes = require('./routes/distribuidor')
app.use('/distribuidor', distribuidorRoutes)

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000')
})
