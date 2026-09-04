const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CreatorModulesManager.tsx', 'utf8');

code = code.replace(/className=\\{\`p-3 rounded-xl \\\\\\$\\{mod\.enabled \? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'\\}\\\`\}>/g, 
  "className={`p-3 rounded-xl ${mod.enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>");

code = code.replace("className={`p-3 rounded-xl \\${mod.enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}\\`}>",
  "className={`p-3 rounded-xl ${mod.enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>");

fs.writeFileSync('src/components/dashboard/CreatorModulesManager.tsx', code);
console.log('fixed JSX 2');
