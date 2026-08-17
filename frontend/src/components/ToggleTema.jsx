import { useTema } from '../context/TemaContext'
import './ToggleTema.css'

function ToggleTema() {
  const { tema, alternarTema } = useTema()
  const esOscuro = tema === 'oscuro'

  return (
    <div
      className="comprador-menu-item toggle-tema-item"
      onClick={(e) => { e.stopPropagation(); alternarTema() }}
    >
      <span>Tema oscuro</span>
      <span className="toggle-tema" role="switch" aria-checked={esOscuro}>
        <span className="toggle-tema-perilla" />
      </span>
    </div>
  )
}

export default ToggleTema
