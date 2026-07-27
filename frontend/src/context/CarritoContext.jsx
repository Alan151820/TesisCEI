import { createContext, useContext, useState, useEffect } from 'react'

const CarritoContext = createContext(null)

const STORAGE_PREFIX = 'carrito_items'

function getUserKey() {
  const token = localStorage.getItem('token')
  if (!token) return 'guest'
  try {
    const { id } = JSON.parse(atob(token.split('.')[1]))
    return String(id)
  } catch {
    return 'guest'
  }
}

function cargarDesdeStorage(key) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}_${key}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CarritoProvider({ children }) {
  const [userKey, setUserKey] = useState(getUserKey)
  const [items, setItems] = useState(() => cargarDesdeStorage(getUserKey()))

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}_${userKey}`, JSON.stringify(items))
  }, [items, userKey])

  useEffect(() => {
    const handleAuthChange = () => {
      const newKey = getUserKey()
      setUserKey(newKey)
      setItems(cargarDesdeStorage(newKey))
    }
    window.addEventListener('auth-changed', handleAuthChange)
    return () => window.removeEventListener('auth-changed', handleAuthChange)
  }, [])

  function agregarProducto(producto, cantidad = 1) {
    setItems(prev => {
      const existente = prev.find(i => i.id === producto.id)
      if (existente) {
        return prev.map(i =>
          i.id === producto.id
            ? { ...i, cantidad: i.cantidad + cantidad }
            : i
        )
      }
      return [...prev, {
        id: producto.id,
        nombre: producto.nombre,
        imagenUrl: producto.imagenUrl,
        distribuidorId: producto.distribuidorId,
        nombreDistribuidor: producto.nombreDistribuidor,
        precioMinimo: producto.precioMinimo,
        cantidad,
      }]
    })
  }

  function modificarCantidad(productoId, cantidad) {
    if (cantidad <= 0) {
      eliminarProducto(productoId)
      return
    }
    setItems(prev =>
      prev.map(i => i.id === productoId ? { ...i, cantidad } : i)
    )
  }

  function eliminarProducto(productoId) {
    setItems(prev => prev.filter(i => i.id !== productoId))
  }

  function vaciar() {
    setItems([])
  }

  const totalItems = items.reduce((acc, i) => acc + i.cantidad, 0)

  return (
    <CarritoContext.Provider value={{ items, agregarProducto, modificarCantidad, eliminarProducto, vaciar, totalItems }}>
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  return useContext(CarritoContext)
}
