import { Routes, Route } from 'react-router-dom'
import Registro from './pages/Registro'
import Verificar from './pages/Verificar'
import Inicio from './pages/Inicio'
import Login from './pages/Login'
import FichaProducto from './pages/FichaProducto'

function App() {
  return (
    <Routes>
      <Route path='/registro' element={<Registro />} />
      <Route path='/verificar' element={<Verificar />} />
      <Route path='/inicio' element={<Inicio />} />
      <Route path='/login' element={<Login />} />
      <Route path='/producto/nuevo' element={<FichaProducto />} />
    </Routes>
  )
}

export default App