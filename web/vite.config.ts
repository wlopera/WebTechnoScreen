import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Puerto predeterminado de desarrollo del frontend
    host: true // Permitir el acceso local desde otros dispositivos en la misma red
  }
});
