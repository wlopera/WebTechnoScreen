import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAxios } from '../hooks/useAxios';
import { User, Shield, KeyRound, Eye, EyeOff } from 'lucide-react';

/**
 * Vista de Perfil de Usuario
 * Permite visualizar metadatos del usuario logueado y actualizar su contraseña de sesión de forma segura.
 */
export const Profile: React.FC = () => {
    const { user } = useAuth();
    const api = useAxios();

    // Estado para mostrar el nombre legible de la plantilla en vez del UUID
    const [templateName, setTemplateName] = useState<string>('Cargando plantilla...');

    // Estados para la actualización de contraseña
    const [currentPassword, setCurrentPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');

    // Estados para controlar la visibilidad de los tres campos de contraseña
    const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
    const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

    // Estados de feedback de la acción
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Cargar plantilla asociada al montar o cuando cambie el usuario
    useEffect(() => {
        const fetchTemplateInfo = async () => {
            if (!user || !user.templateId) {
                setTemplateName('Ninguna plantilla vinculada');
                return;
            }
            try {
                const response = await api.get('/templates');
                if (response.data.success) {
                    const matched = response.data.data.find(
                        (t: any) => t.template_id === user.templateId
                    );
                    if (matched) {
                        setTemplateName(matched.name);
                    } else {
                        // Fallback con caracteres reducidos si no se encuentra en las activas
                        setTemplateName(`Plantilla Asignada (ID: ${user.templateId.substring(0, 8)}...)`);
                    }
                }
            } catch (err) {
                console.error('Error cargando información de la plantilla:', err);
                setTemplateName(`Plantilla Asignada (ID: ${user.templateId.substring(0, 8)}...)`);
            }
        };

        fetchTemplateInfo();
    }, [user, api]);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validación básica
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Todos los campos de contraseña son requeridos.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('La nueva contraseña y su confirmación no coinciden.');
            return;
        }

        if (newPassword.length < 6) {
            setError('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.post('/auth/change-password', {
                currentPassword,
                newPassword
            });

            if (response.data.success) {
                setSuccess('¡Contraseña actualizada correctamente!');
                // Limpiar campos del formulario
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                // Ocultar textos de contraseña por seguridad
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
            }
        } catch (err: any) {
            console.error('Error al actualizar contraseña:', err);
            setError(
                err.response?.data?.message || 
                'Error al actualizar la contraseña. Asegúrese de que su contraseña actual es correcta.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>Mi Cuenta</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Gestiona tu información de perfil y credenciales de acceso
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                {/* Sección 1: Información de Perfil (Solo Lectura) */}
                <section className="glass-panel" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <User size={22} style={{ color: 'var(--accent-primary)' }} />
                        Información Personal
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                        {/* Detalle Correo */}
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Correo Electrónico
                            </p>
                            <p style={{ fontSize: '1.05rem', fontWeight: 500, marginTop: '4px' }}>{user.email}</p>
                        </div>

                        {/* Detalle Rol */}
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Rol de Sistema
                            </p>
                            <p style={{ fontSize: '1.05rem', fontWeight: 500, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Shield size={16} style={{ color: user.roleType === 'admin' ? 'var(--state-warning)' : 'var(--accent-teal)' }} />
                                {user.roleName}
                            </p>
                        </div>

                        {/* Detalle Plantilla con Nombre legible */}
                        {user.roleType !== 'admin' && (
                            <div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Plantilla Asignada
                                </p>
                                <p style={{ fontSize: '1.05rem', fontWeight: 500, color: 'var(--accent-primary)', marginTop: '4px' }}>
                                    {templateName}
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Sección 2: Actualización de Contraseña */}
                <section className="glass-panel" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <KeyRound size={22} style={{ color: 'var(--accent-teal)' }} />
                        Cambiar Contraseña
                    </h3>

                    {/* Feedback al usuario */}
                    {error && (
                        <div className="alert-banner alert-error" style={{ marginBottom: '24px' }}>
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="alert-banner alert-success" style={{ marginBottom: '24px' }}>
                            <span>✅</span>
                            <span>{success}</span>
                        </div>
                    )}

                    <form onSubmit={handlePasswordChange}>
                        {/* Contraseña Actual */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="currPassword">Contraseña Actual</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="currPassword"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    className="form-control"
                                    placeholder="Ingrese su contraseña actual"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    style={{ paddingRight: '44px' }}
                                    disabled={isLoading}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
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
                                    disabled={isLoading}
                                    title={showCurrentPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                >
                                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Nueva Contraseña */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="newPass">Nueva Contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="newPass"
                                        type={showNewPassword ? 'text' : 'password'}
                                        className="form-control"
                                        placeholder="Mínimo 6 caracteres"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        style={{ paddingRight: '44px' }}
                                        disabled={isLoading}
                                        minLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
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
                                        disabled={isLoading}
                                        title={showNewPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="confirmNewPass">Confirmar Nueva Contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="confirmNewPass"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className="form-control"
                                        placeholder="Repita su nueva contraseña"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        style={{ paddingRight: '44px' }}
                                        disabled={isLoading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                                        disabled={isLoading}
                                        title={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Botón de guardar cambios */}
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ marginTop: '12px', minWidth: '180px' }}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
};
export default Profile;
