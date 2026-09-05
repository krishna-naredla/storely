import fs from 'fs';
let content = fs.readFileSync('src/components/storefront/StorefrontView.tsx', 'utf8');

const regex = /\) : \([\s\S]*?No Upcoming Events Right Now[\s\S]*?<\/main>\s*\) : \(/;
content = content.replace(regex, ") : (");

fs.writeFileSync('src/components/storefront/StorefrontView.tsx', content);
console.log("Fixed syntax");
