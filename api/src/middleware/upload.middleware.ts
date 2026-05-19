import multer from 'multer';
import { Request } from 'express';

// Configuración de almacenamiento en memoria para evitar guardar archivos temporales en el disco.
// Esto nos permite reenviar el archivo directamente a n8n desde la memoria RAM.
const storage = multer.memoryStorage();

// Filtro de validación para asegurar que solo se carguen archivos PDF.
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Validar extensión y tipo MIME
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');

    if (isPdf) {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo inválido. Solo se admiten archivos PDF (.pdf)'));
    }
};

// Configurar límites (por ejemplo, tamaño máximo de 10 MB)
const limits = {
    fileSize: 10 * 1024 * 1024 // 10 Megabytes en bytes
};

// Inicializar y exportar la instancia de Multer configurada
export const uploadPDF = multer({
    storage,
    fileFilter,
    limits
});
