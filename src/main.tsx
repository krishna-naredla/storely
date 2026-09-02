import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Suppress benign Firebase/IndexedDB errors in hidden iframes
if (typeof window !== 'undefined') {
  const suppressError = (msg: any) => {
    if (!msg) return false;
    const str = typeof msg === 'string' ? msg : (msg.message || '');
    return (
      str.includes('Database is closing') ||
      str.includes('hidden') ||
      str.includes('IndexedDB') ||
      str.includes('Database is closed') ||
      str.includes('Could not reach Cloud Firestore backend') ||
      str.includes('code=unavailable') ||
      str.includes('healthy Internet connection') ||
      str.includes('The operation could not be completed')
    );
  };

  const originalConsoleError = console.error;
  console.error = (...args) => {
    const isSuppressed = args.some((arg) => {
      if (!arg) return false;
      const str = typeof arg === 'string' ? arg : (arg.message || arg.toString() || '');
      return suppressError(str);
    });
    if (isSuppressed) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

