import { Router } from 'express';
import { getRoles, createRole, updateRole, deleteRole } from '../controllers/role.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas de roles requieren autenticación JWT
router.use(authenticateJWT);

// Rutas de administración de roles
router.get('/', getRoles);
router.post('/', createRole);
router.put('/:roleId', updateRole);
router.delete('/:roleId', deleteRole);

export default router;
