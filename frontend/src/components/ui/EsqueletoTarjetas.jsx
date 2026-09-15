import Esqueleto from './Esqueleto'
import Tarjeta from './Tarjeta'

function EsqueletoTarjetas({ cantidad = 8 }) {
  return Array.from({ length: cantidad }).map((_, i) => (
    <Tarjeta key={i} className="col gap-s">
      <Esqueleto height={140} style={{ borderRadius: 8 }} />
      <Esqueleto width="70%" />
      <Esqueleto width="45%" />
    </Tarjeta>
  ))
}

export default EsqueletoTarjetas
