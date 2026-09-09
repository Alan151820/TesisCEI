import Distribuidor from '../models/Distribuidor.js'
import Producto from '../models/Producto.js'

const obtenerPerfil = async (req, res, next) => {
  try {
    // RF-004: un id no entero se trata igual que un perfil inexistente. Sin
    // esta guarda, llega al WHERE id = $1 (columna integer) y devuelve 500.
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      return res.status(404).json({ error: 'El perfil del distribuidor no está disponible.' })
    }
    const distribuidor = await Distribuidor.obtenerPorId(id)

    if (!distribuidor) {
      return res.status(404).json({ error: 'El perfil del distribuidor no está disponible.' })
    }

    const calificacionPromedio = await distribuidor.obtenerCalificacionPromedio()

    res.json({
      id: distribuidor.id,
      nombreComercial: distribuidor.nombreComercial,
      descripcionNegocio: distribuidor.descripcionNegocio,
      zonaEntrega: distribuidor.zonaEntrega,
      logoUrl: distribuidor.logoUrl,
      calificacionPromedio
    })
  } catch (error) {
    next(error)
  }
}
// RF-048 (ampliación): direccionPartida/latitud/longitud son opcionales acá
// también, igual que ya lo eran en RF-042 desde Editar perfil — el alta
// inicial no exige la ubicación del depósito para completarse.
const configurarPerfil = async (req, res, next) => {
  try {
    const { nombreComercial, descripcionNegocio, zonaEntrega, direccionPartida, latitud, longitud } = req.body

    if (!nombreComercial) {
      return res.status(400).json({ error: 'El nombre comercial es obligatorio para continuar.' })
    }

    const distribuidor = await Distribuidor.configurarPerfilInicial(
      req.usuario.id, nombreComercial, descripcionNegocio, zonaEntrega,
      direccionPartida || null, latitud ?? null, longitud ?? null
    )

    res.json({ mensaje: 'Perfil configurado correctamente.', distribuidorId: distribuidor.id })
  } catch (error) {
    // La garantía real de "un perfil por usuario" es la constraint UNIQUE
    // (usuario_id) de la base (código 23505). Este endpoint es el primer
    // acceso al modo distribuidor; si el perfil ya existe, es un request
    // fuera de flujo, no un error del servidor.
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya tenés un perfil de distribuidor configurado.' })
    }
    next(error)
  }
}
const verificarPerfil = async (req, res, next) => {
  try {
    const distribuidor = await Distribuidor.obtenerPorUsuarioId(req.usuario.id)
    if (!distribuidor) {
      return res.json({ perfilConfigurado: false })
    }
    res.json({ perfilConfigurado: distribuidor.perfilConfigurado, distribuidorId: distribuidor.id })
  } catch (error) {
    next(error)
  }
}
const obtenerPerfilPropio = async (req, res, next) => {
  try {
    const distribuidor = await Distribuidor.obtenerPorUsuarioId(req.usuario.id)
    if (!distribuidor) {
      return res.status(404).json({ error: 'No tenés un perfil de distribuidor configurado.' })
    }

    res.json({
      nombreComercial: distribuidor.nombreComercial,
      descripcionNegocio: distribuidor.descripcionNegocio,
      zonaEntrega: distribuidor.zonaEntrega,
      direccionPartida: distribuidor.direccionPartida,
      latitud: distribuidor.latitud,
      longitud: distribuidor.longitud,
      logoUrl: distribuidor.logoUrl,
    })
  } catch (error) {
    next(error)
  }
}

const editarPerfil = async (req, res, next) => {
  try {
    const { nombreComercial, descripcionNegocio, zonaEntrega } = req.body
    const distribuidor = await Distribuidor.obtenerPorUsuarioId(req.usuario.id)
    if (!distribuidor) {
      return res.status(404).json({ error: 'No tenés un perfil de distribuidor configurado.' })
    }
    await distribuidor.editarPerfil(nombreComercial, descripcionNegocio, zonaEntrega)

    res.json({ mensaje: 'Perfil actualizado correctamente.' })
  } catch (error) {
    next(error)
  }
}
const subirLogo = async (req, res, next) => {
  try {
    const distribuidor = await Distribuidor.obtenerPorUsuarioId(req.usuario.id)
    if (!distribuidor) {
      return res.status(404).json({ error: 'No tenés un perfil de distribuidor configurado.' })
    }

    // Sin este chequeo, un request sin archivo hacía `req.file.filename`
    // sobre `undefined` y devolvía un 500 en vez de una validación clara.
    if (!req.file) {
      return res.status(400).json({ error: 'Adjuntá una imagen para el logo.' })
    }

    const logoUrl = `/uploads/${req.file.filename}`
    await distribuidor.actualizarLogo(logoUrl)

    res.json({ mensaje: 'Logo actualizado correctamente.', logoUrl })
  } catch (error) {
    next(error)
  }
}

// RF-042: dirección de partida del depósito, usada como referencia para la
// planificación de reparto. Endpoint propio (distinto de RF-049), pero el
// frontend lo dispara junto con el guardado del resto del perfil desde un
// único botón "Guardar cambios" en EditarPerfil.jsx.
const actualizarDireccionPartida = async (req, res, next) => {
  try {
    const direccionPartida = (req.body.direccionPartida || '').trim()
    const { latitud, longitud } = req.body
    if (!direccionPartida) {
      return res.status(400).json({ error: 'Ingresá la dirección de partida antes de guardar.' })
    }

    // RF-042: la dirección de partida se registra siempre junto con su
    // ubicación en el mapa. Sin este chequeo, un valor no numérico llegaba
    // al UPDATE sobre la columna `numeric` y Postgres respondía con un
    // error crudo (500). Mismo criterio que RF-008 en confirmarPedido.
    if (latitud == null || longitud == null || !Number.isFinite(Number(latitud)) || !Number.isFinite(Number(longitud))) {
      return res.status(400).json({ error: 'Marcá la ubicación del depósito en el mapa antes de guardar.' })
    }

    const distribuidor = await Distribuidor.obtenerPorUsuarioId(req.usuario.id)
    if (!distribuidor) {
      return res.status(404).json({ error: 'No tenés un perfil de distribuidor configurado.' })
    }
    await distribuidor.actualizarDireccionPartida(direccionPartida, latitud, longitud)

    res.json({ mensaje: 'Dirección de partida registrada correctamente.', direccionPartida, latitud, longitud })
  } catch (error) {
    next(error)
  }
}

const obtenerProductosPublicados = async (req, res, next) => {
  try {
    // Un id no entero equivale a un distribuidor inexistente: sin productos
    // (mismo resultado que un id numérico que no existe), no un 500.
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id < 1) {
      return res.json([])
    }
    const productos = await Producto.listarPublicadosPorDistribuidor(id)
    res.json(productos)
  } catch (error) {
    next(error)
  }
}


export { obtenerPerfil, configurarPerfil, verificarPerfil, obtenerPerfilPropio, editarPerfil, subirLogo, actualizarDireccionPartida, obtenerProductosPublicados }
