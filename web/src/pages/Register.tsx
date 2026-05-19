import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../context/AuthContext';
import { FileText, Lock, Mail, ClipboardList, Eye, EyeOff } from 'lucide-react';

interface TemplateOption {
    template_id: string;
    name: string;
    description: string;
}

/**
 * Vista de Registro de Usuarios Estándar
 */
export const Register: React.FC = () => {
    const navigate = useNavigate();

    // Estados de entrada
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [templateId, setTemplateId] = useState<string>('');

    // Estados para controlar la visibilidad de las contraseñas
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

    // Estados de soporte
    const [templates, setTemplates] = useState<TemplateOption[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Cargar plantillas activas al montar el componente
    useEffect(() => {
        const fetchActiveTemplates = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/templates`);
                if (response.data.success) {
                    setTemplates(response.data.data);
                    // Seleccionar la primera plantilla activa por defecto si existe
                    if (response.data.data.length > 0) {
                        setTemplateId(response.data.data[0].template_id);
                    }
                }
            } catch (err: any) {
                console.error('Error cargando plantillas para el registro:', err);
                setError('No se pudo cargar el listado de plantillas activas obligatorias.');
            }
        };

        fetchActiveTemplates();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validación de coincidencia de contraseña
        if (password !== confirmPassword) {
            setError('Las contraseñas ingresadas no coinciden.');
            return;
        }

        // Validación de plantilla obligatoria
        if (!templateId) {
            setError('Debe seleccionar una plantilla activa obligatoriamente.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register`, {
                email,
                password,
                templateId
            });

            if (response.data.success) {
                setSuccess('¡Registro completado con éxito! Redirigiendo al inicio de sesión...');
                // Redirigir al login tras 2.5 segundos
                setTimeout(() => {
                    navigate('/login');
                }, 2500);
            } else {
                setError(response.data.message || 'Error al completar el registro.');
            }
        } catch (err: any) {
            console.error('Error en Register POST:', err);
            setError(
                err.response?.data?.message || 
                'Error interno en el servidor al registrar la cuenta.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-panel auth-card" style={{ maxWidth: '480px' }}>
                <div className="auth-header">
                    <div className="auth-logo">
                        <FileText size={24} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Crear Cuenta</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.95rem' }}>
                        Regístrate para comenzar a gestionar tus archivos PDF
                    </p>
                </div>

                {/* Banner de error */}
                {error && (
                    <div className="alert-banner alert-error">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Banner de éxito */}
                {success && (
                    <div className="alert-banner alert-success">
                        <span>✅</span>
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Campo: Correo electrónico */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Correo Electrónico</label>
                        <div style={{ position: 'relative' }}>
                            <Mail 
                                size={18} 
                                style={{ 
                                    position: 'absolute', 
                                    left: '14px', 
                                    top: '50%', 
                                    transform: 'translateY(-50%)', 
                                    color: 'var(--text-muted)' 
                                }} 
                            />
                            <input
                                id="email"
                                type="email"
                                className="form-control"
                                placeholder="tuemail@technoscreen.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ paddingLeft: '44px' }}
                                disabled={isLoading || !!success}
                                required
                            />
                        </div>
                    </div>

                    {/* Campo: Plantilla activa obligatoria */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="template">Plantilla Asignada</label>
                        <div style={{ position: 'relative' }}>
                            <ClipboardList 
                                size={18} 
                                style={{ 
                                    position: 'absolute', 
                                    left: '14px', 
                                    top: '50%', 
                                    transform: 'translateY(-50%)', 
                                    color: 'var(--text-muted)',
                                    pointerEvents: 'none'
                                }} 
                            />
                            <select
                                id="template"
                                className="form-control"
                                value={templateId}
                                onChange={(e) => setTemplateId(e.target.value)}
                                style={{ paddingLeft: '44px', appearance: 'none', background: 'hsl(222, 47%, 9%)' }}
                                disabled={isLoading || !!success}
                                required
                            >
                                {templates.length === 0 ? (
                                    <option value="">Cargando plantillas...</option>
                                ) : (
                                    templates.map((tpl) => (
                                        <option key={tpl.template_id} value={tpl.template_id}>
                                            {tpl.name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Campo: Contraseña */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <Lock 
                                size={18} 
                                style={{ 
                                    position: 'absolute', 
                                    left: '14px', 
                                    top: '50%', 
                                    transform: 'translateY(-50%)', 
                                    color: 'var(--text-muted)' 
                                }} 
                            />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className="form-control"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingLeft: '44px', paddingRight: '44px' }}
                                disabled={isLoading || !!success}
                                minLength={6}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
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
                                disabled={isLoading || !!success}
                                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Campo: Confirmar Contraseña */}
                    <div className="form-group" style={{ marginBottom: '28px' }}>
                        <label className="form-label" htmlFor="confirmPassword">Confirmar Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <Lock 
                                size={18} 
                                style={{ 
                                    position: 'absolute', 
                                    left: '14px', 
                                    top: '50%', 
                                    transform: 'translateY(-50%)', 
                                    color: 'var(--text-muted)' 
                                }} 
                            />
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                className="form-control"
                                placeholder="Repita su contraseña"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{ paddingLeft: '44px', paddingRight: '44px' }}
                                disabled={isLoading || !!success}
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
                                disabled={isLoading || !!success}
                                title={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Botón de envío */}
                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '14px' }}
                        disabled={isLoading || !!success || templates.length === 0}
                    >
                        {isLoading ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>

                <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>¿Ya tienes una cuenta? </span>
                    <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                        Inicia Sesión
                    </Link>
                </div>
            </div>
        </div>
    );
};
export default Register;
