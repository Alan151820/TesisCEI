import Distribuidor from '../models/Distribuidor.js'
import Producto from '../models/Producto.js'
import { esIdValido } from '../middleware/validaciones.js'

const obtenerPerfil = async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!esIdValido(id)) {
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

const actualizarDireccionPartida = async (req, res, next) => {
  try {
    const direccionPartida = (req.body.direccionPartida || '').trim()
    const { latitud, longitud } = req.body
    if (!direccionPartida) {
      return res.status(400).json({ error: 'Ingresá la dirección de partida antes de guardar.' })
    }

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
    const id = Number(req.params.id)
    if (!esIdValido(id)) {
      return res.json([])
    }
    const productos = await Producto.listarPublicadosPorDistribuidor(id)
    res.json(productos)
  } catch (error) {
    next(error)
  }
}


export { obtenerPerfil, configurarPerfil, verificarPerfil, obtenerPerfilPropio, editarPerfil, subirLogo, actualizarDireccionPartida, obtenerProductosPublicados }
