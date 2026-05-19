# Plan Maestro: Techno Screen PDF Manager

Este documento detalla todas las etapas de desarrollo para la aplicación de gestión de archivos PDF.

## 🏁 Visión General
- **Stack:** React (Frontend), NodeJS/Express (Backend), Supabase (Database).
- **Idioma:** Código y Base de Datos en **Inglés**. Interfaz y Mensajes en **Español**.

---

## 🏗️ Etapa 1: Base de Datos (Supabase)

### 1.1. Configuración Inicial
- Crear proyecto en Supabase.
- Obtener `SUPABASE_URL` y `SUPABASE_ANON_KEY`.

### 1.2. Scripts SQL (Tablas y Relaciones)
```sql
-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tablas con IDs autogenerados y no nulos
CREATE TABLE roles (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    role_type TEXT CHECK (role_type IN ('admin', 'user')) NOT NULL
);

CREATE TABLE templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    template_id UUID REFERENCES templates(template_id),
    role_id UUID REFERENCES roles(role_id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    filename TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 1.3. Datos Semilla (Seeds)
```sql
INSERT INTO roles (name, description, role_type) VALUES 
('Administrator', 'Acceso total', 'admin'),
('Standard User', 'Acceso de usuario', 'user');

INSERT INTO templates (name, description, is_active) VALUES 
('Default Template', 'Plantilla base', true);

-- Usuario admin inicial (Password: admin123)
-- Hash generado: $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
```

---

## ⚙️ Etapa 2: Backend (`/api`)

### 2.1. Arquitectura de Software
- **Routes:** Definición de endpoints (`/auth`, `/users`, `/uploads`).
- **Controllers:** Orquestación de peticiones y respuestas.
- **Services:** Lógica de negocio y llamadas a Supabase/n8n.
- **Middleware:** Validación de JWT y configuración de Multer.

### 2.2. Funcionalidades Clave
- **Auth Service:** Login y Registro con validación de email único.
- **Upload Service:** 
    - Recibir PDF.
    - Registrar en tabla `orders`.
    - Enviar a Webhook de n8n con `X-API-KEY` y metadatos.
- **Admin Service:** CRUD de usuarios y templates.

---

## 💻 Etapa 3: Frontend (`/web`)

### 3.1. Diseño y Estética (UI/UX)
- **Tema:** Dashboard profesional con Sidebar oscuro (basado en `disiño_ui.png`).
- **Componentes:**
    - Sidebar colapsable con opciones de navegación.
    - Header con perfil de usuario y Logout.
    - Modales de carga y previsualización.

### 3.2. Vistas Principales
- **Login/Register:** Selección de template al registrarse.
- **Dashboard de Usuario:** Listado de órdenes recientes.
- **Módulo de Carga:** 
    - Zona de Drag & Drop (arrastrar archivo).
    - Previsualización del PDF en modal.
    - Checkbox de confirmación: "He validado el formato y claridad del PDF".

### 3.3. Integración
- Cliente de Axios configurado con interceptores para el Token JWT.
- Context API o Redux para manejar el estado global del usuario.

---

## 🛠️ Variables de Entorno (.env)
```env
PORT=3000
SUPABASE_URL=tu_url
SUPABASE_KEY=tu_key
JWT_SECRET=tu_secreto_super_seguro
N8N_WEBHOOK_URL=url_de_n8n
N8N_API_KEY=tu_api_key_para_n8n
```
