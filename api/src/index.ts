import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Importar rutas del sistema
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import templateRoutes from './routes/template.routes';
import orderRoutes from './routes/order.routes';
import roleRoutes from './routes/role.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar CORS para permitir peticiones desde cualquier origen (para desarrollo del frontend React)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para procesar cuerpos en formato JSON
app.use(express.json());

// Middleware para procesar cuerpos urlencoded
app.use(express.urlencoded({ extended: true }));

// Endpoint de verificación de estado del servidor (Health Check)
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'El servidor de Techno Screen está operativo.'
    });
});

// Registrar rutas de la aplicación
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/roles', roleRoutes);

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `La ruta solicitada [${req.method}] ${req.originalUrl} no existe en este servidor.`
    });
});

// Iniciar el servidor Express
app.listen(PORT, () => {
    console.log('==================================================');
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📂 Entorno activo: ${process.env.NODE_ENV || 'development'}`);
    console.log('==================================================');
});
