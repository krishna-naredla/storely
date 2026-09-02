const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPricingManager.tsx', 'utf8');

// Revert the bad sed
code = code.replace(/import \{ Key,/g, 'import {');

// Properly inject 'Key' to the lucide-react import
code = code.replace(/import \{\n  Trash2,/g, 'import {\n  Key,\n  Trash2,');

fs.writeFileSync('src/components/admin/AdminPricingManager.tsx', code);
console.log("Fixed imports");
