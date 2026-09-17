import pool from '../config/db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import twilio from 'twilio'
import CodigoVerificacion from './CodigoVerificacion.js'

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

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

  // El registro pendiente de verificación se guarda en la base (fila usuario
  // con cuenta_verificada = false + un codigo_verificacion 'activacion_cuenta'),
  // igual que recuperación — no en memoria del proceso, que se pierde en cada
  // reinicio y no funciona con más de una instancia.
  static async registrarCuenta(nombre, telefono, contrasena, consentimientoDatosOtorgado) {
    const existente = await pool.query(
      'SELECT id, cuenta_verificada FROM usuario WHERE telefono = $1',
      [telefono]
    )
    if (existente.rows.length > 0 && existente.rows[0].cuenta_verificada) {
      throw new Error('El número de teléfono ya está registrado. Iniciá sesión o recuperá tu contraseña.')
    }

    const contrasenaHash = await bcrypt.hash(contrasena, 10)
    let usuarioId

    if (existente.rows.length > 0) {
      // Ya hay un registro de este teléfono pendiente de verificación
      // (RF-009 [E3]): se reenvía el código. Se actualizan los datos por si
      // el usuario volvió a completar el formulario con algo distinto.
      usuarioId = existente.rows[0].id
      await pool.query(
        'UPDATE usuario SET nombre_completo = $1, contrasena_hash = $2, consentimiento_datos_otorgado = $3 WHERE id = $4',
        [nombre, contrasenaHash, consentimientoDatosOtorgado, usuarioId]
      )
    } else {
      try {
        const nuevo = await pool.query(
          'INSERT INTO usuario (nombre_completo, telefono, contrasena_hash, cuenta_verificada, consentimiento_datos_otorgado) VALUES ($1, $2, $3, false, $4) RETURNING id',
          [nombre, telefono, contrasenaHash, consentimientoDatosOtorgado]
        )
        usuarioId = nuevo.rows[0].id
      } catch (error) {
        // Carrera: otro registro insertó este mismo teléfono entre el SELECT
        // y el INSERT. La garantía real es el UNIQUE de usuario.telefono.
        if (error.code === '23505') {
          throw new Error('El número de teléfono ya está registrado. Iniciá sesión o recuperá tu contraseña.')
        }
        throw error
      }
    }

    const codigo = CodigoVerificacion.generarCodigo()
    const expiracion = CodigoVerificacion.calcularExpiracion()
    await CodigoVerificacion.crear(usuarioId, codigo, 'activacion_cuenta', expiracion)

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
    const resultado = await pool.query('SELECT * FROM usuario WHERE telefono = $1', [telefono])
    if (resultado.rows.length === 0) throw new Error('El código ingresado no es válido. Intentá de nuevo.')

    const usuario = new Usuario(resultado.rows[0])

    const registro = await CodigoVerificacion.buscarVigente(usuario.id, codigo, 'activacion_cuenta')
    if (!registro) throw new Error('El código ingresado no es válido. Intentá de nuevo.')
    if (registro.haVencido()) throw new Error('El código expiró. Solicitá uno nuevo.')

    await registro.marcarComoUsado()
    await pool.query('UPDATE usuario SET cuenta_verificada = true WHERE id = $1', [usuario.id])
    usuario.cuentaVerificada = true

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
    // Solo cuentas verificadas (RF-011: "comprador con cuenta activa"). Un
    // registro pendiente de verificación responde igual que un teléfono
    // desconocido — desde que el pendiente vive en esta misma tabla (A3),
    // este filtro es necesario para no exponerlo a la recuperación.
    const resultado = await pool.query(
      'SELECT id FROM usuario WHERE telefono = $1 AND cuenta_verificada = true',
      [telefono]
    )
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
    const usuario = await pool.query(
      'SELECT id FROM usuario WHERE telefono = $1 AND cuenta_verificada = true',
      [telefono]
    )
    if (usuario.rows.length === 0) throw new Error('No encontramos una cuenta con ese número de teléfono.')

    const registro = await CodigoVerificacion.buscarVigente(usuario.rows[0].id, codigo, 'recuperacion_password')

    if (!registro) throw new Error('El código ingresado no es válido. Intentá de nuevo.')
    if (registro.haVencido()) throw new Error('El código expiró. Solicitá uno nuevo.')

    await registro.marcarComoUsado()

    return true
  }

  static async restablecerContrasena(telefono, contrasena) {
    const usuario = await pool.query(
      'SELECT id FROM usuario WHERE telefono = $1 AND cuenta_verificada = true',
      [telefono]
    )
    if (usuario.rows.length === 0) throw new Error('No encontramos una cuenta con ese número de teléfono.')
    const usuarioId = usuario.rows[0].id

    const contrasenaHash = await bcrypt.hash(contrasena, 10)

    const cliente = await pool.connect()
    try {
      await cliente.query('BEGIN')

      // RF-011: la contraseña solo se cambia si antes se verificó un código de
      // recuperación vigente (verificarCodigoRecuperacion lo dejó usado=true).
      // Sin este chequeo, una llamada directa al endpoint cambiaría la clave
      // de cualquier cuenta con solo el teléfono. FOR UPDATE evita que dos
      // requests concurrentes reusen la misma verificación.
      const res = await cliente.query(
        `SELECT * FROM codigo_verificacion
         WHERE usuario_id = $1 AND proposito = 'recuperacion_password' AND usado = true
         ORDER BY fecha_creacion DESC LIMIT 1 FOR UPDATE`,
        [usuarioId]
      )
      const registro = res.rows.length ? new CodigoVerificacion(res.rows[0]) : null
      if (!registro || registro.haVencido()) {
        throw new Error('Verificá el código de recuperación antes de cambiar la contraseña.')
      }

      await cliente.query('UPDATE usuario SET contrasena_hash = $1 WHERE id = $2', [contrasenaHash, usuarioId])

      // RF-011 paso 6: el código de recuperación queda inválido tras el cambio.
      await cliente.query(
        `DELETE FROM codigo_verificacion WHERE usuario_id = $1 AND proposito = 'recuperacion_password'`,
        [usuarioId]
      )

      await cliente.query('COMMIT')
      return true
    } catch (error) {
      await cliente.query('ROLLBACK')
      throw error
    } finally {
      cliente.release()
    }
  }

  async activarModoDistribuidor() {
    if (this.modoDistribuidorActivo) throw new Error('El modo distribuidor ya está activo en esta cuenta.')
    await pool.query('UPDATE usuario SET modo_distribuidor_activo = TRUE WHERE id = $1', [this.id])
    this.modoDistribuidorActivo = true
    return true
  }

}

export default Usuario