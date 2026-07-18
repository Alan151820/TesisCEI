const express = require('express')
const router = express.Router()
const twilio = require('twilio')
const bcrypt = require('bcryptjs')
const pool = require('../config/db')
const Usuario = require('../models/Usuario')


const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

// Almacenamiento temporal de registros pendientes
const registrosPendientes = []

router.post('/registro', async (req, res) => {
  const { nombre, telefono, contrasena } = req.body

  const usuarioExistente = await pool.query('SELECT id FROM usuario WHERE telefono = $1', [telefono])
  if (usuarioExistente.rows.length > 0) {
    return res.status(400).json({ mensaje: 'El número de teléfono ya está registrado. Iniciá sesión o recuperá tu contraseña.' })
  }

  const codigo = Math.floor(100000 + Math.random() * 900000).toString()
  const expiracion = new Date(Date.now() + 10 * 60 * 1000)
  const contrasenaHash = await bcrypt.hash(contrasena, 10)

  registrosPendientes.push({ nombre, telefono, contrasenaHash, codigo, expiracion })

  try {
    await client.messages.create({
      body: `Tu código de verificación es: ${codigo}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: telefono
    })
  } catch (twilioError) {
    console.log('SMS no enviado:', twilioError.message)
  }

  res.json({
    mensaje: 'Código enviado por SMS. Ingresalo para activar tu cuenta.',
    codigo_dev: codigo
  })
})
/*
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

  // En desarrollo se omite el SMS y se devuelve el código directamente
  res.json({
    mensaje: 'Código enviado por SMS. Ingresalo para activar tu cuenta.',
    codigo_dev: codigo
  })
})
*/
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

res.json({ mensaje: 'Sesión iniciada correctamente.', token, nombre: usuario.nombre_completo, modoDistribuidorActivo: usuario.modo_distribuidor_activo, telefono: usuario.telefono })})

// POST /auth/activarModoDistribuidor
router.post('/activarModoDistribuidor', async (req, res) => {
  try {
    const { telefono } = req.body
    await pool.query('UPDATE usuario SET modo_distribuidor_activo = TRUE WHERE telefono = $1', [telefono])
    res.json({ mensaje: 'Modo distribuidor activado correctamente.' })
  } catch (error) {
    console.log('Error activarModoDistribuidor:', error.message)
    res.status(500).json({ mensaje: 'No fue posible completar la operación. Intente nuevamente más tarde.' })
  }
})
// POST /auth/recuperarContrasena
router.post('/recuperarContrasena', async (req, res) => {
  const { telefono } = req.body
  try {
    const codigo = await Usuario.solicitarRecuperacionContrasena(telefono)
    res.json({
      mensaje: 'Código enviado por SMS. Ingresalo para continuar.',
      codigo_dev: codigo
    })
  } catch (error) {
    res.status(400).json({ mensaje: error.message })
  }
})

// POST /auth/verificarRecuperacion
router.post('/verificarRecuperacion', async (req, res) => {
  const { telefono, codigo } = req.body
  try {
    await Usuario.verificarCodigoRecuperacion(telefono, codigo)
    res.json({ mensaje: 'Código verificado correctamente.' })
  } catch (error) {
    res.status(400).json({ mensaje: error.message })
  }
})
// POST /auth/nuevaContrasena
router.post('/nuevaContrasena', async (req, res) => {
  const { telefono, contrasena } = req.body
  try {
    await Usuario.restablecerContrasena(telefono, contrasena)
    res.json({ mensaje: 'Contraseña actualizada correctamente.' })
  } catch (error) {
    res.status(400).json({ mensaje: error.message })
  }
})

module.exports = router