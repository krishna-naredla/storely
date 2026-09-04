const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace("import { StorefrontView } from './components/storefront/StorefrontView';", 
"import { StorefrontView } from './components/storefront/StorefrontView';\nimport { PortfolioShowcase } from './components/storefront/PortfolioShowcase';");
fs.writeFileSync('src/App.tsx', code);
console.log('patched App.tsx import');
