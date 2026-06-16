import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initTheme } from './utils/theme';

// Aplica o tema guardado / do sistema e reage a mudanças do sistema
initTheme();

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);