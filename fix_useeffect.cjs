const fs = require('fs');
let code = fs.readFileSync('src/components/storefront/StorefrontView.tsx', 'utf8');

code = code.replace(/useEffect\(\(\) => \{\n    loadStoreData\(\)\.then\(\(\) => \{\n      \/\/ Handle item deep linking from URL \?item=ID\n      const urlParams = new URLSearchParams\(window\.location\.search\);\n      const itemId = urlParams\.get\('item'\);\n      if \(itemId\) \{\n        \/\/ Find item in loaded catalog or fetch it\n        const item = catalogItems\.find\(i => i\.id === itemId\);\n        if \(item\) \{\n          setSelectedItemForDetail\(item\);\n        \}\n      \}\n    \}\);\n  \}, \[business\.id\]\);/, `useEffect(() => {
    loadStoreData();
  }, [business.id]);

  useEffect(() => {
    if (catalogItems.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const itemId = urlParams.get('item');
      if (itemId) {
        const item = catalogItems.find(i => i.id === itemId);
        if (item) setSelectedItemForDetail(item);
      }
    }
  }, [catalogItems.length]);`);

fs.writeFileSync('src/components/storefront/StorefrontView.tsx', code);
