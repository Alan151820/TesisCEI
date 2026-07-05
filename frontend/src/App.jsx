import { Routes, Route } from 'react-router-dom'
<<<<<<< HEAD
import Registro from './pages/autenticacion/Registro'
import Verificar from './pages/autenticacion/Verificar'
import Login from './pages/autenticacion/Login'
import RecuperarContrasena from './pages/autenticacion/RecuperarContrasena'
import VerificarRecuperacion from './pages/autenticacion/VerificarRecuperacion'
import NuevaContrasena from './pages/autenticacion/NuevaContrasena'
import Inicio from './pages/modoDistribuidor/Inicio'
import PanelDistribuidor from './pages/modoDistribuidor/PanelDistribuidor'
import FichaProducto from './pages/modoDistribuidor/FichaProducto'
=======
import Registro from './pages/Registro'
import Verificar from './pages/Verificar'
import Inicio from './pages/Inicio'
import Login from './pages/Login'
import FichaProducto from './pages/FichaProducto'
>>>>>>> e0c674d (feat(RF-014): implementar creación de producto con validaciones y formulario)

function App() {
  return (
    <Routes>
      <Route path='/registro' element={<Registro />} />
      <Route path='/verificar' element={<Verificar />} />
      <Route path='/login' element={<Login />} />
<<<<<<< HEAD
      <Route path='/recuperarContrasena' element={<RecuperarContrasena />} />
      <Route path='/verificarRecuperacion' element={<VerificarRecuperacion />} />
      <Route path='/nuevaContrasena' element={<NuevaContrasena />} />
      <Route path='/inicio' element={<Inicio />} />
      <Route path='/panelDistribuidor' element={<PanelDistribuidor />} />
=======
>>>>>>> e0c674d (feat(RF-014): implementar creación de producto con validaciones y formulario)
      <Route path='/producto/nuevo' element={<FichaProducto />} />
    </Routes>
  )
}

export default App
