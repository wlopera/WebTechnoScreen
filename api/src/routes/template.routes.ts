import { Router } from 'express';
import { getAllTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate } from '../controllers/template.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';
import jwt from 'jsonwebtoken';

const router = Router();

/**
 * Middleware local para decodificar el token JWT de forma opcional.
 * Permite que los endpoints devuelvan información adaptada (ej. vistas de admin vs públicas)
 * sin lanzar error 401 si la petición es anónima.
 */
const decodeOptionalJWT = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (token) {
            try {
                const JWT_SECRET = process.env.JWT_SECRET || 'un_secreto_super_seguro_predeterminado';
                req.user = jwt.verify(token, JWT_SECRET);
            } catch (err) {
                // Si falla la verificación, simplemente ignoramos y continuamos como anónimo
            }
        }
    }
    next();
};

// Rutas de consulta de plantillas
router.get('/', decodeOptionalJWT, getAllTemplates);
router.get('/:id', getTemplateById);

// Rutas de administración de plantillas (requieren autenticación obligatoria y rol de admin)
router.post('/', authenticateJWT, requireAdmin, createTemplate);
router.put('/:id', authenticateJWT, requireAdmin, updateTemplate);
router.delete('/:id', authenticateJWT, requireAdmin, deleteTemplate);

export default router;
