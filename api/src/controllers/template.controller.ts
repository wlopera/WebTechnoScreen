import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Obtener listado de plantillas.
 * Si es Admin, obtiene todas. Si es usuario normal/público, solo las activas.
 */
export const getAllTemplates = async (req: Request, res: Response) => {
    try {
        let query = supabase.from('templates').select('*');

        // Si no está logueado como administrador o no hay usuario adjunto en la solicitud, filtrar por activas
        if (!req.user || req.user.roleType !== 'admin') {
            query = query.eq('is_active', true);
        }

        const { data: templates, error } = await query.order('name', { ascending: true });

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            data: templates
        });
    } catch (err: any) {
        console.error('Error al obtener plantillas:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el listado de plantillas.'
        });
    }
};

/**
 * Obtener una plantilla individual por ID
 */
export const getTemplateById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const { data: template, error } = await supabase
            .from('templates')
            .select('*')
            .eq('template_id', id)
            .single();

        if (error || !template) {
            return res.status(404).json({
                success: false,
                message: 'Plantilla no encontrada.'
            });
        }

        return res.status(200).json({
            success: true,
            data: template
        });
    } catch (err: any) {
        console.error('Error al obtener la plantilla:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Error al procesar la búsqueda de la plantilla.'
        });
    }
};

/**
 * Crear una nueva plantilla
 * (Solo accesible por Administrador)
 */
export const createTemplate = async (req: Request, res: Response) => {
    const { name, description, isActive } = req.body;

    if (!name) {
        return res.status(400).json({
            success: false,
            message: 'El nombre de la plantilla es obligatorio.'
        });
    }

    try {
        const { data: newTemplate, error } = await supabase
            .from('templates')
            .insert({
                name,
                description,
                is_active: isActive !== undefined ? isActive : true
            })
            .select('*')
            .single();

        if (error) {
            throw error;
        }

        return res.status(201).json({
            success: true,
            message: 'Plantilla creada exitosamente.',
            data: newTemplate
        });
    } catch (err: any) {
        console.error('Error al crear plantilla:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al crear la plantilla.'
        });
    }
};

/**
 * Actualizar una plantilla existente
 * (Solo accesible por Administrador)
 */
export const updateTemplate = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    try {
        // Verificar si la plantilla existe
        const { data: template, error: fetchError } = await supabase
            .from('templates')
            .select('template_id')
            .eq('template_id', id)
            .single();

        if (fetchError || !template) {
            return res.status(404).json({
                success: false,
                message: 'Plantilla no encontrada.'
            });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (isActive !== undefined) updateData.is_active = isActive;

        const { data: updatedTemplate, error } = await supabase
            .from('templates')
            .update(updateData)
            .eq('template_id', id)
            .select('*')
            .single();

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            message: 'Plantilla actualizada exitosamente.',
            data: updatedTemplate
        });
    } catch (err: any) {
        console.error('Error al actualizar plantilla:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor al actualizar la plantilla.'
        });
    }
};

/**
 * Eliminar una plantilla de la base de datos
 * (Solo accesible por Administrador)
 */
export const deleteTemplate = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('templates')
            .delete()
            .eq('template_id', id);

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            message: 'Plantilla eliminada correctamente de la base de datos.'
        });
    } catch (err: any) {
        console.error('Error al eliminar plantilla:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Error al intentar eliminar la plantilla. Verifique restricciones de referencias.'
        });
    }
};
