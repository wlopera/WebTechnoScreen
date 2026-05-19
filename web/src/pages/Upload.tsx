import React, { useState, useRef } from 'react';
import { useAxios } from '../hooks/useAxios';
import { 
    UploadCloud, 
    FileText, 
    Trash2, 
    Eye, 
    Send, 
    CheckSquare, 
    X,
    AlertCircle
} from 'lucide-react';

/**
 * Vista de Carga de PDFs
 * Permite Drag & Drop, previsualización técnica en modal, y validación final antes de enviar a n8n
 */
export const Upload: React.FC = () => {
    const api = useAxios();

    // Estados del Archivo PDF
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null); // URL temporal para previsualización
    const [dragActive, setDragActive] = useState<boolean>(false);

    // Estados de Modales
    const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [isValidated, setIsValidated] = useState<boolean>(false); // Checkbox de confirmación

    // Estados de Carga y Feedback
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Liberar URL temporal del archivo cuando cambie para evitar fugas de memoria
    const clearFile = () => {
        if (fileUrl) {
            URL.revokeObjectURL(fileUrl);
        }
        setFile(null);
        setFileUrl(null);
        setIsValidated(false);
        setError(null);
        setSuccess(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Procesar la selección del archivo
    const handleFile = (selectedFile: File) => {
        setError(null);
        setSuccess(null);

        // Validar que sea un archivo PDF
        if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
            setError('Formato inválido. Únicamente se admiten archivos PDF (.pdf)');
            return;
        }

        // Configurar archivo y generar su URL local de visualización
        setFile(selectedFile);
        const url = URL.createObjectURL(selectedFile);
        setFileUrl(url);
    };

    // Controladores de eventos Drag & Drop
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    // Enviar el archivo final al backend API
    const handleUploadSubmit = async () => {
        if (!file || !isValidated) return;

        setIsLoading(true);
        setError(null);
        setSuccess(null);
        setShowConfirmModal(false); // Cerrar modal de confirmación

        try {
            // Crear objeto FormData para transferir el archivo binario
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/orders/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setSuccess('¡Archivo PDF cargado, registrado y procesado en n8n exitosamente!');
                // Limpiar campos tras el éxito
                setFile(null);
                setFileUrl(null);
                setIsValidated(false);
            }
        } catch (err: any) {
            console.error('Error al subir PDF:', err);
            setError(
                err.response?.data?.message || 
                'Ocurrió un error inesperado al intentar cargar el archivo al servidor.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Formatear tamaño del archivo a legible (KB / MB)
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Cargar Archivo PDF</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Arrastra y suelta tu archivo PDF técnico, previsualízalo y envíalo para su procesamiento automatizado.
                </p>
            </div>

            {/* Mensajes de Feedback */}
            {error && (
                <div className="alert-banner alert-error" style={{ marginBottom: '24px' }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="alert-banner alert-success" style={{ marginBottom: '24px' }}>
                    <span>✅</span>
                    <span>{success}</span>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: file ? '1fr 1fr' : '1fr', gap: '32px' }}>
                
                {/* LADO IZQUIERDO: Zona de Carga (Drag & Drop) */}
                <div>
                    {!file ? (
                        <div 
                            className={`drag-drop-zone ${dragActive ? 'active' : ''}`}
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            style={{ height: '360px', justifyContent: 'center' }}
                        >
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                style={{ display: 'none' }}
                                accept=".pdf"
                                onChange={handleInputChange}
                                disabled={isLoading}
                            />
                            <div className="drag-drop-icon">
                                <UploadCloud size={32} />
                            </div>
                            <div>
                                <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>
                                    Arrastra tu archivo aquí o presiona para buscar
                                </p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    Solo se admiten documentos en formato PDF (.pdf) de hasta 10 MB
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Detalle de archivo cargado */
                        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ 
                                    background: 'rgba(239, 68, 68, 0.1)', 
                                    color: '#ef4444', 
                                    width: '48px', 
                                    height: '48px', 
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <FileText size={24} />
                                </div>
                                <div style={{ flexGrow: 1, minWidth: 0 }}>
                                    <h4 style={{ 
                                        fontWeight: 600, 
                                        whiteSpace: 'nowrap', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis' 
                                    }}>
                                        {file.name}
                                    </h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                                <button 
                                    className="modal-close" 
                                    onClick={clearFile}
                                    style={{ color: 'var(--state-danger)' }}
                                    title="Quitar archivo"
                                    disabled={isLoading}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <hr style={{ border: 'none', borderTop: 'var(--border-light)' }} />

                            {/* Panel de acciones para el archivo cargado */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowPreviewModal(true)}
                                    style={{ flexGrow: 1 }}
                                >
                                    <Eye size={18} />
                                    Revisión Técnica
                                </button>

                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => setShowConfirmModal(true)}
                                    style={{ flexGrow: 1 }}
                                    disabled={isLoading}
                                >
                                    <Send size={18} />
                                    Enviar a n8n
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* LADO DERECHO: Previsualización Pequeña Integrada */}
                {file && fileUrl && (
                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '360px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>
                            Vista Previa Rápida
                        </h3>
                        
                        <div style={{ 
                            flexGrow: 1, 
                            border: 'var(--border-light)', 
                            borderRadius: '6px', 
                            overflow: 'hidden',
                            background: '#1a1d24'
                        }}>
                            {/* Visor nativo con scroll interno */}
                            <object
                                data={fileUrl}
                                type="application/pdf"
                                width="100%"
                                height="100%"
                                style={{ border: 'none' }}
                            >
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    <p>Su navegador no admite visualización directa de PDFs.</p>
                                    <p style={{ fontSize: '0.8rem', marginTop: '6px' }}>
                                        Utilice el botón de <strong>Revisión Técnica</strong> para abrirlo en pantalla completa.
                                    </p>
                                </div>
                            </object>
                        </div>
                    </div>
                )}
            </div>

            {/* ==========================================================================
               MODAL 1: REVISIÓN TÉCNICA DEL PDF EN PANTALLA COMPLETA
               ========================================================================== */}
            {showPreviewModal && fileUrl && (
                <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
                    <div className="glass-panel modal-content modal-full" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Revisión Técnica del Documento</h3>
                            <button className="modal-close" onClick={() => setShowPreviewModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ flexGrow: 1, background: '#1a1d24', borderRadius: '8px', overflow: 'hidden' }}>
                            <object
                                data={fileUrl}
                                type="application/pdf"
                                width="100%"
                                height="100%"
                            >
                                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    <p>No se pudo renderizar la vista previa técnica.</p>
                                    <a href={fileUrl} download={file.name} style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                                        Descargar PDF para revisar localmente
                                    </a>
                                </div>
                            </object>
                        </div>
                    </div>
                </div>
            )}

            {/* ==========================================================================
               MODAL 2: CONFIRMACIÓN Y VALIDACIÓN FINAL DE CALIDAD
               ========================================================================== */}
            {showConfirmModal && (
                <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
                    <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Confirmación de Envío</h3>
                            <button className="modal-close" onClick={() => setShowConfirmModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                Antes de proceder al reenvío del archivo al webhook de n8n, debe declarar que el archivo cumple los requerimientos de legibilidad técnicos.
                            </p>
                            
                            {/* Checkbox Requerido */}
                            <label style={{ 
                                display: 'flex', 
                                gap: '12px', 
                                cursor: 'pointer',
                                background: 'rgba(255,255,255,0.02)',
                                padding: '16px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.06)'
                            }}>
                                <input 
                                    type="checkbox" 
                                    checked={isValidated}
                                    onChange={(e) => setIsValidated(e.target.checked)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '0.95rem', userSelect: 'none', fontWeight: 500 }}>
                                    He validado el formato y claridad del PDF
                                </span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setIsValidated(false);
                                }}
                            >
                                Cancelar
                            </button>

                            <button 
                                className="btn btn-primary" 
                                onClick={handleUploadSubmit}
                                disabled={!isValidated || isLoading}
                            >
                                {isLoading ? 'Procesando...' : 'Aceptar y Enviar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Upload;
