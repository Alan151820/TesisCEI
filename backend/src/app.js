require('dotenv').config()
const express = require('express')
const cors = require('cors')
const authRoutes = require('./routes/auth')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/auth', authRoutes)

const distribuidorRoutes = require('./routes/distribuidor')
app.use('/distribuidor', distribuidorRoutes)

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000')
})