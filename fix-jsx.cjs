const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CreatorModulesManager.tsx', 'utf8');

code = code.replace(/className=\{\\\`p-3/g, "className={`p-3");
code = code.replace(/slate-400'\\\`\}/g, "slate-400'}`}");

fs.writeFileSync('src/components/dashboard/CreatorModulesManager.tsx', code);
console.log('fixed JSX');
