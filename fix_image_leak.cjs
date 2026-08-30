const fs = require('fs');
const file = 'src/components/dashboard/CatalogManager.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "setCloudinaryPublicId(randomId);\n      setImageUrls([url]);",
  "setCloudinaryPublicId(url);\n      // FIXED: Do not set digital file as the public thumbnail image array\n"
);
// Also fix the case where randomId was set
code = code.replace(
  "setCloudinaryPublicId(randomId);\n      // FIXED",
  "setCloudinaryPublicId(url);\n      // FIXED"
);

fs.writeFileSync(file, code);
