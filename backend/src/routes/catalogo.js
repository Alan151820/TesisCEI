import express from 'express'
import * as catalogoController from '../controllers/catalogoController.js'

const router = express.Router()

router.get('/', catalogoController.listarCatalogo)
router.get('/:id', catalogoController.obtenerDetalle)

export default router
