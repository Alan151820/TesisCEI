import { createContext, useContext, useState, useEffect } from 'react'

const TemaContext = createContext(null)

function cargarTemaInicial() {
  return localStorage.getItem('tema') === 'oscuro' ? 'oscuro' : 'claro'
}

export function TemaProvider({ children }) {
  const [tema, setTema] = useState(cargarTemaInicial)

  useEffect(() => {
    document.documentElement.setAttribute('data-tema', tema)
    localStorage.setItem('tema', tema)
  }, [tema])

  function alternarTema() {
    setTema(t => (t === 'oscuro' ? 'claro' : 'oscuro'))
  }

  return (
    <TemaContext.Provider value={{ tema, alternarTema }}>
      {children}
    </TemaContext.Provider>
  )
}

export function useTema() {
  return useContext(TemaContext)
}
