const fs = require('fs');
let code = fs.readFileSync('src/components/storefront/StorefrontView.tsx', 'utf8');

// replace <img src={business.banner ... />
code = code.replace(/<img\s+src=\{business\.banner \|\| business\.coverImage\}[^>]*onError=\{[^>]*\}[^>]*\/>/g, '<SafeImage src={business.banner || business.coverImage} alt={business.name} fallbackType="banner" className="w-full h-full object-cover object-center" />');

// replace <img src={business.logo} ... />
code = code.replace(/<img\s+src=\{business\.logo\}[^>]*onError=\{[^>]*\}[^>]*\/>/g, '<SafeImage src={business.logo} alt={business.name} fallbackType="avatar" className="w-full h-full object-cover aspect-square rounded-xl" />');

// replace <img src={business.maintenanceImage} ... />
code = code.replace(/<img\s+src=\{business\.maintenanceImage\}[^>]*\/>/g, '<SafeImage src={business.maintenanceImage} alt="Closed for maintenance" fallbackType="none" className="w-full h-full object-contain rounded-xl" />');

// replace <img src={item.images[0]} ... />
code = code.replace(/<img\s+src=\{item\.images\[0\]\}[^>]*\/>/g, '<SafeImage src={item.images[0]} alt={item.name} fallbackType="product" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />');

if (!code.includes('SafeImage')) {
    code = code.replace("import { ItemDetailModal }", "import { SafeImage } from '../common/SafeImage';\nimport { ItemDetailModal }");
}

fs.writeFileSync('src/components/storefront/StorefrontView.tsx', code);
