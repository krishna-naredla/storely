const fs = require('fs');

const filesToProcess = [
  'src/components/dashboard/CatalogManager.tsx',
  'src/components/dashboard/OrderManager.tsx',
  'src/components/dashboard/CustomerManager.tsx',
  'src/components/dashboard/StoreSettings.tsx',
];

filesToProcess.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace bad imports
  content = content.replace(/import React, {\n  useLanguage\n} from '..\/..\/context\/LanguageContext';\nimport { useLanguage } from '..\/..\/context\/LanguageContext';\nimport React, { useState/g, "import { useLanguage } from '../../context/LanguageContext';\nimport React, { useState");
  content = content.replace(/import React, {\n  useLanguage\n} from '..\/..\/context\/LanguageContext';\nimport { useLanguage } from '..\/..\/context\/LanguageContext';\nimport React/g, "import { useLanguage } from '../../context/LanguageContext';\nimport React");
  
  fs.writeFileSync(file, content);
});

