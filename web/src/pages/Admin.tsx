import React, { useState, useEffect } from 'react';
import { useAxios } from '../hooks/useAxios';
import { 
    Users, 
    ClipboardList, 
    Plus, 
    Edit, 
    Trash2, 
    Check, 
    X,
    Lock,
    Eye,
    EyeOff,
    Shield,
    FileText,
    History,
    Download
} from 'lucide-react';

interface UserRecord {
    user_id: string;
    email: string;
    role_id: string;
    template_id: string | null;
    is_active: boolean;
    created_at: string;
    roles?: { name: string; role_type: 'admin' | 'user' };
    templates?: { name: string } | null;
}

interface TemplateRecord {
    template_id: string;
    name: string;
    description: string;
    is_active: boolean;
}

interface RoleRecord {
    role_id: string;
    name: string;
    description: string;
    role_type: 'admin' | 'user';
    is_active: boolean;
    created_at: string;
}

interface OrderRecord {
    order_id: string;
    filename: string;
    pdf_url?: string;
    created_at: string;
    user_id: string | null;
    users?: { email: string } | null;
}

// Roles estáticos de fallback
const DEFAULT_ROLES = [
    { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Administrador', type: 'admin' },
    { id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', name: 'Usuario Estándar', type: 'user' }
];

/**
 * Panel de Administración Maestro (4 Tablas)
 * Ofrece control premium de Usuarios, Roles, Plantillas e Historial de Cargas.
 */
export const Admin: React.FC = () => {
    const api = useAxios();

    // Estado de Solapa Activa ('users' | 'roles' | 'templates' | 'orders')
    const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'templates' | 'orders'>('users');

    // Estados de Datos
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [templates, setTemplates] = useState<TemplateRecord[]>([]);
    const [rolesList, setRolesList] = useState<RoleRecord[]>([]);
    const [orders, setOrders] = useState<OrderRecord[]>([]);
    
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Estados para Modales CRUD de Usuarios
    const [showUserModal, setShowUserModal] = useState<boolean>(false);
    const [showUserPassword, setShowUserPassword] = useState<boolean>(false);
    const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
    const [userForm, setUserForm] = useState({
        email: '',
        password: '',
        roleId: DEFAULT_ROLES[1].id,
        templateId: '',
        isActive: true
    });

    // Estados para Modales CRUD de Plantillas
    const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
    const [editingTemplate, setEditingTemplate] = useState<TemplateRecord | null>(null);
    const [templateForm, setTemplateForm] = useState({
        name: '',
        description: '',
        isActive: true
    });

    // Estados para Modales CRUD de Roles
    const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
    const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
    const [roleForm, setRoleForm] = useState({
        name: '',
        description: '',
        roleType: 'user' as 'admin' | 'user',
        isActive: true
    });

    // Cargar datos según la pestaña activa
    const loadData = async () => {
        setIsLoading(true);
        setFeedback(null);
        try {
            if (activeTab === 'users') {
                const [resUsers, resTemplates, resRoles] = await Promise.all([
                    api.get('/users'),
                    api.get('/templates'),
                    api.get('/roles')
                ]);
                if (resUsers.data.success) setUsers(resUsers.data.data);
                if (resTemplates.data.success) setTemplates(resTemplates.data.data);
                if (resRoles.data.success) setRolesList(resRoles.data.data);
            } else if (activeTab === 'templates') {
                const resTemplates = await api.get('/templates');
                if (resTemplates.data.success) setTemplates(resTemplates.data.data);
            } else if (activeTab === 'roles') {
                const resRoles = await api.get('/roles');
                if (resRoles.data.success) setRolesList(resRoles.data.data);
            } else if (activeTab === 'orders') {
                const resOrders = await api.get('/orders');
                if (resOrders.data.success) setOrders(resOrders.data.data);
            }
        } catch (err: any) {
            console.error('Error al cargar datos de admin:', err);
            setFeedback({
                type: 'error',
                message: 'Error al recuperar registros de la base de datos.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeTab]);

    // ==========================================================================
    // OPERACIONES CRUD: USUARIOS
    // ==========================================================================
    
    const handleOpenUserCreate = () => {
        setEditingUser(null);
        setShowUserPassword(false);
        
        // Buscar el primer rol activo para asignar por defecto
        const activeRoles = rolesList.filter(r => r.is_active);
        const defaultRoleId = activeRoles.length > 0 ? activeRoles[0].role_id : DEFAULT_ROLES[1].id;

        setUserForm({
            email: '',
            password: '',
            roleId: defaultRoleId,
            templateId: templates.length > 0 ? templates[0].template_id : '',
            isActive: true
        });
        setShowUserModal(true);
    };

    const handleOpenUserEdit = (user: UserRecord) => {
        setEditingUser(user);
        setShowUserPassword(false);
        setUserForm({
            email: user.email,
            password: '', 
            roleId: user.role_id,
            templateId: user.template_id || '',
            isActive: user.is_active
        });
        setShowUserModal(true);
    };

    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);

        try {
            if (editingUser) {
                const response = await api.put(`/users/${editingUser.user_id}`, {
                    email: userForm.email,
                    roleId: userForm.roleId,
                    templateId: userForm.templateId || null,
                    isActive: userForm.isActive,
                    password: userForm.password || undefined
                });

                if (response.data.success) {
                    setFeedback({ type: 'success', message: 'Usuario actualizado exitosamente.' });
                    setShowUserModal(false);
                    loadData();
                }
            } else {
                const response = await api.post('/users', {
                    email: userForm.email,
                    password: userForm.password,
                    roleId: userForm.roleId,
                    templateId: userForm.templateId || null,
                    isActive: userForm.isActive
                });

                if (response.data.success) {
                    setFeedback({ type: 'success', message: 'Usuario creado exitosamente.' });
                    setShowUserModal(false);
                    loadData();
                }
            }
        } catch (err: any) {
            console.error('Error al guardar usuario:', err);
            setFeedback({
                type: 'error',
                message: err.response?.data?.message || 'Error al intentar guardar el usuario.'
            });
        }
    };

    const handleUserDelete = async (userId: string) => {
        if (!window.confirm('¿Está completamente seguro de que desea eliminar este usuario de forma permanente? Se borrarán sus datos asociados.')) return;

        try {
            const response = await api.delete(`/users/${userId}`);
            if (response.data.success) {
                setFeedback({ type: 'success', message: 'Usuario eliminado exitosamente.' });
                loadData();
            }
        } catch (err: any) {
            console.error('Error al eliminar usuario:', err);
            setFeedback({
                type: 'error',
                message: err.response?.data?.message || 'Error al intentar eliminar al usuario.'
            });
        }
    };

    // ==========================================================================
    // OPERACIONES CRUD: PLANTILLAS (TEMPLATES)
    // ==========================================================================

    const handleOpenTemplateCreate = () => {
        setEditingTemplate(null);
        setTemplateForm({
            name: '',
            description: '',
            isActive: true
        });
        setShowTemplateModal(true);
    };

    const handleOpenTemplateEdit = (tpl: TemplateRecord) => {
        setEditingTemplate(tpl);
        setTemplateForm({
            name: tpl.name,
            description: tpl.description,
            isActive: tpl.is_active
        });
        setShowTemplateModal(true);
    };

    const handleTemplateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);

        try {
            if (editingTemplate) {
                const response = await api.put(`/templates/${editingTemplate.template_id}`, {
                    name: templateForm.name,
                    description: templateForm.description,
                    isActive: templateForm.isActive
                });

                if (response.data.success) {
                    setFeedback({ type: 'success', message: 'Plantilla técnica actualizada con éxito.' });
                    setShowTemplateModal(false);
                    loadData();
                }
            } else {
                const response = await api.post('/templates', {
                    name: templateForm.name,
                    description: templateForm.description,
                    isActive: templateForm.isActive
                });

                if (response.data.success) {
                    setFeedback({ type: 'success', message: 'Nueva plantilla técnica creada con éxito.' });
                    setShowTemplateModal(false);
                    loadData();
                }
            }
        } catch (err: any) {
            console.error('Error al guardar plantilla:', err);
            setFeedback({
                type: 'error',
                message: err.response?.data?.message || 'Error al intentar guardar la plantilla.'
            });
        }
    };

    const handleTemplateDelete = async (templateId: string) => {
        if (!window.confirm('¿Desea eliminar de forma permanente esta plantilla técnica? Esta acción no se puede deshacer.')) return;

        try {
            const response = await api.delete(`/templates/${templateId}`);
            if (response.data.success) {
                setFeedback({ type: 'success', message: 'Plantilla eliminada de forma permanente.' });
                loadData();
            }
        } catch (err: any) {
            console.error('Error al eliminar plantilla:', err);
            setFeedback({
                type: 'error',
                message: err.response?.data?.message || 'Error al intentar eliminar la plantilla.'
            });
        }
    };

    // ==========================================================================
    // OPERACIONES CRUD: ROLES (CON AÑADIR, MODIFICAR Y ACTIVAR/DESACTIVAR)
    // ==========================================================================

    const handleOpenRoleCreate = () => {
        setEditingRole(null);
        setRoleForm({
            name: '',
            description: '',
            roleType: 'user',
            isActive: true
        });
        setShowRoleModal(true);
    };

    const handleOpenRoleEdit = (role: RoleRecord) => {
        setEditingRole(role);
        setRoleForm({
            name: role.name,
            description: role.description,
            roleType: role.role_type,
            isActive: role.is_active !== undefined ? role.is_active : true
        });
        setShowRoleModal(true);
    };

    const handleRoleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);

        try {
            if (editingRole) {
                const response = await api.put(`/roles/${editingRole.role_id}`, {
                    name: roleForm.name,
                    description: roleForm.description,
                    roleType: roleForm.roleType,
                    isActive: roleForm.isActive
                });

                if (response.data.success) {
                    setFeedback({ type: 'success', message: 'Rol de sistema actualizado exitosamente.' });
                    setShowRoleModal(false);
                    loadData();
                }
            } else {
                const response = await api.post('/roles', {
                    name: roleForm.name,
                    description: roleForm.description,
                    roleType: roleForm.roleType,
                    isActive: roleForm.isActive
                });

                if (response.data.success) {
                    setFeedback({ type: 'success', message: 'Nuevo rol de sistema creado exitosamente.' });
                    setShowRoleModal(false);
                    loadData();
                }
            }
        } catch (err: any) {
            console.error('Error al guardar rol:', err);
            setFeedback({
                type: 'error',
                message: err.response?.data?.message || 'Error al intentar guardar el rol.'
            });
        }
    };

    const handleRoleDelete = async (roleId: string) => {
        // Evitar eliminar roles semilla del sistema para no romper integridad básica
        if (roleId === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' || roleId === 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22') {
            alert('No está permitido eliminar los roles estructurales del sistema (Administrador o Usuario Estándar).');
            return;
        }

        if (!window.confirm('¿Está seguro de que desea eliminar permanentemente este rol? Los usuarios asignados a él perderán sus permisos.')) return;

        try {
            const response = await api.delete(`/roles/${roleId}`);
            if (response.data.success) {
                setFeedback({ type: 'success', message: 'Rol eliminado de forma permanente de la base de datos.' });
                loadData();
            }
        } catch (err: any) {
            console.error('Error al eliminar rol:', err);
            setFeedback({
                type: 'error',
                message: err.response?.data?.message || 'Error al intentar eliminar el rol.'
            });
        }
    };

    // ==========================================================================
    // OPERACIONES: HISTORIAL DE ÓRDENES (CARGAS)
    // ==========================================================================

    const handleOrderDelete = async (orderId: string) => {
        if (!window.confirm('¿Está seguro de que desea eliminar permanentemente este registro de carga del historial? Se borrará su rastro de base de datos.')) return;

        try {
            const response = await api.delete(`/orders/${orderId}`);
            if (response.data.success) {
                setFeedback({ type: 'success', message: 'Registro de carga eliminado exitosamente.' });
                loadData();
            }
        } catch (err: any) {
            console.error('Error al eliminar orden:', err);
            setFeedback({
                type: 'error',
                message: err.response?.data?.message || 'Error al intentar borrar el registro de carga.'
            });
        }
    };

    return (
        <div>
            {/* Encabezado */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Consola de Administración</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Administra las 4 tablas maestras de datos: usuarios, roles, plantillas y órdenes del sistema
                </p>
            </div>

            {/* Banner de Feedback Global */}
            {feedback && (
                <div className={`alert-banner ${feedback.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '24px' }}>
                    <span>{feedback.type === 'success' ? '✅' : '⚠️'}</span>
                    <span>{feedback.message}</span>
                </div>
            )}

            {/* Botones de Navegación del Panel de Administración (Estilo Premium Anterior) */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                <button 
                    className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('users')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Users size={18} />
                    Gestionar Usuarios
                </button>
                <button 
                    className={`btn ${activeTab === 'roles' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('roles')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Shield size={18} />
                    Gestionar Roles
                </button>
                <button 
                    className={`btn ${activeTab === 'templates' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('templates')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <ClipboardList size={18} />
                    Gestionar Plantillas
                </button>
                <button 
                    className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('orders')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <History size={18} />
                    Historial de Cargas
                </button>
            </div>

            {/* ==========================================================================
               PANEL 1: GESTIÓN DE USUARIOS
               ========================================================================== */}
            {activeTab === 'users' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Cuentas de Acceso</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gestiona los permisos y asignaciones técnicas de los usuarios</p>
                        </div>
                        <button className="btn btn-primary" onClick={handleOpenUserCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={18} /> Crear Usuario
                        </button>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando usuarios...</div>
                    ) : (
                        <div className="glass-panel" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase' }}>Usuario</th>
                                        <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase' }}>Rol</th>
                                        <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase' }}>Plantilla</th>
                                        <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase' }}>Estado</th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay usuarios registrados en el sistema.</td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }} className="table-row-hover">
                                                <td style={{ padding: '16px 24px' }}>
                                                    <p style={{ fontWeight: 600 }}>{user.email}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {user.user_id}</p>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span className={`badge ${user.roles?.role_type === 'admin' ? 'badge-warning' : 'badge-info'}`}>
                                                        {user.roles?.name || 'Cargando...'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    {user.roles?.role_type === 'admin' ? (
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>N/A (Administrador)</span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.9rem' }}>{user.templates?.name || 'Ninguna'}</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{ 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: '6px', 
                                                        fontSize: '0.85rem', 
                                                        color: user.is_active ? 'var(--state-success)' : 'var(--state-error)',
                                                        fontWeight: 500
                                                    }}>
                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: user.is_active ? 'var(--state-success)' : 'var(--state-error)' }}></span>
                                                        {user.is_active ? 'Activo' : 'Suspendido'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button className="btn btn-secondary" onClick={() => handleOpenUserEdit(user)} style={{ padding: '8px 10px' }} title="Editar usuario">
                                                            <Edit size={16} />
                                                        </button>
                                                        <button 
                                                            className="btn btn-secondary" 
                                                            onClick={() => handleUserDelete(user.user_id)} 
                                                            style={{ padding: '8px 10px', color: 'var(--state-error)', borderColor: 'rgba(235, 87, 87, 0.15)' }} 
                                                            title="Eliminar usuario"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ==========================================================================
               PANEL 2: GESTIÓN DE ROLES
               ========================================================================== */}
            {activeTab === 'roles' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Roles de Sistema</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configuración de seguridad y definiciones de privilegios</p>
                        </div>
                        <button className="btn btn-primary" onClick={handleOpenRoleCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={18} /> Crear Rol
                        </button>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando roles...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                            {rolesList.map((role) => (
                                <div key={role.role_id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <span className={`badge ${role.role_type === 'admin' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                                                {role.name}
                                            </span>
                                            
                                            {/* Indicador de Activo / Inactivo */}
                                            <span style={{ 
                                                width: '10px', 
                                                height: '10px', 
                                                borderRadius: '50%', 
                                                backgroundColor: role.is_active ? 'var(--state-success)' : 'var(--state-error)',
                                                boxShadow: role.is_active ? '0 0 10px rgba(46, 204, 113, 0.4)' : 'none'
                                            }} title={role.is_active ? 'Habilitado' : 'Deshabilitado (Inactivo)'}></span>
                                        </div>
                                        <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                            {role.description || 'Sin descripción configurada para este rol.'}
                                        </p>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                            Tipo Acceso: {role.role_type === 'admin' ? 'Administrador' : 'Usuario Común'}<br/>
                                            ID: {role.role_id}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                                        <button 
                                            className="btn btn-secondary" 
                                            onClick={() => handleOpenRoleEdit(role)} 
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        >
                                            <Edit size={16} /> Modificar
                                        </button>
                                        {role.role_id !== 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' && role.role_id !== 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' && (
                                            <button 
                                                className="btn btn-secondary" 
                                                onClick={() => handleRoleDelete(role.role_id)} 
                                                style={{ padding: '10px 12px', color: 'var(--state-error)', borderColor: 'rgba(235, 87, 87, 0.15)' }} 
                                                title="Eliminar rol"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ==========================================================================
               PANEL 3: GESTIÓN DE PLANTILLAS
               ========================================================================== */}
            {activeTab === 'templates' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Plantillas de Visualización</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Estructuras técnicas para recortar reportes e integrar a n8n</p>
                        </div>
                        <button className="btn btn-primary" onClick={handleOpenTemplateCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={18} /> Crear Plantilla
                        </button>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando plantillas...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                            {templates.length === 0 ? (
                                <div className="glass-panel" style={{ padding: '40px', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No hay plantillas creadas. Agregue una nueva para habilitar el registro de usuarios estándar.
                                </div>
                            ) : (
                                templates.map((tpl) => (
                                    <div key={tpl.template_id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                <h4 style={{ fontSize: '1.15rem', fontWeight: 600 }}>{tpl.name}</h4>
                                                <span style={{ 
                                                    width: '10px', 
                                                    height: '10px', 
                                                    borderRadius: '50%', 
                                                    backgroundColor: tpl.is_active ? 'var(--state-success)' : 'var(--state-error)',
                                                    boxShadow: tpl.is_active ? '0 0 10px rgba(46, 204, 113, 0.4)' : 'none'
                                                }} title={tpl.is_active ? 'Activa' : 'Inactiva'}></span>
                                            </div>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                                                {tpl.description || 'Sin descripción técnica asignada.'}
                                            </p>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {tpl.template_id}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                                            <button className="btn btn-secondary" onClick={() => handleOpenTemplateEdit(tpl)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                <Edit size={16} /> Editar
                                            </button>
                                            <button 
                                                className="btn btn-secondary" 
                                                onClick={() => handleTemplateDelete(tpl.template_id)} 
                                                style={{ padding: '10px 12px', color: 'var(--state-error)', borderColor: 'rgba(235, 87, 87, 0.15)' }} 
                                                title="Eliminar plantilla"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ==========================================================================
               PANEL 4: HISTORIAL GLOBAL DE CARGAS (ÓRDENES)
               ========================================================================== */}
            {activeTab === 'orders' && (
                <div>
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Historial Global de Cargas (Órdenes)</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Auditoría completa de los archivos PDF subidos al sistema por todos los usuarios</p>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando historial de cargas...</div>
                    ) : (
                        <div className="glass-panel" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase' }}>Orden / Carga</th>
                                        <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase' }}>Cargado Por</th>
                                        <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase' }}>Nombre de Archivo PDF</th>
                                        <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase' }}>Fecha y Hora</th>
                                        <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No se han registrado cargas de archivos PDF en la plataforma.</td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => (
                                            <tr key={order.order_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }} className="table-row-hover">
                                                <td style={{ padding: '16px 24px' }}>
                                                    <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                                        {order.order_id.substring(0, 8)}...
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <p style={{ fontWeight: 500 }}>{order.users?.email || 'Usuario Desconocido'}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {order.user_id || 'N/A'}</p>
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    {order.pdf_url ? (
                                                        <a 
                                                            href={order.pdf_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            style={{ 
                                                                fontWeight: 600, 
                                                                display: 'inline-flex', 
                                                                alignItems: 'center', 
                                                                gap: '8px',
                                                                color: 'var(--accent-teal)',
                                                                textDecoration: 'none',
                                                                transition: 'opacity 0.2s'
                                                            }}
                                                            className="hover-opacity"
                                                            title="Ver PDF original cargado"
                                                        >
                                                            <FileText size={16} />
                                                            {order.filename}
                                                        </a>
                                                    ) : (
                                                        <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <FileText size={16} style={{ color: 'var(--text-muted)' }} />
                                                            {order.filename}
                                                        </p>
                                                    )}
                                                </td>
                                                <td style={{ padding: '16px' }}>
                                                    <span style={{ fontSize: '0.9rem' }}>
                                                        {new Date(order.created_at).toLocaleString('es-ES', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit'
                                                        })}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                                                        {order.pdf_url && (
                                                            <a 
                                                                href={order.pdf_url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="btn btn-secondary"
                                                                style={{ 
                                                                    padding: '8px 10px', 
                                                                    color: 'var(--accent-teal)', 
                                                                    borderColor: 'rgba(20, 184, 166, 0.15)',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    textDecoration: 'none'
                                                                }}
                                                                title="Descargar o Ver PDF original"
                                                            >
                                                                <Download size={16} />
                                                            </a>
                                                        )}
                                                        <button 
                                                            className="btn btn-secondary" 
                                                            onClick={() => handleOrderDelete(order.order_id)} 
                                                            style={{ padding: '8px 10px', color: 'var(--state-error)', borderColor: 'rgba(235, 87, 87, 0.15)' }} 
                                                            title="Eliminar registro de carga"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ==========================================================================
               MODAL: CRUD DE USUARIOS (CREAR Y EDITAR)
               ========================================================================== */}
            {showUserModal && (
                <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
                    <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
                            <button className="modal-close" onClick={() => setShowUserModal(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleUserSubmit}>
                            {/* Email */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="userEmail">Correo Electrónico</label>
                                <input
                                    id="userEmail"
                                    type="email"
                                    className="form-control"
                                    placeholder="correo@technoscreen.com"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Contraseña */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="userPassword">
                                    {editingUser ? 'Cambiar Contraseña (Dejar en blanco para conservar actual)' : 'Contraseña de Acceso'}
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="userPassword"
                                        type={showUserPassword ? 'text' : 'password'}
                                        className="form-control"
                                        value={userForm.password}
                                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                        style={{ paddingRight: '44px' }}
                                        required={!editingUser}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowUserPassword(!showUserPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '14px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--text-muted)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '4px'
                                        }}
                                        title={showUserPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                    >
                                        {showUserPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Rol */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="userRole">Rol Asignado</label>
                                <select
                                    id="userRole"
                                    className="form-control"
                                    value={userForm.roleId}
                                    onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
                                    style={{ background: 'hsl(222, 47%, 9%)' }}
                                >
                                    {rolesList
                                        .filter(role => role.is_active || role.role_id === userForm.roleId)
                                        .map((role) => (
                                            <option key={role.role_id} value={role.role_id}>
                                                {role.name} {!role.is_active && '(Inactivo)'}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>

                            {/* Plantilla Relacionada (solo relevante si es usuario común) */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="userTemplate">Plantilla Técnica</label>
                                <select
                                    id="userTemplate"
                                    className="form-control"
                                    value={userForm.templateId}
                                    onChange={(e) => setUserForm({ ...userForm, templateId: e.target.value })}
                                    style={{ background: 'hsl(222, 47%, 9%)' }}
                                >
                                    <option value="">Ninguna plantilla vinculada</option>
                                    {templates.map((t) => (
                                        <option key={t.template_id} value={t.template_id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Activo / Inactivo */}
                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={userForm.isActive}
                                        onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span className="form-label" style={{ marginBottom: 0 }}>Usuario con Acceso Activo</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==========================================================================
               MODAL: CRUD DE ROLES (CREAR Y EDITAR DETALLES)
               ========================================================================== */}
            {showRoleModal && (
                <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
                    <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingRole ? 'Editar Rol de Sistema' : 'Crear Nuevo Rol'}</h3>
                            <button className="modal-close" onClick={() => setShowRoleModal(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleRoleSubmit}>
                            {/* Nombre del Rol */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="roleName">Nombre del Rol</label>
                                <input
                                    id="roleName"
                                    type="text"
                                    className="form-control"
                                    value={roleForm.name}
                                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Tipo de Acceso */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="roleTypeSelect">Tipo de Acceso de Sistema</label>
                                <select
                                    id="roleTypeSelect"
                                    className="form-control"
                                    value={roleForm.roleType}
                                    onChange={(e) => setRoleForm({ ...roleForm, roleType: e.target.value as 'admin' | 'user' })}
                                    style={{ background: 'hsl(222, 47%, 9%)' }}
                                >
                                    <option value="user">Usuario Estándar (Acceso Estándar)</option>
                                    <option value="admin">Administrador (Acceso Total a Consola)</option>
                                </select>
                            </div>

                            {/* Descripción del Rol */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="roleDesc">Descripción de Privilegios</label>
                                <textarea
                                    id="roleDesc"
                                    className="form-control"
                                    rows={4}
                                    value={roleForm.description}
                                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                                    placeholder="Describe los alcances y permisos de seguridad de este rol..."
                                />
                            </div>

                            {/* Estado: Activo / Inactivo */}
                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={roleForm.isActive}
                                        onChange={(e) => setRoleForm({ ...roleForm, isActive: e.target.checked })}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span className="form-label" style={{ marginBottom: 0 }}>Rol Habilitado y Activo</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==========================================================================
               MODAL: CRUD DE PLANTILLAS (CREAR Y EDITAR)
               ========================================================================== */}
            {showTemplateModal && (
                <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
                    <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingTemplate ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}</h3>
                            <button className="modal-close" onClick={() => setShowTemplateModal(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleTemplateSubmit}>
                            {/* Nombre */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="tplName">Nombre de Plantilla</label>
                                <input
                                    id="tplName"
                                    type="text"
                                    className="form-control"
                                    value={templateForm.name}
                                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Descripción */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="tplDesc">Descripción / Detalles Técnicos</label>
                                <textarea
                                    id="tplDesc"
                                    className="form-control"
                                    rows={3}
                                    value={templateForm.description}
                                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                                />
                            </div>

                            {/* Activo / Inactivo */}
                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={templateForm.isActive}
                                        onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span className="form-label" style={{ marginBottom: 0 }}>Plantilla Activa y Seleccionable</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowTemplateModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Guardar Plantilla</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Admin;
