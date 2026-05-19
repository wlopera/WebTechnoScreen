import { Router } from 'express';
import { login, register, changePassword } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Ruta de inicio de sesión
router.post('/login', login);

// Ruta de registro de usuarios estándar
router.post('/register', register);

// Ruta para cambiar contraseña (requiere token de sesión)
router.post('/change-password', authenticateJWT, changePassword);

export default router;
