import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { tokenValido } from '../lib/auth'

export function RutaProtegida() {
  const location = useLocation()
  if (!tokenValido()) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

export function RutaDistribuidor() {
  const location = useLocation()
  if (!tokenValido()) return <Navigate to="/login" replace state={{ from: location }} />
  if (localStorage.getItem('modoDistribuidorActivo') !== 'true') {
    return <Navigate to="/configurarPerfil" replace />
  }
  return <Outlet />
}
