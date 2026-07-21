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
import PerfilDistribuidor from './pages/modoComprador/PerfilDistribuidor'
import ConfigurarPerfil from './pages/modoDistribuidor/ConfigurarPerfil'
import EditarPerfil from './pages/modoDistribuidor/EditarPerfil'
import EditarProducto from './pages/modoDistribuidor/EditarProducto'



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
      <Route path='/producto/editar/:id' element={<EditarProducto />} />
      <Route path='/inicioComprador' element={<InicioComprador />} />
      <Route path='/perfilDistribuidor/:id' element={<PerfilDistribuidor />} />
      <Route path='/configurarPerfil' element={<ConfigurarPerfil />} />
      <Route path='/editarPerfil' element={<EditarPerfil />} />

    </Routes>
  )
}

export default App