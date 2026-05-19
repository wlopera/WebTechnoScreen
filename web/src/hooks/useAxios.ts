import axios from 'axios';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { useMemo } from 'react';

/**
 * Hook personalizado useAxios.
 * Genera un cliente de Axios preconfigurado con la URL base de forma memoizada,
 * intercepta de forma sincrónica las peticiones salientes para adjuntar el token JWT,
 * e intercepta las respuestas para forzar el logout si el token expira (401, 403).
 */
export const useAxios = () => {
    const { token, logout } = useAuth();

    // Crear y configurar la instancia de Axios de forma memoizada
    const api = useMemo(() => {
        const instance = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Registrar interceptor de peticiones de forma sincrónica
        instance.interceptors.request.use(
            (config) => {
                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Registrar interceptor de respuestas de forma sincrónica
        instance.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response) {
                    const status = error.response.status;
                    // Si el token no es válido o ha caducado
                    if (status === 401 || status === 403) {
                        console.warn('Sesión expirada o no autorizada. Redirigiendo a salida...');
                        logout();
                    }
                }
                return Promise.reject(error);
            }
        );

        return instance;
    }, [token, logout]);

    return api;
};

