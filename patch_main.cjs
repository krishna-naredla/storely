const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');
code = `
// Suppress benign Firebase/IndexedDB errors in hidden iframes to prevent Vite overlay crashes
if (typeof window !== 'undefined') {
  const suppressError = (msg) => {
    if (!msg) return false;
    const str = typeof msg === 'string' ? msg : (msg.message || '');
    return str.includes('Database is closing') || str.includes('hidden') || str.includes('IndexedDB');
  };
  
  window.addEventListener('error', (e) => {
    if (suppressError(e.message)) e.preventDefault();
  });
  
  window.addEventListener('unhandledrejection', (e) => {
    if (suppressError(e.reason)) e.preventDefault();
  });
}
` + code;
fs.writeFileSync('src/main.tsx', code);
