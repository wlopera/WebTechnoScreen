-- Script SQL para Supabase (PostgreSQL)
-- Ejecuta este script en el Editor SQL de tu proyecto de Supabase.

-- Habilitar extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Roles
-- Determina si un usuario es administrador ('admin') o usuario normal ('user')
CREATE TABLE IF NOT EXISTS roles (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    role_type TEXT CHECK (role_type IN ('admin', 'user')) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Plantillas (Templates)
-- Almacena las plantillas disponibles para los usuarios
CREATE TABLE IF NOT EXISTS templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Usuarios
-- Almacena los credenciales hasheados y relaciones a roles y plantillas
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    template_id UUID REFERENCES templates(template_id) ON DELETE SET NULL,
    role_id UUID REFERENCES roles(role_id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Órdenes
-- Almacena el historial de PDFs cargados por cada usuario
CREATE TABLE IF NOT EXISTS orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -----------------------------------------------------------------
-- INSERCIÓN DE DATOS SEMILLA (SEEDS)
-- Usamos UUIDs fijos predecibles para simplificar las pruebas y configuraciones iniciales
-- -----------------------------------------------------------------

-- Insertar roles predeterminados (Administrador y Usuario Estándar)
INSERT INTO roles (role_id, name, description, role_type, is_active) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Administrator', 'Acceso total de administración y CRUD', 'admin', true),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Standard User', 'Acceso para carga de PDFs y visualización de órdenes', 'user', true)
ON CONFLICT (role_id) DO NOTHING;

-- Insertar plantilla base activa predeterminada
INSERT INTO templates (template_id, name, description, is_active) VALUES 
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Plantilla Predeterminada', 'Plantilla base inicial del sistema', true)
ON CONFLICT (template_id) DO NOTHING;

-- Insertar usuario administrador inicial
-- Email: admin@technoscreen.com
-- Contraseña: admin123
-- Hash Bcrypt generado para 'admin123': $2b$10$tZ26u4XbXbCsk7K2EwM36O9uDqH4sWcQfEq1yWbI2x0L2.fP7912q
INSERT INTO users (user_id, email, password_hash, template_id, role_id, is_active) VALUES 
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'admin@technoscreen.com', '$2b$10$tZ26u4XbXbCsk7K2EwM36O9uDqH4sWcQfEq1yWbI2x0L2.fP7912q', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true)
ON CONFLICT (user_id) DO NOTHING;


-- Puede ser necesario. Deshabilitar RLS (opcional)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;