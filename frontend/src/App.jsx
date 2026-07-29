import { Routes, Route } from 'react-router-dom'
import { CarritoProvider } from './context/CarritoContext'
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
import Carrito from './pages/modoComprador/Carrito'
import MisPedidosComprador from './pages/modoComprador/MisPedidos'
import ConfirmacionPedido from './pages/modoComprador/ConfirmacionPedido'
import ConfigurarPerfil from './pages/modoDistribuidor/ConfigurarPerfil'
import EditarPerfil from './pages/modoDistribuidor/EditarPerfil'
import EditarProducto from './pages/modoDistribuidor/EditarProducto'
import MisPedidos from './pages/modoDistribuidor/MisPedidos'
import Catalogo from './pages/Catalogo'
import DetalleProducto from './pages/modoComprador/DetalleProducto'

function App() {
  return (
    <CarritoProvider>
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
        <Route path='/carrito' element={<Carrito />} />
        <Route path='/confirmar-pedido' element={<ConfirmacionPedido />} />
        <Route path='/configurarPerfil' element={<ConfigurarPerfil />} />
        <Route path='/editarPerfil' element={<EditarPerfil />} />
        <Route path='/pedidos' element={<MisPedidos />} />
        <Route path='/misPedidos' element={<MisPedidosComprador />} />
        <Route path='/catalogo' element={<Catalogo />} />
        <Route path='/' element={<Catalogo />} />
        <Route path='/producto/:id' element={<DetalleProducto />} />
      </Routes>
    </CarritoProvider>
  )
}

export default App