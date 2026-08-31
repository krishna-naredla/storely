const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CatalogManager.tsx', 'utf8');

// replace <img src={item.images[0]} ... />
code = code.replace(/<img src=\{item\.images\[0\]\} className="w-full h-full object-cover" \/>/g, '<SafeImage src={item.images[0]} alt={item.name} fallbackType="product" className="w-full h-full object-cover" />');

if (!code.includes('SafeImage')) {
    code = code.replace("import { ImageUploadInput }", "import { SafeImage } from '../common/SafeImage';\nimport { ImageUploadInput }");
}

fs.writeFileSync('src/components/dashboard/CatalogManager.tsx', code);
