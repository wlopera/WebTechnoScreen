import { Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { supabase } from '../config/supabase';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_API_KEY = process.env.N8N_API_KEY || 'clave_api_secreta_por_defecto';

/**
 * Cargar archivo PDF, registrar orden en Base de Datos y reenviar a Webhook n8n
 */
export const uploadOrder = async (req: Request, res: Response) => {
    // Validar que se haya subido un archivo
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No se ha proporcionado ningún archivo. Por favor suba un archivo PDF.'
        });
    }

    const { userId, email, templateId } = req.user || {};

    if (!userId || !email) {
        return res.status(401).json({
            success: false,
            message: 'Usuario no autenticado en la sesión.'
        });
    }

    try {
        // Generar un UUID de orden seguro antes de procesar
        const orderId = crypto.randomUUID();

        // Limpiar el nombre de archivo de caracteres especiales para evitar errores en URLs de almacenamiento
        const cleanFilename = req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        const storagePath = `orders/${userId}/${orderId}_${cleanFilename}`;

        console.log(`[INFO] Subiendo archivo binario a Supabase Storage: ${storagePath}...`);

        // 1. Subir el archivo PDF binario al bucket 'pdfs' de Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
            .from('pdfs')
            .upload(storagePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (storageError) {
            console.error('Error al subir a Supabase Storage:', storageError.message);
            return res.status(500).json({
                success: false,
                message: 'Error al subir el archivo PDF a Supabase Storage. Verifique que exista el bucket "pdfs" y esté configurado como Público.',
                error: storageError.message
            });
        }

        // 2. Obtener la URL pública del PDF en Supabase Storage
        const { data: urlData } = supabase.storage
            .from('pdfs')
            .getPublicUrl(storagePath);

        const publicUrl = urlData.publicUrl;
        console.log(`[INFO] Archivo subido con éxito. URL Pública: ${publicUrl}`);

        // 3. Registrar la orden en la base de datos SQL de Supabase incluyendo la URL del PDF
        const { data: newOrder, error: dbError } = await supabase
            .from('orders')
            .insert({
                order_id: orderId,
                user_id: userId,
                filename: req.file.originalname,
                pdf_url: publicUrl
            })
            .select('*')
            .single();

        if (dbError || !newOrder) {
            console.error('Error al registrar orden en base de datos:', dbError?.message);
            throw new Error(`Error en base de datos: ${dbError?.message || 'No se pudo registrar el historial de carga'}`);
        }

        // 4. Preparar el reenvío de los metadatos y la URL al Webhook de n8n (Simulado para validación)
        const payloadDetails = {
            orderId: newOrder.order_id,
            userId: userId,
            email: email,
            templateId: templateId || 'Sin plantilla asignada (Rol Admin)',
            date: newOrder.created_at,
            pdfUrl: publicUrl,
            file: {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            }
        };

        return res.status(201).json({
            success: true,
            message: 'El archivo PDF se ha cargado en Storage y registrado en la Base de Datos. (Integración n8n simulada exitosamente)',
            data: {
                order: newOrder,
                n8nSimulation: {
                    active: true,
                    webhookUrl: N8N_WEBHOOK_URL || 'Sin configurar',
                    headers: {
                        'X-API-KEY': N8N_API_KEY ? '*****' : 'Ausente'
                    },
                    payload: payloadDetails
                }
            }
        });

    } catch (err: any) {
        console.error('Error al procesar la orden de carga:', err.message);

        return res.status(500).json({
            success: false,
            message: 'Error al procesar la carga o integración con n8n.',
            error: err.message
        });
    }
};

/**
 * Obtener listado de órdenes/cargas.
 * Si el usuario es administrador, ve todas. Si es usuario estándar, solo ve las suyas.
 */
export const getOrders = async (req: Request, res: Response) => {
    const { userId, roleType } = req.user || {};

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Usuario no autenticado.'
        });
    }

    try {
        // Consulta base trayendo el correo electrónico del usuario asociado
        let query = supabase
            .from('orders')
            .select('order_id, filename, pdf_url, created_at, user_id, users(email)');

        // Si es usuario estándar, filtrar para mostrar únicamente sus registros
        if (roleType !== 'admin') {
            query = query.eq('user_id', userId);
        }

        const { data: orders, error } = await query.order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            data: orders
        });
    } catch (err: any) {
        console.error('Error al obtener órdenes:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el historial de cargas.'
        });
    }
};

/**
 * Eliminar una orden por ID (Solo Administradores)
 */
export const deleteOrder = async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { roleType } = req.user || {};

    if (roleType !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requieren privilegios de administrador.'
        });
    }

    try {
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('order_id', orderId);

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            message: 'Registro de carga eliminado exitosamente.'
        });
    } catch (err: any) {
        console.error('Error al eliminar orden:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Error al intentar eliminar el registro de carga.'
        });
    }
};
