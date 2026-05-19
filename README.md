# WebTechnoScreen - Prueba de Concepto

Este proyecto es una aplicación web completa estructurada en una arquitectura desacoplada con un **Frontend en ReactJS** y un **Backend en NodeJS (Express)**, diseñada para la gestión de contenidos y flujos de trabajo con PDFs, integración con Supabase y automatización de webhooks con n8n.

---

## 🚀 Arquitectura del Proyecto

El repositorio está dividido en dos partes principales:

1. **`web/` (Frontend)**:
   - Construido con **ReactJS**, **Vite** y **TypeScript**.
   - Interfaz de usuario moderna, responsiva y dinámica basada en el diseño de `disiño_ui.png`.
   - Autenticación y gestión de estado mediante Context API de React.

2. **`api/` (Backend)**:
   - Construido con **Node.JS**, **Express** y **TypeScript**.
   - API RESTful encargada del manejo lógico de la aplicación, generación de tokens JWT, subida de archivos y comunicación segura con servicios externos.

---

## 🛠️ Requisitos Previos

Asegúrate de tener instalado en tu sistema:
- [Node.js](https://nodejs.org/) (Versión 16 o superior recomendada)
- [Git](https://git-scm.com/)
- Una cuenta y base de datos activa en [Supabase](https://supabase.com/)

---

## ⚙️ Configuración e Instalación

Sigue estos pasos para poner en marcha el proyecto localmente:

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/WebTechnoScreen.git
cd WebTechnoScreen
```

### 2. Configurar el Backend (`api`)
1. Entra a la carpeta del backend:
   ```bash
   cd api
   ```
2. Instala las dependencias necesarias:
   ```bash
   npm install
   ```
3. Crea tu archivo de configuración de variables de entorno copiando el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```
4. Abre el archivo `.env` creado y configura tus credenciales reales (Supabase URL, Supabase API Key, JWT Secret, n8n Webhook, etc.).
5. Inicia el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```

### 3. Configurar el Frontend (`web`)
1. Abre una nueva terminal en la raíz del proyecto y entra a la carpeta del frontend:
   ```bash
   cd web
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. (Opcional) Crea el archivo `.env` si necesitas apuntar a un servidor backend en una URL distinta de `localhost`:
   ```bash
   cp .env.example .env
   ```
4. Inicia el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
5. Abre la aplicación en tu navegador en `http://localhost:5173`.

---

## 🗄️ Configuración de la Base de Datos (Supabase)

El proyecto requiere una base de datos PostgreSQL/Supabase. 

1. Ejecuta el archivo SQL `database.sql` en el **SQL Editor** de tu consola de Supabase para crear las tablas, relaciones y funciones necesarias.
2. Recuerda configurar las políticas de seguridad (RLS) en el bucket de storage `pdfs` de Supabase para poder subir y descargar archivos. Puedes consultar los scripts específicos para estas políticas en el archivo `notas.txt`.

---

## 🔒 Seguridad e Integración (n8n)

- **Claves API**: La comunicación hacia servicios externos de automatización como **n8n** se realiza mediante headers seguros utilizando la cabecera `X-API-KEY`.
- **JWT**: La autenticación de usuarios y administradores se realiza por medio de JSON Web Tokens cifrados de corta duración.

---

## 📝 Licencia

Este proyecto es una prueba de concepto privada para Techno Screen. Todos los derechos reservados.
