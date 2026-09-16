import { useNavigate } from 'react-router-dom'
import Hdr from '../components/Hdr'
import Tarjeta from '../components/ui/Tarjeta'
import Boton from '../components/ui/Boton'
import './Privacidad.css'
import Marca from '../components/Marca'

function Privacidad() {
  const navigate = useNavigate()

  return (
    <div className="privacidad-pagina">
      <Hdr logo={<span className="hdr-logo" onClick={() => navigate('/')}><Marca /></span>} />

      <div className="panel-centrado">
        <Tarjeta as="main" className="col gap-m privacidad-tarjeta">
          <div className="titulo1">Política de privacidad</div>
          <span className="texto-mudo">Última actualización: septiembre de 2026.</span>

          <div className="titulo1">Qué datos recopilamos</div>
          <p className="texto">
            Al registrarte, guardamos tu nombre completo, número de teléfono y contraseña (esta última
            nunca en texto plano, siempre con hash). Al usar la plataforma, guardamos además los datos
            propios de tu actividad: los pedidos que hacés o recibís, los productos que publicás si sos
            distribuidor, y la dirección de entrega o de depósito que ingreses.
          </p>

          <div className="titulo1">Para qué los usamos</div>
          <p className="texto">
            Usamos estos datos únicamente para crear y operar tu cuenta, verificar tu identidad por SMS,
            procesar los pedidos entre compradores y distribuidores, y contactarte sobre el estado de tus
            pedidos. No vendemos ni compartimos tus datos personales con terceros ajenos al
            funcionamiento de la plataforma.
          </p>

          <div className="titulo1">Tus derechos</div>
          <p className="texto">
            De acuerdo con la Ley N.° 18.331 de Protección de Datos Personales de Uruguay, tenés derecho
            a acceder a tus datos personales, solicitar su rectificación si están desactualizados o son
            incorrectos, y pedir su eliminación. Para ejercer cualquiera de estos derechos, escribinos a{' '}
            <a href="mailto:privacidad@marketdist.com" className="link">privacidad@marketdist.com</a> indicando tu número
            de teléfono registrado y el pedido concreto (acceso, rectificación o eliminación). Vamos a
            responder tu solicitud a la brevedad.
          </p>

          <Boton variante="ghost" onClick={() => navigate(-1)} style={{ alignSelf: 'flex-start' }}>← Volver</Boton>
        </Tarjeta>
      </div>
    </div>
  )
}

export default Privacidad
