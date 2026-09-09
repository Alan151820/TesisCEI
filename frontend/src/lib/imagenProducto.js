// Redimensiona una imagen elegida por el usuario a un máximo de 900 px de
// ancho y la re-codifica a WebP con calidad 0.85, en el navegador, antes
// de subirla. Así la foto de producto que llega al backend pesa poco sin
// pedirle al distribuidor que la optimice a mano. Se usa igual en el alta
// (FichaProducto) y en la edición (EditarProducto).
export function convertirAWebP(archivo) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(archivo)
    img.onload = () => {
      const MAX = 900
      let ancho = img.width
      let alto = img.height
      if (ancho > MAX) {
        alto = Math.round((alto * MAX) / ancho)
        ancho = MAX
      }
      const canvas = document.createElement('canvas')
      canvas.width = ancho
      canvas.height = alto
      canvas.getContext('2d').drawImage(img, 0, 0, ancho, alto)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        (blob) => resolve(new File([blob], 'imagen.webp', { type: 'image/webp' })),
        'image/webp',
        0.85
      )
    }
    img.src = url
  })
}
