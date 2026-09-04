const fs = require('fs');
let code = fs.readFileSync('src/services/firebaseService.ts', 'utf8');

const startRegex = /\/\*\*[\s\n\*]*Digital Products CRUD \(PDF, Courses, Graphic Assets, Templates, etc\.\)[\s\n\*]*\*\//;
const endRegex = /\/\*\*[\s\n\*]*Orders Management[\s\n\*]*\*\//;

const matchStart = code.match(startRegex);
const matchEnd = code.match(endRegex);

if (matchStart && matchEnd) {
  const startIndex = matchStart.index;
  const endIndex = matchEnd.index;
  
  code = code.substring(0, startIndex) + code.substring(endIndex);
  fs.writeFileSync('src/services/firebaseService.ts', code);
  console.log('patched firebaseService.ts');
} else {
  console.log('Failed to match');
  console.log('start', matchStart);
  console.log('end', matchEnd);
}
