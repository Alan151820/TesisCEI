import { Routes, Route } from 'react-router-dom'
import Registro from './pages/autenticacion/Registro'
import Verificar from './pages/autenticacion/Verificar'
import Login from './pages/autenticacion/Login'
import RecuperarContrasena from './pages/autenticacion/RecuperarContrasena'
import VerificarRecuperacion from './pages/autenticacion/VerificarRecuperacion'
import NuevaContrasena from './pages/autenticacion/NuevaContrasena'
import Inicio from './pages/modoDistribuidor/Inicio'
import FichaProducto from './pages/modoDistribuidor/FichaProducto'
import InicioComprador from './pages/modoComprador/InicioComprador'



function App() {
  return (
    <Routes>
      <Route path='/registro' element={<Registro />} />
      <Route path='/verificar' element={<Verificar />} />
      <Route path='/login' element={<Login />} />
      <Route path='/recuperarContrasena' element={<RecuperarContrasena />} />
      <Route path='/verificarRecuperacion' element={<VerificarRecuperacion />} />
      <Route path='/nuevaContrasena' element={<NuevaContrasena />} />
      <Route path='/inicio' element={<Inicio />} />
      <Route path='/producto/nuevo' element={<FichaProducto />} />
      <Route path='/inicioComprador' element={<InicioComprador />} />

    </Routes>
  )
}

export default App
