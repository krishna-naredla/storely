const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/WorkPortfolioManager.tsx', 'utf8');

code = code.replace("await uploadToCloudinary(file, 'portfolio', (p) => setUploadProgress(p));", "await uploadToCloudinary(file, (p) => setUploadProgress(p));");
code = code.replace("await uploadToCloudinary(file, 'portfolio');", "await uploadToCloudinary(file);");
code = code.replace("const res = await uploadToCloudinary(file, 'portfolio', (p) => setUploadProgress(p));", "const url = await uploadToCloudinary(file, (p) => setUploadProgress(p));");
code = code.replace("res.url", "url");

fs.writeFileSync('src/components/dashboard/WorkPortfolioManager.tsx', code);
console.log('patched WorkPortfolioManager');
