import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DecodedToken } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'un_secreto_super_seguro_predeterminado';

/**
 * Middleware para validar que el usuario está autenticado mediante un Token JWT.
 * El token debe ser enviado en la cabecera 'Authorization' como 'Bearer <token>'.
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ 
            success: false, 
            message: 'Acceso no autorizado. No se proporcionó un token.' 
        });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Acceso no autorizado. Formato de token inválido.' 
        });
    }

    try {
        // Verificar el token con la clave secreta
        const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
        
        // Adjuntar los datos decodificados al objeto Request para su uso en los controladores
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false, 
            message: 'Sesión inválida o expirada. Por favor inicie sesión nuevamente.' 
        });
    }
};

/**
 * Middleware para requerir rol de Administrador.
 * Debe utilizarse después de 'authenticateJWT'.
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false, 
            message: 'Acceso no autorizado. Debe estar autenticado primero.' 
        });
    }

    if (req.user.roleType !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Acceso denegado. Se requieren privilegios de administrador.' 
        });
    }

    next();
};
