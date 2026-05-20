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
        console.log(`[PRODUCCIÓN] Iniciando procesamiento de carga de PDF en vivo.`);

        // Generar un UUID de orden seguro para producción
        const orderId = crypto.randomUUID();

        // Limpiar el nombre de archivo
        const cleanFilename = req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');

        // 1. SUBIR EL ARCHIVO PDF REAL A SUPABASE STORAGE
        console.log(`[PRODUCCIÓN] Subiendo PDF a Supabase Storage: orders/${userId}/${orderId}_${cleanFilename}`);
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('pdfs')
            .upload(`orders/${userId}/${orderId}_${cleanFilename}`, req.file.buffer, {
                contentType: req.file.mimetype,
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('[ERROR STORAGE] Falló la subida a Supabase Storage:', uploadError.message);
            throw new Error(`Error al subir el archivo al storage: ${uploadError.message}`);
        }

        // 2. OBTENER LA URL PÚBLICA REAL DEL PDF EN SUPABASE STORAGE
        const { data: publicUrlData } = supabase.storage
            .from('pdfs')
            .getPublicUrl(`orders/${userId}/${orderId}_${cleanFilename}`);
        
        const publicUrl = publicUrlData.publicUrl;
        console.log(`[PRODUCCIÓN] URL pública del PDF en Supabase Storage: ${publicUrl}`);

        // 3. REGISTRAR LA ORDEN REAL EN LA BASE DE DATOS DE SUPABASE
        console.log(`[PRODUCCIÓN] Registrando registro de orden en la base de datos...`);
        const { data: newOrder, error: dbError } = await supabase
            .from('orders')
            .insert([
                {
                    order_id: orderId,
                    user_id: userId,
                    filename: req.file.originalname,
                    pdf_url: publicUrl
                }
            ])
            .select()
            .single();

        if (dbError) {
            console.error('[ERROR DB] Falló la inserción en la base de datos de Supabase:', dbError.message);
            // Intentar limpiar/eliminar el PDF recién subido del storage para no dejar basura si la DB falla
            await supabase.storage.from('pdfs').remove([`orders/${userId}/${orderId}_${cleanFilename}`]);
            throw new Error(`Error al registrar la orden en la base de datos: ${dbError.message}`);
        }

        // 4. PREPARAR EL PAYLOAD REAL QUE ENVIAREMOS A N8N
        const payloadDetails = {
            orderId: newOrder.order_id,
            userId: userId,
            email: email,
            templateId: templateId || 'Sin plantilla asignada (Rol Admin)',
            date: newOrder.created_at || new Date().toISOString(),
            pdfUrl: publicUrl,
            file: {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            }
        };

        // IMPRIMIR EN LA CONSOLA EL PAYLOAD REAL ENVIADO A N8N
        console.log("\n=======================================================");
        console.log("📤 PAYLOAD REAL ENVIADO AL WEBHOOK DE N8N:");
        console.log(JSON.stringify(payloadDetails, null, 2));
        console.log("=======================================================\n");

        let n8nSuccess = false;
        let n8nResponse: any = null;
        let n8nError: any = null;

        // 5. LLAMAR SÍNCRONAMENTE AL WEBHOOK DE N8N
        if (N8N_WEBHOOK_URL) {
            try {
                console.log(`[INFO] Enviando payload a n8n en tiempo real: ${N8N_WEBHOOK_URL}`);

                const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                };

                if (N8N_API_KEY) {
                    headers['X-API-KEY'] = N8N_API_KEY;
                }

                // Esperamos síncronamente la respuesta de n8n con límite de 30s
                const response = await axios.post(N8N_WEBHOOK_URL, payloadDetails, {
                    headers,
                    timeout: 30000 
                });

                n8nResponse = response.data;

                // IMPRIMIR EN LA CONSOLA LA RESPUESTA RECIBIDA DESDE N8N
                console.log("\n=======================================================");
                console.log("📥 RESPUESTA RECIBIDA EN VIVO DESDE EL WEBHOOK DE N8N:");
                console.log(JSON.stringify(n8nResponse, null, 2));
                console.log("=======================================================\n");

                // Validar de forma robusta si n8n retornó un éxito lógico explícito
                if (n8nResponse && typeof n8nResponse === 'object' && n8nResponse.success === true) {
                    n8nSuccess = true;
                    console.log(`[SUCCESS] n8n procesó y validó el PDF exitosamente.`);
                } else {
                    n8nSuccess = false;
                    
                    if (n8nResponse === "") {
                        n8nError = "n8n respondió con un string vacío. Verifique que el Webhook de n8n tenga configurado el 'Response Mode' como 'When Last Node Finishes' o que use un nodo de respuesta explícito.";
                    } else if (n8nResponse && typeof n8nResponse === 'object') {
                        n8nError = n8nResponse.message || "n8n procesó la petición pero no reportó éxito explícito (falta 'success: true').";
                    } else {
                        n8nError = `Respuesta inesperada de n8n: ${typeof n8nResponse === 'string' ? n8nResponse : JSON.stringify(n8nResponse)}`;
                    }
                    console.log(`[WARN] n8n no reportó éxito explícito en la validación: ${n8nError}`);
                }
            } catch (err: any) {
                n8nSuccess = false;
                n8nError = err.response?.data || err.message;
                console.error(`[ERROR] No se pudo enviar o recibir respuesta de n8n:`, n8nError);
            }
        } else {
            console.log(`[WARN] N8N_WEBHOOK_URL no está definida en las variables de entorno. Se omite el envío al webhook.`);
        }

        // Definir el mensaje a retornar al frontend
        let finalMessage = '';
        if (N8N_WEBHOOK_URL) {
            if (n8nSuccess) {
                // Mensaje exitoso exacto provisto por n8n
                finalMessage = n8nResponse?.message || 'El archivo PDF fue validado y procesado con éxito.';
            } else {
                // Si n8n retornó un error estructurado en el JSON, enviamos ese mensaje exacto
                if (n8nResponse && typeof n8nResponse === 'object' && n8nResponse.message) {
                    finalMessage = n8nResponse.message;
                } else {
                    // Si no llegó un JSON o hubo error de conexión, enviamos un mensaje de error genérico
                    finalMessage = 'Error de comunicación con el servidor de n8n. Por favor verifique el flujo.';
                }
            }
        } else {
            finalMessage = 'El archivo fue cargado y guardado en la base de datos, pero el webhook de n8n no está configurado.';
        }

        return res.status(n8nSuccess ? 201 : 400).json({
            success: n8nSuccess, // Refleja el éxito real de la validación de n8n
            isSimulation: false,
            message: finalMessage,
            data: {
                order: newOrder,
                n8nIntegration: {
                    sent: !!N8N_WEBHOOK_URL,
                    success: n8nSuccess,
                    webhookUrl: N8N_WEBHOOK_URL || 'Sin configurar',
                    headers: {
                        'X-API-KEY': N8N_API_KEY ? '*****' : 'Ausente'
                    },
                    response: n8nResponse,
                    error: n8nError,
                    payload: payloadDetails
                }
            }
        });

    } catch (err: any) {
        console.error('Error al procesar la orden en producción:', err.message);

        return res.status(500).json({
            success: false,
            message: 'Error interno en el servidor al intentar registrar la orden o procesar el archivo.',
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
