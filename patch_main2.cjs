const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');
code = code.replace(
  "return str.includes('Database is closing') || str.includes('hidden') || str.includes('IndexedDB');",
  "return str.includes('Database is closing') || str.includes('hidden') || str.includes('IndexedDB') || str.includes('Database is closed');"
);
fs.writeFileSync('src/main.tsx', code);
