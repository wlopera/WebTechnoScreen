import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
    requireUser?: boolean;
}

/**
 * Componente que envuelve las páginas protegidas.
 * Si el usuario no ha iniciado sesión, es redirigido automáticamente a /login.
 * Si la ruta requiere rol de Administrador y el usuario no lo tiene, es redirigido a /dashboard.
 * Si la ruta es exclusiva para usuarios comunes (Dashboard, Carga) y el usuario es Administrador, es redirigido a /admin.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false, requireUser = false }) => {
    const { isAuthenticated, user, isLoading } = useAuth();

    // Mientras la aplicación está verificando el estado de sesión (cargando token del localStorage)
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                height: '100vh',
                width: '100vw',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'hsl(222, 47%, 6%)',
                color: 'hsl(210, 40%, 98%)',
                fontSize: '1.2rem',
                fontFamily: 'sans-serif'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        border: '4px solid rgba(255,255,255,0.1)',
                        borderTop: '4px solid #007aff',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    <p>Cargando aplicación...</p>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    // Redirigir al inicio de sesión si no está autenticado
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Redirigir al Dashboard si se requiere ser administrador y el usuario es estándar
    if (requireAdmin && user?.roleType !== 'admin') {
        console.warn('Acceso denegado. Se requiere rol de administrador.');
        return <Navigate to="/dashboard" replace />;
    }

    // Redirigir a Administración si se requiere ser usuario común y el usuario es administrador
    if (requireUser && user?.roleType === 'admin') {
        console.warn('Acceso restringido. Los administradores no disponen de Dashboard ni Cargas de PDF.');
        return <Navigate to="/admin" replace />;
    }

    // Si pasa todas las validaciones, renderizar el componente hijo protegido
    return <>{children}</>;
};
export default ProtectedRoute;
