
// Suppress benign Firebase/IndexedDB errors in hidden iframes to prevent Vite overlay crashes
if (typeof window !== 'undefined') {
  const suppressError = (msg) => {
    if (!msg) return false;
    const str = typeof msg === 'string' ? msg : (msg.message || '');
    return str.includes('Database is closing') || str.includes('hidden') || str.includes('IndexedDB') || str.includes('Database is closed');
  };
  
  window.addEventListener('error', (e) => {
    if (suppressError(e.message)) e.preventDefault();
  });
  
  window.addEventListener('unhandledrejection', (e) => {
    if (suppressError(e.reason)) e.preventDefault();
  });
}
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
