import { useNavigate } from 'react-router-dom'
import './Privacidad.css'

function Privacidad() {
  const navigate = useNavigate()

  return (
    <div className="privacidad-pagina">
      <header className="privacidad-encabezado">
        <span className="privacidad-logo" onClick={() => navigate('/')}>MarketDist</span>
      </header>

      <main className="privacidad-contenido">
        <div className="privacidad-tarjeta">
          <h1 className="privacidad-titulo">Política de privacidad</h1>
          <p className="privacidad-actualizado">Última actualización: septiembre de 2026.</p>

          <h2 className="privacidad-subtitulo">Qué datos recopilamos</h2>
          <p>
            Al registrarte, guardamos tu nombre completo, número de teléfono y contraseña (esta última
            nunca en texto plano, siempre con hash). Al usar la plataforma, guardamos además los datos
            propios de tu actividad: los pedidos que hacés o recibís, los productos que publicás si sos
            distribuidor, y la dirección de entrega o de depósito que ingreses.
          </p>

          <h2 className="privacidad-subtitulo">Para qué los usamos</h2>
          <p>
            Usamos estos datos únicamente para crear y operar tu cuenta, verificar tu identidad por SMS,
            procesar los pedidos entre compradores y distribuidores, y contactarte sobre el estado de tus
            pedidos. No vendemos ni compartimos tus datos personales con terceros ajenos al
            funcionamiento de la plataforma.
          </p>

          <h2 className="privacidad-subtitulo">Tus derechos</h2>
          <p>
            De acuerdo con la Ley N.° 18.331 de Protección de Datos Personales de Uruguay, tenés derecho
            a acceder a tus datos personales, solicitar su rectificación si están desactualizados o son
            incorrectos, y pedir su eliminación. Para ejercer cualquiera de estos derechos, escribinos a{' '}
            <a href="mailto:privacidad@marketdist.com">privacidad@marketdist.com</a> indicando tu número
            de teléfono registrado y el pedido concreto (acceso, rectificación o eliminación). Vamos a
            responder tu solicitud a la brevedad.
          </p>

          <button type="button" className="privacidad-volver" onClick={() => navigate(-1)}>← Volver</button>
        </div>
      </main>
    </div>
  )
}

export default Privacidad
