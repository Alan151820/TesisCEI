import { Routes, Route } from 'react-router-dom'
import Registro from './pages/Registro'
import Verificar from './pages/Verificar'
import Inicio from './pages/Inicio'
import Login from './pages/Login'
import RecuperarContrasena from './pages/RecuperarContrasena'
import VerificarRecuperacion from './pages/VerificarRecuperacion'
import NuevaContrasena from './pages/NuevaContrasena'

function App() {
  return (
    <Routes>
      <Route path='/registro' element={<Registro />} />
      <Route path='/verificar' element={<Verificar />} />
      <Route path='/inicio' element={<Inicio />} />
      <Route path='/login' element={<Login />} />
      <Route path='/recuperarContrasena' element={<RecuperarContrasena />} />
      <Route path='/verificarRecuperacion' element={<VerificarRecuperacion />} />
      <Route path='/nuevaContrasena' element={<NuevaContrasena />} />
    </Routes>
  )
}

export default App