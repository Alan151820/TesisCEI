import Usuario from '../models/usuario.js'

const RE_TELEFONO_UY = /^\+5989\d{7}$/
const LARGO_MIN_CONTRASENA = 8

const registro = async (req, res) => {
  try {
    const { nombre, telefono, contrasena, consentimientoDatosOtorgado } = req.body
    if (!consentimientoDatosOtorgado) {
      return res.status(400).json({ mensaje: 'Debés aceptar el tratamiento de datos personales para continuar.' })
    }
    if (!RE_TELEFONO_UY.test(telefono || '')) {
      return res.status(400).json({ mensaje: 'Ingresá un número de celular uruguayo válido.' })
    }
    if (!contrasena || contrasena.length < LARGO_MIN_CONTRASENA) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres.' })
    }
    const codigo = await Usuario.registrarCuenta(nombre, telefono, contrasena, consentimientoDatosOtorgado)
    res.json({ mensaje: 'Código enviado por SMS. Ingresalo para activar tu cuenta.', codigo_dev: codigo })
  } catch (error) {
    res.status(400).json({ mensaje: error.message })
  }
}

const verificar = async (req, res) => {
  try {
    const { telefono, codigo } = req.body
    const datos = await Usuario.verificarCodigoActivacion(telefono, codigo)
    res.json({ mensaje: 'Cuenta activada correctamente.', ...datos })
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
    if (!contrasena || contrasena.length < LARGO_MIN_CONTRASENA) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres.' })
    }
    await Usuario.restablecerContrasena(telefono, contrasena)
    res.json({ mensaje: 'Contraseña actualizada correctamente. Ya podés iniciar sesión.' })
  } catch (error) {
    res.status(400).json({ mensaje: error.message })
  }
}

const activarModoDistribuidor = async (req, res) => {
  try {
    const usuario = await Usuario.obtenerPorId(req.usuario.id)
    await usuario.activarModoDistribuidor()
    res.json({ mensaje: 'Modo distribuidor activado correctamente.' })
  } catch (error) {
    res.status(400).json({ mensaje: error.message })
  }
}

export { registro, verificar, login, recuperarContrasena, verificarRecuperacion, nuevaContrasena, activarModoDistribuidor }