const express = require('express')
const router = express.Router()
const twilio = require('twilio')
const bcrypt = require('bcryptjs')
const pool = require('../config/db')

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

// Almacenamiento temporal de registros pendientes
const registrosPendientes = []

// POST /auth/registro
router.post('/registro', async (req, res) => {
  const { nombre, telefono, contrasena } = req.body

  // Verificar si el teléfono ya está registrado en la DB
  const usuarioExistente = await pool.query('SELECT id FROM usuario WHERE telefono = $1', [telefono])
  if (usuarioExistente.rows.length > 0) {
    return res.status(400).json({ mensaje: 'El número de teléfono ya está registrado. Iniciá sesión o recuperá tu contraseña.' })
  }

  // Generar código
  const codigo = Math.floor(100000 + Math.random() * 900000).toString()
  const expiracion = new Date(Date.now() + 10 * 60 * 1000)
  const contrasenaHash = await bcrypt.hash(contrasena, 10)

  // Guardar en memoria temporalmente
  registrosPendientes.push({ nombre, telefono, contrasenaHash, codigo, expiracion })

  // Enviar SMS
  await client.messages.create({
    body: `Tu código de verificación es: ${codigo}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: telefono
  })

  res.json({ 
    mensaje: 'Código enviado por SMS. Ingresalo para activar tu cuenta.',
    codigo_dev: codigo
  })
})

// POST /auth/verificar
router.post('/verificar', async (req, res) => {
  const { telefono, codigo } = req.body

  // Buscar en memoria
  const pendiente = registrosPendientes.find(r => r.telefono === telefono && r.codigo === codigo)

  if (!pendiente) {
    return res.status(400).json({ mensaje: 'El código ingresado no es válido. Intentá de nuevo.' })
  }

  if (new Date() > pendiente.expiracion) {
    return res.status(400).json({ mensaje: 'El código expiró. Solicitá uno nuevo.' })
  }

  // Crear usuario en la DB
  const nuevoUsuario = await pool.query(
    'INSERT INTO usuario (nombre_completo, telefono, contrasena_hash, cuenta_verificada, consentimiento_datos_otorgado) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [pendiente.nombre, pendiente.telefono, pendiente.contrasenaHash, true, true]
  )

  // Guardar código en la DB como registro histórico
  await pool.query(
    'INSERT INTO codigo_verificacion (usuario_id, codigo, proposito, fecha_expiracion, usado) VALUES ($1, $2, $3, $4, $5)',
    [nuevoUsuario.rows[0].id, pendiente.codigo, 'activacion_cuenta', pendiente.expiracion, true]
  )

  // Eliminar de memoria
  const index = registrosPendientes.indexOf(pendiente)
  registrosPendientes.splice(index, 1)

  res.json({ mensaje: 'Cuenta activada correctamente.' })
})

// POST /auth/login
router.post('/login', async (req, res) => {
  const { telefono, contrasena } = req.body

  const resultado = await pool.query('SELECT * FROM usuario WHERE telefono = $1', [telefono])
  if (resultado.rows.length === 0) {
    return res.status(400).json({ mensaje: 'No encontramos una cuenta con ese número de teléfono.' })
  }

  const usuario = resultado.rows[0]

  if (!usuario.cuenta_verificada) {
    return res.status(400).json({ mensaje: 'Tu cuenta aún no fue verificada. Revisá el SMS que te enviamos.' })
  }

  const contrasenaCorrecta = await bcrypt.compare(contrasena, usuario.contrasena_hash)
  if (!contrasenaCorrecta) {
    return res.status(400).json({ mensaje: 'El teléfono o la contraseña son incorrectos.' })
  }

  // Generar token JWT
  const token = require('jsonwebtoken').sign(
    { id: usuario.id, nombre: usuario.nombre_completo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  )

res.json({ mensaje: 'Sesión iniciada correctamente.', token, nombre: usuario.nombre_completo, modoDistribuidorActivo: usuario.modo_distribuidor_activo })})
// POST /auth/recuperarContrasena
router.post('/recuperarContrasena', async (req, res) => {
  const { telefono } = req.body

  const resultado = await pool.query('SELECT id FROM usuario WHERE telefono = $1', [telefono])
  if (resultado.rows.length === 0) {
    return res.status(400).json({ mensaje: 'No encontramos una cuenta con ese número de teléfono.' })
  }

  const codigo = Math.floor(100000 + Math.random() * 900000).toString()
  const expiracion = new Date(Date.now() + 10 * 60 * 1000)

  await pool.query(
    'INSERT INTO codigo_verificacion (usuario_id, codigo, proposito, fecha_expiracion) VALUES ($1, $2, $3, $4)',
    [resultado.rows[0].id, codigo, 'recuperacion_password', expiracion]
  )

  await client.messages.create({
    body: `Tu código de recuperación es: ${codigo}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: telefono
  })

  res.json({ 
    mensaje: 'Código enviado por SMS. Ingresalo para continuar.',
    codigo_dev: codigo
  })
})

// POST /auth/verificarRecuperacion
router.post('/verificarRecuperacion', async (req, res) => {
  const { telefono, codigo } = req.body

  const usuario = await pool.query('SELECT id FROM usuario WHERE telefono = $1', [telefono])
  if (usuario.rows.length === 0) {
    return res.status(400).json({ mensaje: 'No encontramos una cuenta con ese número de teléfono.' })
  }

  const usuarioId = usuario.rows[0].id

  const registro = await pool.query(
    'SELECT * FROM codigo_verificacion WHERE usuario_id = $1 AND codigo = $2 AND proposito = $3 AND usado = FALSE',
    [usuarioId, codigo, 'recuperacion_password']
  )

  if (registro.rows.length === 0) {
    return res.status(400).json({ mensaje: 'El código ingresado no es válido. Intentá de nuevo.' })
  }

  if (new Date() > new Date(registro.rows[0].fecha_expiracion)) {
    return res.status(400).json({ mensaje: 'El código expiró. Solicitá uno nuevo.' })
  }

  await pool.query('UPDATE codigo_verificacion SET usado = TRUE WHERE id = $1', [registro.rows[0].id])

  res.json({ mensaje: 'Código verificado correctamente.' })
})

// POST /auth/nuevaContrasena
router.post('/nuevaContrasena', async (req, res) => {
  const { telefono, contrasena } = req.body

  const contrasenaHash = await bcrypt.hash(contrasena, 10)

  await pool.query('UPDATE usuario SET contrasena_hash = $1 WHERE telefono = $2', [contrasenaHash, telefono])

  res.json({ mensaje: 'Contraseña actualizada correctamente. Ya podés iniciar sesión.' })
})

// POST /auth/activarModoDistribuidor
router.post('/activarModoDistribuidor', async (req, res) => {
  const { telefono } = req.body

  const usuario = await pool.query('SELECT id, modo_distribuidor_activo FROM usuario WHERE telefono = $1', [telefono])
  if (usuario.rows.length === 0) {
    return res.status(400).json({ mensaje: 'No encontramos una cuenta con ese número de teléfono.' })
  }

  if (usuario.rows[0].modo_distribuidor_activo) {
    return res.status(400).json({ mensaje: 'El modo distribuidor ya está activo en esta cuenta.' })
  }

  await pool.query('UPDATE usuario SET modo_distribuidor_activo = TRUE WHERE telefono = $1', [telefono])

  res.json({ mensaje: 'Modo distribuidor activado correctamente.' })
})
module.exports = router