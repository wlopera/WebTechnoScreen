import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'un_secreto_super_seguro_predeterminado';

/**
 * Controlador de Autenticación
 */
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'El correo electrónico y la contraseña son requeridos.' 
        });
    }

    try {
        // Consultar el usuario en Supabase con su rol respectivo
        const { data: user, error } = await supabase
            .from('users')
            .select('*, roles(*)')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciales inválidas. Correo electrónico o contraseña incorrectos.' 
            });
        }

        // Validar si el usuario está activo
        if (!user.is_active) {
            return res.status(403).json({ 
                success: false, 
                message: 'Esta cuenta ha sido desactivada. Comuníquese con el administrador.' 
            });
        }

        // Comparar contraseña con el hash guardado en la base de datos
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Credenciales inválidas. Correo electrónico o contraseña incorrectos.' 
            });
        }

        // Obtener rol
        const roleData = user.roles;
        if (!roleData) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error de configuración de usuario. Rol no encontrado.' 
            });
        }

        // Crear carga útil (payload) del Token JWT
        const tokenPayload = {
            userId: user.user_id,
            email: user.email,
            roleType: roleData.role_type,
            roleName: roleData.name,
            templateId: user.template_id
        };

        // Firmar token JWT con vigencia de 24 horas
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

        return res.status(200).json({
            success: true,
            message: 'Autenticación exitosa',
            data: {
                token,
                user: {
                    userId: user.user_id,
                    email: user.email,
                    roleType: roleData.role_type,
                    roleName: roleData.name,
                    templateId: user.template_id
                }
            }
        });
    } catch (err: any) {
        console.error('Error en login:', err.message);
        return res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor al procesar el inicio de sesión.' 
        });
    }
};

export const register = async (req: Request, res: Response) => {
    const { email, password, templateId } = req.body;

    if (!email || !password || !templateId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Todos los campos (correo, contraseña y plantilla) son requeridos.' 
        });
    }

    try {
        // Validar si el usuario ya existe en Supabase
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

        // Validar que la plantilla exista y esté activa
        const { data: template } = await supabase
            .from('templates')
            .select('is_active')
            .eq('template_id', templateId)
            .maybeSingle();

        if (!template) {
            return res.status(400).json({ 
                success: false, 
                message: 'La plantilla seleccionada no existe.' 
            });
        }

        if (!template.is_active) {
            return res.status(400).json({ 
                success: false, 
                message: 'La plantilla seleccionada no está activa actualmente.' 
            });
        }

        // Obtener el ID del rol estándar (Standard User) para nuevos registros
        const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('role_id')
            .eq('role_type', 'user')
            .single();

        if (roleError || !roleData) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error al recuperar la configuración del rol de usuario estándar.' 
            });
        }

        // Hashear la contraseña usando bcrypt
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Crear el registro de usuario en Supabase
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                email,
                password_hash: passwordHash,
                template_id: templateId,
                role_id: roleData.role_id,
                is_active: true
            })
            .select('user_id, email, template_id, role_id')
            .single();

        if (insertError) {
            throw insertError;
        }

        return res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente.',
            data: newUser
        });
    } catch (err: any) {
        console.error('Error en registro:', err.message);
        return res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor al registrar el usuario.' 
        });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
            success: false, 
            message: 'La contraseña actual y la nueva contraseña son obligatorias.' 
        });
    }

    if (!userId) {
        return res.status(401).json({ 
            success: false, 
            message: 'No autenticado.' 
        });
    }

    try {
        // Obtener la contraseña actual hasheada del usuario
        const { data: user, error } = await supabase
            .from('users')
            .select('password_hash')
            .eq('user_id', userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado.' 
            });
        }

        // Comparar contraseña actual
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                message: 'La contraseña actual ingresada es incorrecta.' 
            });
        }

        // Hashear la nueva contraseña
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Actualizar la contraseña en la base de datos
        const { error: updateError } = await supabase
            .from('users')
            .update({ password_hash: newPasswordHash })
            .eq('user_id', userId);

        if (updateError) {
            throw updateError;
        }

        return res.status(200).json({
            success: true,
            message: 'Contraseña actualizada correctamente.'
        });
    } catch (err: any) {
        console.error('Error en cambio de contraseña:', err.message);
        return res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor al actualizar la contraseña.' 
        });
    }
};
