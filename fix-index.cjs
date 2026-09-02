const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const replacement = `    <script>
      window.APP_BASE_URL = "https://storelly-ece40.web.app";
      // Register Service Worker for PWA
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').catch((err) => {
            console.warn('Service worker registration note:', err);
          });
        });
      }

      // Suppress annoying IndexedDB errors before Vite overlay catches them
      const suppressError = (msg) => {
        if (!msg) return false;
        const str = typeof msg === 'string' ? msg : (msg.message || '');
        return str.includes('Database is closing') || str.includes('hidden') || str.includes('IndexedDB') || str.includes('Database is closed') || str.includes('Could not reach Cloud Firestore backend') || str.includes('code=unavailable') || str.includes('healthy Internet connection') || str.includes('The operation could not be completed');
      };
      
      window.addEventListener('error', (e) => {
        if (suppressError(e.message) || suppressError(e.error)) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }, true);
      
      window.addEventListener('unhandledrejection', (e) => {
        if (suppressError(e.reason)) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }, true);
    </script>`;

code = code.replace(/<script>[\s\S]*?<\/script>/, replacement);
fs.writeFileSync('index.html', code);
