import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../context/AuthContext';
import { FileText, Lock, Mail, Eye, EyeOff } from 'lucide-react';

/**
 * Vista de Inicio de Sesión (Login)
 */
export const Login: React.FC = () => {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    // Estados del formulario y feedback
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Redirigir si ya está autenticado
    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validación básica
        if (!email || !password) {
            setError('Por favor complete todos los campos.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                email,
                password
            });

            if (response.data.success) {
                const { token, user } = response.data.data;
                // Guardar datos en el AuthContext
                login(token, user);
                // Redirigir dinámicamente según el rol
                if (user.roleType === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(response.data.message || 'Error al iniciar sesión.');
            }
        } catch (err: any) {
            console.error('Error en Login POST:', err);
            setError(
                err.response?.data?.message || 
                'No se pudo conectar con el servidor. Asegúrese de que el backend esté ejecutándose.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-panel auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <FileText size={24} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Iniciar Sesión</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.95rem' }}>
                        Acceso a la plataforma de gestión PDF
                    </p>
                </div>

                {/* Banner de error */}
                {error && (
                    <div className="alert-banner alert-error">
                        <span>⚠️</span>
                        <span>{error}</span>
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
                                placeholder="ejemplo@technoscreen.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ paddingLeft: '44px' }}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    {/* Campo: Contraseña */}
                    <div className="form-group" style={{ marginBottom: '28px' }}>
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
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingLeft: '44px', paddingRight: '44px' }}
                                disabled={isLoading}
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
                                disabled={isLoading}
                                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Botón de envío */}
                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '14px' }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>¿No tienes una cuenta? </span>
                    <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                        Regístrate aquí
                    </Link>
                </div>
            </div>
        </div>
    );
};
export default Login;
