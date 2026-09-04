const fs = require('fs');
let code = fs.readFileSync('src/services/firebaseService.ts', 'utf8');

code = code.replace(
  /eventType: 'store_view' \| 'whatsapp_click' \| 'catalog_view' \| 'cart_add',/g,
  "eventType: 'store_view' | 'whatsapp_click' | 'catalog_view' | 'cart_add' | 'bio_views' | 'bio_clicks' | 'portfolio_views' | 'project_views' | 'social_clicks' | 'resume_downloads' | string,"
);

fs.writeFileSync('src/services/firebaseService.ts', code);
console.log('patched analytics typing');
