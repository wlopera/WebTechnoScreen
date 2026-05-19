import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Obtener todos los roles de la base de datos (Accesible para administradores)
 */
export const getRoles = async (req: Request, res: Response) => {
    const { roleType } = req.user || {};

    if (roleType !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requieren privilegios de administrador.'
        });
    }

    try {
        const { data: roles, error } = await supabase
            .from('roles')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            data: roles
        });
    } catch (err: any) {
        console.error('Error al obtener roles:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener los roles.'
        });
    }
};

/**
 * Crear un nuevo rol de sistema (Solo Administradores)
 */
export const createRole = async (req: Request, res: Response) => {
    const { name, description, roleType, isActive } = req.body;
    const { roleType: userRoleType } = req.user || {};

    if (userRoleType !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requieren privilegios de administrador.'
        });
    }

    if (!name || !roleType) {
        return res.status(400).json({
            success: false,
            message: 'El nombre del rol y el tipo de acceso son obligatorios.'
        });
    }

    try {
        const { data: newRole, error } = await supabase
            .from('roles')
            .insert({
                name,
                description,
                role_type: roleType,
                is_active: isActive !== undefined ? isActive : true
            })
            .select('*')
            .single();

        if (error) {
            throw error;
        }

        return res.status(201).json({
            success: true,
            message: 'Rol creado exitosamente.',
            data: newRole
        });
    } catch (err: any) {
        console.error('Error al crear rol:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al crear el rol.'
        });
    }
};

/**
 * Actualizar nombre, descripción, tipo y estado de activación de un rol (Solo Administradores)
 */
export const updateRole = async (req: Request, res: Response) => {
    const { roleId } = req.params;
    const { name, description, roleType, isActive } = req.body;
    const { roleType: userRoleType } = req.user || {};

    if (userRoleType !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requieren privilegios de administrador.'
        });
    }

    if (!name || !roleType) {
        return res.status(400).json({
            success: false,
            message: 'El nombre del rol y el tipo de acceso son requeridos.'
        });
    }

    try {
        const { data: updatedRole, error } = await supabase
            .from('roles')
            .update({ 
                name, 
                description,
                role_type: roleType,
                is_active: isActive !== undefined ? isActive : true
            })
            .eq('role_id', roleId)
            .select('*')
            .single();

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            message: 'Rol actualizado exitosamente.',
            data: updatedRole
        });
    } catch (err: any) {
        console.error('Error al actualizar rol:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al intentar actualizar el rol.'
        });
    }
};

/**
 * Eliminar un rol por ID (Solo Administradores)
 */
export const deleteRole = async (req: Request, res: Response) => {
    const { roleId } = req.params;
    const { roleType } = req.user || {};

    if (roleType !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requieren privilegios de administrador.'
        });
    }

    try {
        const { error } = await supabase
            .from('roles')
            .delete()
            .eq('role_id', roleId);

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            message: 'Rol eliminado exitosamente de la base de datos.'
        });
    } catch (err: any) {
        console.error('Error al eliminar rol:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al intentar eliminar el rol.'
        });
    }
};
