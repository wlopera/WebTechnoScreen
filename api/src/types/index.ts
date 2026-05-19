import { Request } from 'express';

// Definición de la interfaz para el Token JWT decodificado
export interface DecodedToken {
    userId: string;
    email: string;
    roleType: 'admin' | 'user';
    roleName: string;
    templateId: string | null;
}

// Extender el objeto Request de Express para incluir la información del usuario autenticado
declare global {
    namespace Express {
        interface Request {
            user?: DecodedToken;
        }
    }
}

// Interfaz para la tabla 'roles'
export interface Role {
    role_id: string;
    name: string;
    description?: string;
    role_type: 'admin' | 'user';
}

// Interfaz para la tabla 'templates'
export interface Template {
    template_id: string;
    name: string;
    description?: string;
    is_active: boolean;
}

// Interfaz para la tabla 'users'
export interface User {
    user_id: string;
    email: string;
    password_hash: string;
    template_id: string | null;
    role_id: string;
    is_active: boolean;
    created_at: string;
}

// Interfaz para la tabla 'orders'
export interface Order {
    order_id: string;
    user_id: string | null;
    filename: string;
    created_at: string;
}
