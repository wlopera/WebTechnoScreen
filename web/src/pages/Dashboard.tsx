import React, { useState, useEffect } from 'react';
import { useAxios } from '../hooks/useAxios';
import { useAuth } from '../context/AuthContext';
import { 
    FileText, 
    UploadCloud, 
    Calendar, 
    User, 
    HardDrive,
    AlertCircle,
    Download
} from 'lucide-react';

interface OrderRecord {
    order_id: string;
    filename: string;
    pdf_url?: string;
    created_at: string;
    user_id: string;
    users?: {
        email: string;
    } | null;
}

/**
 * Vista de Dashboard Principal
 * Muestra métricas globales y el listado histórico de archivos PDF cargados.
 */
export const Dashboard: React.FC = () => {
    const api = useAxios();
    const { user } = useAuth();

    // Estados de datos
    const [orders, setOrders] = useState<OrderRecord[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Cargar órdenes asociadas al rol del usuario
    const fetchOrders = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/orders');
            if (response.data.success) {
                setOrders(response.data.data);
            }
        } catch (err: any) {
            console.error('Error cargando órdenes:', err);
            setError('No se pudo recuperar el listado de archivos cargados.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Formatear fechas a legible en Español
    const formatDate = (isoString: string): string => {
        const date = new Date(isoString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div>
            {/* Header del Dashboard */}
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Dashboard</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {user?.roleType === 'admin' 
                            ? 'Monitoreo global de cargas de archivos y auditoría del sistema' 
                            : 'Historial de tus archivos PDF procesados en n8n'}
                    </p>
                </div>

                <button className="btn btn-secondary" onClick={fetchOrders} disabled={isLoading}>
                    Actualizar
                </button>
            </div>

            {/* MÓDULO 1: TARJETAS DE ESTADÍSTICAS (Métricas) */}
            <div className="dashboard-grid">
                {/* Métrica 1: Total Cargas */}
                <div className="glass-panel stat-card">
                    <div className="stat-info">
                        <h3>Total Cargas</h3>
                        <p>{isLoading ? '...' : orders.length}</p>
                    </div>
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(0, 122, 255, 0.1)', color: 'var(--accent-primary)' }}>
                        <UploadCloud size={24} />
                    </div>
                </div>

                {/* Métrica 2: Usuario Activo */}
                <div className="glass-panel stat-card">
                    <div className="stat-info">
                        <h3>Perfil Conectado</h3>
                        <p style={{ fontSize: '1.1rem', marginTop: '6px', fontWeight: 600, maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.email}
                        </p>
                    </div>
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(20, 184, 166, 0.1)', color: 'var(--accent-teal)' }}>
                        <User size={24} />
                    </div>
                </div>

                {/* Métrica 3: Nivel de Acceso */}
                <div className="glass-panel stat-card">
                    <div className="stat-info">
                        <h3>Rol Asignado</h3>
                        <p style={{ fontSize: '1.25rem', marginTop: '6px', fontWeight: 600 }}>
                            {user?.roleType === 'admin' ? 'Administrador' : 'Usuario Común'}
                        </p>
                    </div>
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent-purple)' }}>
                        <HardDrive size={24} />
                    </div>
                </div>
            </div>

            {/* MÓDULO 2: HISTORIAL DE ÓRDENES (Tabla Premium) */}
            <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
                    Historial de Archivos
                </h3>

                {error && (
                    <div className="alert-banner alert-error" style={{ marginBottom: '20px' }}>
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                        <div style={{
                            border: '3px solid rgba(255,255,255,0.05)',
                            borderTop: '3px solid var(--accent-primary)',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 12px'
                        }}></div>
                        <p>Recuperando historial...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '60px 20px', 
                        color: 'var(--text-secondary)',
                        border: '1px dashed rgba(255,255,255,0.08)',
                        borderRadius: '8px'
                    }}>
                        <UploadCloud size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                        <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>No se registran archivos cargados</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Dirígete a la opción de "Cargar Archivo PDF" para subir tu primer documento.
                        </p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>Nombre del Archivo</th>
                                    <th>Identificador de Orden (UUID)</th>
                                    <th>Fecha de Carga</th>
                                    {user?.roleType === 'admin' && <th>Usuario Propietario</th>}
                                    <th style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.order_id}>
                                        <td style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <FileText size={16} style={{ color: '#ef4444' }} />
                                            <span style={{ 
                                                maxWidth: '240px', 
                                                overflow: 'hidden', 
                                                textOverflow: 'ellipsis', 
                                                whiteSpace: 'nowrap' 
                                            }} title={order.filename}>
                                                {order.filename}
                                            </span>
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {order.order_id}
                                        </td>
                                        <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                                                {formatDate(order.created_at)}
                                            </div>
                                        </td>
                                        {user?.roleType === 'admin' && (
                                            <td style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                                {order.users?.email || 'Sistema / Eliminado'}
                                            </td>
                                        )}
                                        <td style={{ textAlign: 'right' }}>
                                            {order.pdf_url ? (
                                                <a 
                                                    href={order.pdf_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="btn btn-secondary"
                                                    style={{ 
                                                        padding: '6px 10px', 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: '6px',
                                                        color: 'var(--accent-teal)',
                                                        borderColor: 'rgba(20, 184, 166, 0.15)',
                                                        fontSize: '0.8rem',
                                                        textDecoration: 'none'
                                                    }}
                                                    title="Descargar o Ver PDF original"
                                                >
                                                    <Download size={14} />
                                                    <span>Descargar</span>
                                                </a>
                                            ) : (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No disponible</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
export default Dashboard;
