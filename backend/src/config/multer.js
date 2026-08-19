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

const upload = multer({ storage })

export default upload
