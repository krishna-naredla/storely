import fs from 'fs';
let content = fs.readFileSync('src/components/biolink/BioProfileManager.tsx', 'utf8');
content = content.replace(/const publicUrl = routingMode === 'storefront' \? storefrontUrl : standaloneUrl;/g, "const publicUrl = (routingMode === 'storefront' || routingMode === 'both') ? storefrontUrl : standaloneUrl;");
fs.writeFileSync('src/components/biolink/BioProfileManager.tsx', content);
console.log("Fixed publicUrl");
