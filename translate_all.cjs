const fs = require('fs');

const filesToProcess = [
  'src/components/dashboard/CatalogManager.tsx',
  'src/components/dashboard/OrderManager.tsx',
  'src/components/dashboard/CustomerManager.tsx',
  'src/components/dashboard/StoreSettings.tsx',
];

filesToProcess.forEach(file => {
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');

  // Add import if missing
  if (!content.includes('useLanguage')) {
    content = content.replace(
      "import React,", 
      "import React, {\n  useLanguage\n} from '../../context/LanguageContext';\nimport React,"
    );
    // actually safer to replace import React from 'react'
    content = content.replace(
      "import React, { useState", 
      "import { useLanguage } from '../../context/LanguageContext';\nimport React, { useState"
    );
  }

  // Very rudimentary injection of `const { t } = useLanguage();`
  // We look for `export const ComponentName = ({ ... }) => {`
  content = content.replace(
    /export const ([a-zA-Z]+): React\.FC<.*?> = \((.*?)\) => {/,
    "export const $1: React.FC<any> = ($2) => {\n  const { t } = useLanguage();"
  );
  
  // A few basic replacements in JSX
  content = content.replace(/>Add Product</g, '>{t("catalog.addProduct")}<');
  content = content.replace(/>Edit Product</g, '>{t("catalog.editProduct")}<');
  content = content.replace(/>Delete Product</g, '>{t("catalog.deleteProduct")}<');
  content = content.replace(/>In Stock</g, '>{t("catalog.inStock")}<');
  content = content.replace(/>Out of Stock</g, '>{t("catalog.outOfStock")}<');
  content = content.replace(/placeholder="Search products..."/g, 'placeholder={t("catalog.searchProducts")}');
  content = content.replace(/>No products found</g, '>{t("catalog.noProducts")}<');

  content = content.replace(/>Pending</g, '>{t("orders.pending")}<');
  content = content.replace(/>Processing</g, '>{t("orders.processing")}<');
  content = content.replace(/>Shipped</g, '>{t("orders.shipped")}<');
  content = content.replace(/>Delivered</g, '>{t("orders.delivered")}<');
  content = content.replace(/>Cancelled</g, '>{t("orders.cancelled")}<');
  
  fs.writeFileSync(file, content);
});

