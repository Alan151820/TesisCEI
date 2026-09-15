import Esqueleto from './Esqueleto'
import TablaFila from './TablaFila'

function EsqueletoFilas({ columnas = 4, filas = 5 }) {
  return Array.from({ length: filas }).map((_, i) => (
    <TablaFila key={i}>
      {Array.from({ length: columnas }).map((_, j) => (
        <Esqueleto key={j} width={j === 0 ? '50%' : '80%'} />
      ))}
    </TablaFila>
  ))
}

export default EsqueletoFilas
