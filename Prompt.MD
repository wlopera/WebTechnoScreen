# Prompt: Fullstack PDF Management App (NodeJS + React + Supabase)

**Contexto:**
Actúa como un Desarrollador Fullstack Senior. Mi objetivo es crear una aplicación profesional, práctica y segura para la carga de archivos PDF y la gestión de usuarios, integrando un backend en NodeJS y un frontend en React.

---

## 1. Stack Tecnológico
- **Frontend:** ReactJS, TypeScript, Tailwind CSS, Lucide React (iconos).
- **Backend:** NodeJS con Express y TypeScript.
- **Base de Datos:** Supabase (PostgreSQL).
- **Comunicación:** Axios para API interna y peticiones a n8n.

---

## 2. Arquitectura de Base de Datos (Generar Script SQL)
Genera el script SQL para ejecutar en el editor de Supabase:
- **Tabla `roles`**: (rolId PK, name, description, tipo: 'admin' | 'user').
- **Tabla `templates`**: (templateId PK, name, description, active boolean).
- **Tabla `users`**: (userId PK, email, password_hash, templateId FK, rolId FK, active boolean).
- **Tabla `orders`**: (orderId PK, userId FK, filename, date timestamp).
- **Semilla Inicial**: Crear un rol 'admin', un rol 'user', un template de prueba activo y un usuario administrador inicial con contraseña hasheada.

---

## 3. Requerimientos del Backend (Directorio `/api`)
- **Autenticación**: Implementar flujo de Login y Registro usando `bcrypt` para contraseñas y `jsonwebtoken` (JWT) para sesiones.
- **Endpoints de Admin**: CRUD completo para tablas de usuarios, templates, roles y órdenes. Solo accesibles si el token pertenece a un rol 'admin'.
- **Endpoint `/upload`**:
    - Usar `multer` para recibir el archivo PDF.
    - Generar automáticamente un `orderId`.
    - Guardar el registro de la orden en la base de datos.
    - **Integración n8n**: Reenviar el archivo y los metadatos (email, userId, templateId, orderId, fecha) a un Webhook de n8n usando `Multipart/form-data`.
    - **Seguridad**: Incluir un header `X-API-KEY` secreto en la petición hacia n8n.

---

## 4. Requerimientos del Frontend (Directorio `/web`)
- **Layout Principal**: 
    - Sidebar izquierdo: Opciones "Usuario", "Cargar archivo" y "Dashboard".
    - Header: Nombre de la App a la izquierda, botón de Logout/Conexión a la derecha.
    - Las opciones "Cargar" y "Dashboard" deben estar deshabilitadas si no hay un usuario logueado.
- **Vistas de Usuario**:
    - Registro/Login: El registro debe incluir un Dropdown para seleccionar el `templateId` (solo templates activos).
    - Perfil: Permitir cambio de password.
- **Módulo de Carga de PDF**:
    - Área de Drag & Drop (arrastrar archivo) con validación solo para `.pdf`.
    - Vista previa pequeña con scroll interno y leyenda de metadatos (nombre, tamaño).
    - Botón para abrir Modal de pantalla completa para revisión técnica del PDF.
    - Botón "Enviar" que dispara una Modal de confirmación final: "He validado el formato y claridad del PDF".

---

## 5. Instrucciones de Entrega
1. Genera la estructura de carpetas sugerida (`/api/src` y `/web/src`).
2. Proporciona el archivo `.env.example` con las variables para Supabase, JWT_SECRET y N8N_WEBHOOK_URL.
3. Asegura que el código sea limpio, tipado con TypeScript y siga las mejores prácticas de seguridad.
