const fs = require('fs');
let code = fs.readFileSync('src/services/firebaseService.ts', 'utf8');

code = code.replace("DigitalProduct,\n  DigitalProductStatus,\n  DigitalProductType,\n", "");
code = code.replace("DigitalProduct,", "");

fs.writeFileSync('src/services/firebaseService.ts', code);
console.log('patched firebaseService types');
