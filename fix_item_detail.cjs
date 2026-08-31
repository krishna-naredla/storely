const fs = require('fs');
let code = fs.readFileSync('src/components/storefront/ItemDetailModal.tsx', 'utf8');

// replace main img
code = code.replace(/<img\s*src=\{images\[selectedImageIndex\] \|\| images\[0\]\}\s*alt=\{item\.name\}\s*referrerPolicy="no-referrer"\s*className="w-full h-full object-cover"\s*\/>/g, 
'<SafeImage src={images[selectedImageIndex] || images[0]} alt={item.name} fallbackType="product" className="w-full h-full object-cover" />');

// replace thumbnail img
code = code.replace(/<img\s*src=\{img\}\s*alt=\{`Thumbnail \$\{idx\}`\}\s*className="w-full h-full object-cover"\s*\/>/g, 
'<SafeImage src={img} alt={`Thumbnail ${idx}`} fallbackType="product" className="w-full h-full object-cover" />');

if (!code.includes('SafeImage')) {
    code = code.replace("import { useStorefrontCart }", "import { SafeImage } from '../common/SafeImage';\nimport { useStorefrontCart }");
}

fs.writeFileSync('src/components/storefront/ItemDetailModal.tsx', code);
