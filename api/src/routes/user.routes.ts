import { Router } from 'express';
import { getAllUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas de administración de usuarios requieren autenticación y rol de administrador
router.use(authenticateJWT);
router.use(requireAdmin);

// Obtener todos los usuarios
router.get('/', getAllUsers);

// Crear un nuevo usuario
router.post('/', createUser);

// Actualizar un usuario existente
router.put('/:id', updateUser);

// Eliminar un usuario
router.delete('/:id', deleteUser);

export default router;
