import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    User, 
    UploadCloud, 
    LayoutDashboard, 
    LogOut, 
    ChevronLeft, 
    ChevronRight, 
    Settings, 
    FileText,
    Users
} from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

/**
 * Componente Layout Principal.
 * Incluye el Sidebar colapsable a la izquierda y el Header superior.
 * Controla que las opciones de carga y dashboard estén bloqueadas para usuarios no logueados.
 */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

    // Determinar la ruta activa para aplicar los estilos correspondientes
    const currentPath = location.pathname;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Estructurar los enlaces de navegación
    const navItems = [
        {
            path: '/profile',
            label: 'Usuario (Perfil)',
            icon: <User size={20} />,
            requiresAuth: true
        },
        {
            path: '/upload',
            label: 'Cargar Archivo PDF',
            icon: <UploadCloud size={20} />,
            requiresAuth: true,
            hideForAdmin: true
        },
        {
            path: '/dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard size={20} />,
            requiresAuth: true,
            hideForAdmin: true
        },
        {
            path: '/admin',
            label: 'Administrador',
            icon: <Settings size={20} />,
            requiresAuth: true,
            requiresAdmin: true
        }
    ];

    return (
        <div className="app-container">
            {/* Sidebar Lateral */}
            <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    {!isCollapsed ? (
                        <div className="logo-container">
                            <div className="logo-icon">TS</div>
                            <span className="gradient-text">TechnoScreen</span>
                        </div>
                    ) : (
                        <div className="logo-icon" style={{ margin: '0 auto' }}>TS</div>
                    )}
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        // Validar si requiere ser administrador y el usuario no lo es
                        if (item.requiresAdmin && user?.roleType !== 'admin') {
                            return null;
                        }

                        // Ocultar opciones de usuario estándar para administradores
                        if (item.hideForAdmin && user?.roleType === 'admin') {
                            return null;
                        }

                        // Las opciones de Cargar y Dashboard se deshabilitan si el usuario no está logueado
                        const isDisabled = item.requiresAuth && !isAuthenticated;
                        const isActive = currentPath === item.path;

                        return (
                            <button
                                key={item.path}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => navigate(item.path)}
                                disabled={isDisabled}
                                title={isCollapsed ? item.label : undefined}
                            >
                                {item.icon}
                                {!isCollapsed && <span>{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <button 
                        className="modal-close" 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        style={{ margin: isCollapsed ? '0 auto' : '0' }}
                        title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>
            </aside>

            {/* Contenedor Principal */}
            <div className="main-wrapper">
                {/* Header Superior */}
                <header className="main-header">
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }} className="gradient-text">
                            PDF Management Hub
                        </h1>
                    </div>

                    <div className="header-user-info">
                        {isAuthenticated && user ? (
                            <>
                                <div style={{ textAlign: 'right', display: 'block' }}>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.email}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        Rol: {user.roleType === 'admin' ? 'Administrador' : 'Usuario Estándar'}
                                    </p>
                                </div>
                                <div className="avatar" title={user.email}>
                                    {user.email.substring(0, 2).toUpperCase()}
                                </div>
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={handleLogout}
                                    style={{ padding: '8px 12px' }}
                                    title="Cerrar sesión"
                                >
                                    <LogOut size={16} />
                                    <span style={{ fontSize: '0.85rem' }}>Salir</span>
                                </button>
                            </>
                        ) : (
                            <button 
                                className="btn btn-primary" 
                                onClick={() => navigate('/login')}
                                style={{ padding: '8px 16px' }}
                            >
                                Conectar
                            </button>
                        )}
                    </div>
                </header>

                {/* Cuerpo del Contenido */}
                <main className="content-body">
                    {children}
                </main>
            </div>
        </div>
    );
};
export default Layout;
