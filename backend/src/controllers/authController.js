const Usuario = require('../models/Usuario')
const pool = require('../config/db')

const registro = async (req, res) => {
  try {
    const { nombre, telefono, contrasena } = req.body
    const codigo = await Usuario.registrarCuenta(nombre, telefono, contrasena)
    res.json({ mensaje: 'Código enviado por SMS. Ingresalo para activar tu cuenta.', codigo_dev: codigo })
  } catch (error) {
    res.status(400).json({ mensaje: error.message })
  }
}

const verificar = async (req, res) => {
  try {
    const { telefono, codigo } = req.body
    await Usuario.verificarCodigoActivacion(telefono, codigo)
    res.json({ mensaje: 'Cuenta activada correctamente.' })
  } catch (error) {
    res.status(400).json({ mensaje: error.message })
  }
}

const login = async (req, res) => {
  try {
    const { telefono, contrasena } = req.body
    const datos = await Usuario.iniciarSesion(telefono, contrasena)
    res.json({ mensaje: 'Sesión iniciada correctamente.', ...datos })
  } catch (error) {
    res.status(400).json({ mensaje: error.message })
  }
}

const recuperarContrasena = async (req, res) => {
  try {
    const { telefono } = req.body
    const codigo = await Usuario.solicitarRecuperacionContrasena(telefono)
    res.json({ mensaje: 'Código enviado por SMS. Ingresalo para continuar.', codigo_dev: codigo })
  } catch (error) {
    res.status(400).json({ mensaje: error.message })
  }
}

const verificarRecuperacion = async (req, res) => {
  try {
    const { telefono, codigo } = req.body
    await Usuario.verificarCodigoRecuperacion(telefono, codigo)
    res.json({ mensaje: 'Código verificado correctamente.' })
  } catch (error) {
    res.status(400).json({ mensaje: error.message })
  }
}

const nuevaContrasena = async (req, res) => {
  try {
    const { telefono, contrasena } = req.body
    await Usuario.restablecerContrasena(telefono, contrasena)
    res.json({ mensaje: 'Contraseña actualizada correctamente. Ya podés iniciar sesión.' })
  } catch (error) {
    res.status(400).json({ mensaje: error.message })
  }
}

const activarModoDistribuidor = async (req, res) => {
  try {
    const { telefono } = req.body
    const resultado = await pool.query('SELECT * FROM usuario WHERE telefono = $1', [telefono])
    if (resultado.rows.length === 0) return res.status(400).json({ mensaje: 'No encontramos una cuenta con ese número de teléfono.' })
    const usuario = new Usuario(resultado.rows[0])
    await usuario.activarModoDistribuidor()
    res.json({ mensaje: 'Modo distribuidor activado correctamente.' })
  } catch (error) {
 console.log('Error activarModoDistribuidor:', error.message)
  res.status(400).json({ mensaje: error.message })  }
}

module.exports = { registro, verificar, login, recuperarContrasena, verificarRecuperacion, nuevaContrasena, activarModoDistribuidor }