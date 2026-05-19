import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// Importación de las Vistas / Páginas del Sistema
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Profile } from './pages/Profile';
import { Admin } from './pages/Admin';

/**
 * Componente Principal de la Aplicación (App).
 * Envuelve el enrutador con el AuthProvider global para persistencia y distribución de sesión JWT.
 */
export const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Rutas Públicas de Acceso (Login y Registro) */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Rutas Protegidas de Sesión (Envueltas en ProtectedRoute y Layout General) */}
                    <Route 
                        path="/dashboard" 
                        element={
                            <ProtectedRoute requireUser={true}>
                                <Layout>
                                    <Dashboard />
                                </Layout>
                            </ProtectedRoute>
                        } 
                    />
                    
                    <Route 
                        path="/upload" 
                        element={
                            <ProtectedRoute requireUser={true}>
                                <Layout>
                                    <Upload />
                                </Layout>
                            </ProtectedRoute>
                        } 
                    />

                    <Route 
                        path="/profile" 
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <Profile />
                                </Layout>
                            </ProtectedRoute>
                        } 
                    />

                    {/* Ruta de Administración (Protección de Sesión + Privilegio de Administrador) */}
                    <Route 
                        path="/admin" 
                        element={
                            <ProtectedRoute requireAdmin={true}>
                                <Layout>
                                    <Admin />
                                </Layout>
                            </ProtectedRoute>
                        } 
                    />

                    {/* Redirecciones automáticas ante rutas desconocidas */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};
export default App;
