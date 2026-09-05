import fs from 'fs';

let types = fs.readFileSync('src/types/index.ts', 'utf8');

types = types.replace(/shareCount\?: number;/g, "shareCount?: number;\n  bioRouting?: 'standalone' | 'storefront' | 'both';\n  bioTheme?: any;");

fs.writeFileSync('src/types/index.ts', types);
console.log("Updated types");
