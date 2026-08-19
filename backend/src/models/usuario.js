import pool from '../config/db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import twilio from 'twilio'
import CodigoVerificacion from './CodigoVerificacion.js'

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

const registrosPendientes = []

class Usuario {
  constructor(data) {
    this.id = data.id
    this.nombreCompleto = data.nombre_completo
    this.telefono = data.telefono
    this.contrasenaHash = data.contrasena_hash
    this.modoDistribuidorActivo = data.modo_distribuidor_activo
    this.cuentaVerificada = data.cuenta_verificada
    this.consentimientoDatosOtorgado = data.consentimiento_datos_otorgado
    this.fechaCreacion = data.fecha_creacion
  }

  static async obtenerPorId(id) {
    const resultado = await pool.query('SELECT * FROM usuario WHERE id = $1', [id])
    if (resultado.rows.length === 0) return null
    return new Usuario(resultado.rows[0])
  }

  static async registrarCuenta(nombre, telefono, contrasena) {
    const existente = await pool.query('SELECT id FROM usuario WHERE telefono = $1', [telefono])
    if (existente.rows.length > 0) {
      throw new Error('El número de teléfono ya está registrado. Iniciá sesión o recuperá tu contraseña.')
    }

    const codigo = CodigoVerificacion.generarCodigo()
    const expiracion = CodigoVerificacion.calcularExpiracion()
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

    return codigo
  }

  static async verificarCodigoActivacion(telefono, codigo) {
    const pendiente = registrosPendientes.find(r => r.telefono === telefono && r.codigo === codigo)

    if (!pendiente) throw new Error('El código ingresado no es válido. Intentá de nuevo.')
    if (new Date() > pendiente.expiracion) throw new Error('El código expiró. Solicitá uno nuevo.')

    const resultado = await pool.query(
      'INSERT INTO usuario (nombre_completo, telefono, contrasena_hash, cuenta_verificada, consentimiento_datos_otorgado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [pendiente.nombre, pendiente.telefono, pendiente.contrasenaHash, true, true]
    )

    await CodigoVerificacion.crear(resultado.rows[0].id, pendiente.codigo, 'activacion_cuenta', pendiente.expiracion, true)

    registrosPendientes.splice(registrosPendientes.indexOf(pendiente), 1)

    const usuario = new Usuario(resultado.rows[0])

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombreCompleto },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    return { token, nombre: usuario.nombreCompleto, modoDistribuidorActivo: usuario.modoDistribuidorActivo, telefono: usuario.telefono }
  }

  static async iniciarSesion(telefono, contrasena) {
    const resultado = await pool.query('SELECT * FROM usuario WHERE telefono = $1', [telefono])
    if (resultado.rows.length === 0) throw new Error('No encontramos una cuenta con ese número de teléfono.')

    const usuario = new Usuario(resultado.rows[0])

    if (!usuario.cuentaVerificada) throw new Error('Tu cuenta aún no fue verificada. Revisá el SMS que te enviamos.')

    const contrasenaCorrecta = await bcrypt.compare(contrasena, usuario.contrasenaHash)
    if (!contrasenaCorrecta) throw new Error('El teléfono o la contraseña son incorrectos.')

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombreCompleto },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    return { token, nombre: usuario.nombreCompleto, modoDistribuidorActivo: usuario.modoDistribuidorActivo, telefono: usuario.telefono }
  }

  static async solicitarRecuperacionContrasena(telefono) {
    const resultado = await pool.query('SELECT id FROM usuario WHERE telefono = $1', [telefono])
    if (resultado.rows.length === 0) throw new Error('No encontramos una cuenta con ese número de teléfono.')

    const codigo = CodigoVerificacion.generarCodigo()
    const expiracion = CodigoVerificacion.calcularExpiracion()

    await CodigoVerificacion.crear(resultado.rows[0].id, codigo, 'recuperacion_password', expiracion)

    try {
      await client.messages.create({
        body: `Tu código de recuperación es: ${codigo}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: telefono
      })
    } catch (twilioError) {
      console.log('SMS no enviado:', twilioError.message)
    }

    return codigo
  }

  static async verificarCodigoRecuperacion(telefono, codigo) {
    const usuario = await pool.query('SELECT id FROM usuario WHERE telefono = $1', [telefono])
    if (usuario.rows.length === 0) throw new Error('No encontramos una cuenta con ese número de teléfono.')

    const registro = await CodigoVerificacion.buscarVigente(usuario.rows[0].id, codigo, 'recuperacion_password')

    if (!registro) throw new Error('El código ingresado no es válido. Intentá de nuevo.')
    if (registro.haVencido()) throw new Error('El código expiró. Solicitá uno nuevo.')

    await registro.marcarComoUsado()

    return true
  }

  static async restablecerContrasena(telefono, contrasena) {
    const contrasenaHash = await bcrypt.hash(contrasena, 10)
    await pool.query('UPDATE usuario SET contrasena_hash = $1 WHERE telefono = $2', [contrasenaHash, telefono])
    return true
  }

  async activarModoDistribuidor() {
    if (this.modoDistribuidorActivo) throw new Error('El modo distribuidor ya está activo en esta cuenta.')
    await pool.query('UPDATE usuario SET modo_distribuidor_activo = TRUE WHERE id = $1', [this.id])
    this.modoDistribuidorActivo = true
    return true
  }

  cambiarModoActivo() {
    return true
  }

  cerrarSesion() {
    return true
  }
}

export default Usuario