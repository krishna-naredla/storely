const fs = require('fs');

// BioProfileView
let bioCode = fs.readFileSync('src/components/biolink/BioProfileView.tsx', 'utf8');
bioCode = bioCode.replace(
  `    document.title = title;`,
  `    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', business.description || \`Official links and resources for \${business.name}.\`);
    }`
);
fs.writeFileSync('src/components/biolink/BioProfileView.tsx', bioCode);

// StorefrontView
let storeCode = fs.readFileSync('src/components/storefront/StorefrontView.tsx', 'utf8');
storeCode = storeCode.replace(
  `      document.title = \`\${business.name} - Official Store | Storelly\`;`,
  `      document.title = \`\${business.name} - Official Store | Storelly\`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', business.description || \`Shop digital products, services, and exclusive content from \${business.name}.\`);
      }`
);
fs.writeFileSync('src/components/storefront/StorefrontView.tsx', storeCode);
console.log('patched SEO others');
