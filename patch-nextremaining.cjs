const fs = require('fs');
let code = fs.readFileSync('src/services/firebaseService.ts', 'utf8');

code = code.replace("seatsRemaining: nextRemaining,", "seatsRemaining: seatsRemaining,");
fs.writeFileSync('src/services/firebaseService.ts', code);
console.log('patched nextRemaining');
