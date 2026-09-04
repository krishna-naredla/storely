const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CatalogManager.tsx', 'utf8');

const oldCode = `      )}
      </>
      )}`;

const newCode = `      )}`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/dashboard/CatalogManager.tsx', code);
console.log('patched trailing tags');
