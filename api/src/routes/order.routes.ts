import { Router } from 'express';
import { uploadOrder, getOrders, deleteOrder } from '../controllers/order.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { uploadPDF } from '../middleware/upload.middleware';

const router = Router();

// Todas las rutas de órdenes requieren que el usuario esté autenticado
router.use(authenticateJWT);

// Cargar un archivo PDF
router.post('/upload', uploadPDF.single('file'), uploadOrder);

// Obtener el historial de órdenes cargadas
router.get('/', getOrders);

// Eliminar una orden (Solo Administradores)
router.delete('/:orderId', deleteOrder);

export default router;
