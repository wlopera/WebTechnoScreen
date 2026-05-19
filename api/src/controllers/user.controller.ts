import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase';

/**
 * Obtener todos los usuarios con sus roles y plantillas
 * (Solo accesible por Administrador)
 */
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('user_id, email, template_id, role_id, is_active, created_at, roles(name, role_type), templates(name)')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            data: users
        });
    } catch (err: any) {
        console.error('Error al obtener usuarios:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el listado de usuarios de la base de datos.'
        });
    }
};

/**
 * Crear un nuevo usuario por parte del Administrador
 */
export const createUser = async (req: Request, res: Response) => {
    const { email, password, templateId, roleId, isActive } = req.body;

    if (!email || !password || !roleId) {
        return res.status(400).json({
            success: false,
            message: 'El correo electrónico, contraseña y rol son campos obligatorios.'
        });
    }

    try {
        // Validar si el correo ya existe
        const { data: existingUser } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico ya está registrado.'
            });
        }

        // Hashear contraseña
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insertar en la base de datos
        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                email,
                password_hash: passwordHash,
                template_id: templateId || null,
                role_id: roleId,
                is_active: isActive !== undefined ? isActive : true
            })
            .select('user_id, email, template_id, role_id, is_active, created_at')
            .single();

        if (error) {
            throw error;
        }

        return res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente por el administrador.',
            data: newUser
        });
    } catch (err: any) {
        console.error('Error al crear usuario:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Error interno al intentar crear el usuario.'
        });
    }
};

/**
 * Actualizar un usuario existente
 */
export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email, password, templateId, roleId, isActive } = req.body;

    try {
        // Comprobar si el usuario existe
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('password_hash')
            .eq('user_id', id)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.'
            });
        }

        // Preparar objeto de actualización
        const updateData: any = {};
        if (email !== undefined) updateData.email = email;
        if (templateId !== undefined) updateData.template_id = templateId || null;
        if (roleId !== undefined) updateData.role_id = roleId;
        if (isActive !== undefined) updateData.is_active = isActive;

        // Si se suministró una nueva contraseña, hashearla y agregarla a los cambios
        if (password && password.trim() !== '') {
            const saltRounds = 10;
            updateData.password_hash = await bcrypt.hash(password, saltRounds);
        }

        // Guardar cambios en la base de datos
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('user_id', id)
            .select('user_id, email, template_id, role_id, is_active, created_at')
            .single();

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            message: 'Usuario actualizado correctamente.',
            data: updatedUser
        });
    } catch (err: any) {
        console.error('Error al actualizar usuario:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Error interno al intentar actualizar los datos del usuario.'
        });
    }
};

/**
 * Eliminar un usuario
 */
export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;

    // Evitar que el administrador se elimine a sí mismo
    if (req.user?.userId === id) {
        return res.status(400).json({
            success: false,
            message: 'No está permitido que elimine su propio usuario administrador en uso.'
        });
    }

    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('user_id', id);

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            message: 'Usuario eliminado exitosamente de la base de datos.'
        });
    } catch (err: any) {
        console.error('Error al eliminar usuario:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Error al intentar eliminar el usuario. Verifique restricciones de claves externas.'
        });
    }
};
