const multer = require('multer')
const path = require('path')

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

module.exports = upload