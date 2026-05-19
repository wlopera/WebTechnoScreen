import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno del archivo .env
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: SUPABASE_URL o SUPABASE_KEY no están definidas en las variables de entorno.');
    process.exit(1);
}

// Inicializar el cliente de Supabase
// Usamos el cliente estándar de Supabase para comunicarnos con la base de datos de PostgreSQL
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false // Desactivamos la persistencia de sesión automática en el servidor
    }
});
