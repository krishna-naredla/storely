const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');

const regex = /export type DigitalProductType[\s\S]*?export interface DigitalProduct {[\s\S]*?updatedAt: number;\n}\n/g;
code = code.replace(regex, "");

fs.writeFileSync('src/types/index.ts', code);
console.log('patched types');
