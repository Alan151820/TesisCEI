import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import productosRoutes from './routes/productos.js'
import preciosVolumenRoutes from './routes/preciosVolumen.js'
import distribuidorRoutes from './routes/distribuidor.js'
import catalogoRoutes from './routes/catalogo.js'
import pedidosRoutes from './routes/pedidos.js'
import notificacionesRoutes from './routes/notificaciones.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()



app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')))

app.use('/auth', authRoutes)
app.use('/api/productos', productosRoutes)
app.use('/api/productos/:productoId/precios', preciosVolumenRoutes)
app.use('/distribuidor', distribuidorRoutes)
app.use('/api/catalogo', catalogoRoutes)
app.use('/api/pedidos', pedidosRoutes)
app.use('/api/notificaciones', notificacionesRoutes)

app.use((err, req, res, next) => {
  console.error(err)
  const status = err.status || 500
  const mensaje = status < 500 ? err.message : 'No fue posible completar la operación. Intente nuevamente más tarde.'
  res.status(status).json({ error: mensaje })
})

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000')
})
