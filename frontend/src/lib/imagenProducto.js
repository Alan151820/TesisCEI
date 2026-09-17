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
