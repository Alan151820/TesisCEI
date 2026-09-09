import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'))
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname)
    cb(null, `distribuidor-${Date.now()}${extension}`)
  }
})

// RF-049: el logo es una imagen del perfil publico. Mismo criterio que el
// uploader de imagenes de producto (middleware/upload.js): tope de 5 MB y
// solo formatos de imagen. Sin esto, subirLogo aceptaba cualquier archivo
// y de cualquier tamano. El LIMIT_FILE_SIZE lo traduce a 400 el handler de
// errores de app.js; el rechazo por tipo lleva status 400 propio.
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const permitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (permitidos.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(Object.assign(new Error('Solo se permiten imágenes (JPG, PNG, WebP).'), { status: 400 }))
    }
  }
})

export default upload
