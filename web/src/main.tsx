import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Importar los estilos globales y el sistema de diseño premium del proyecto
import './styles/index.css';

// Montar e iniciar la aplicación React en el contenedor raíz
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
