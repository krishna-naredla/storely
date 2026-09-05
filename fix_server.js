import fs from 'fs';

let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(/import { fileURLToPath } from 'url';\nconst __filename = fileURLToPath\(import\.meta\.url\);\nif \(process\.argv\[1\] === __filename\) {/g, 'if (process.argv[1] && (process.argv[1].endsWith("server.ts") || process.argv[1].endsWith("server.cjs"))) {');

fs.writeFileSync('server.ts', server);
console.log("Fixed server.ts");
