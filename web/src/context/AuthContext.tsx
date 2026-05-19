import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// URL base de la API backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Interfaz para la información del usuario decodificada del token
export interface UserPayload {
    userId: string;
    email: string;
    roleType: 'admin' | 'user';
    roleName: string;
    templateId: string | null;
}

// Interfaz que expone el contexto de autenticación
interface AuthContextType {
    user: UserPayload | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, userData: UserPayload) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Función auxiliar para decodificar un token JWT de forma básica sin dependencias externas
const decodeJWT = (token: string): UserPayload | null => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            window
                .atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload) as UserPayload;
    } catch (e) {
        console.error('Error decodificando token JWT:', e);
        return null;
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserPayload | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        // Al montar el componente, comprobar si hay una sesión activa guardada en localStorage
        const storedToken = localStorage.getItem('technoscreen_token');
        if (storedToken) {
            const decoded = decodeJWT(storedToken);
            if (decoded) {
                // Comprobar la validez del token (ej. expiración)
                const exp = (decoded as any).exp;
                const currentTime = Date.now() / 1000;
                
                if (exp && exp < currentTime) {
                    // Token expirado
                    console.log('El token de sesión ha expirado.');
                    localStorage.removeItem('technoscreen_token');
                } else {
                    // Token válido, reanudar sesión
                    setToken(storedToken);
                    setUser(decoded);
                }
            } else {
                localStorage.removeItem('technoscreen_token');
            }
        }
        setIsLoading(false);
    }, []);

    // Función para iniciar sesión
    const login = (newToken: string, userData: UserPayload) => {
        localStorage.setItem('technoscreen_token', newToken);
        setToken(newToken);
        setUser(userData);
    };

    // Función para cerrar sesión
    const logout = () => {
        localStorage.removeItem('technoscreen_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!token,
            isLoading,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizado para consumir el contexto de autenticación de forma sencilla
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
    }
    return context;
};
