const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CreatorModulesManager.tsx', 'utf8');

code = code.replace(/url: \\\`https:\/\/storelly\.in\/store\/\\\$\{business\.slug\}\\\`/g, "url: `https://storelly.in/store/${business.slug}`");
code = code.replace(/url: \\\`https:\/\/storelly\.in\/@\\\$\{business\.slug\}\\\`/g, "url: `https://storelly.in/@${business.slug}`");
code = code.replace(/url: \\\`https:\/\/storelly\.in\/portfolio\/\\\$\{business\.slug\}\\\`/g, "url: `https://storelly.in/portfolio/${business.slug}`");

fs.writeFileSync('src/components/dashboard/CreatorModulesManager.tsx', code);
console.log('fixed literal backslashes');
