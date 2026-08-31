const fs = require('fs');
let code = fs.readFileSync('src/components/biolink/BioProfileView.tsx', 'utf8');

// replace <img src={business.logo} ... />
code = code.replace(/<img src=\{business\.logo\}[^>]+>/g, '<SafeImage src={business.logo} alt={business.name} fallbackType="avatar" className="w-full h-full object-cover" />');

// replace <img src={item.images[0]} ... />
code = code.replace(/<img src=\{item\.images\[0\]\}[^>]+>/g, '<SafeImage src={item.images[0]} alt={item.name} fallbackType="product" className="w-16 h-16 rounded-xl object-cover mr-4" />');

// add import
if (!code.includes('SafeImage')) {
    code = code.replace("import { Instagram", "import { SafeImage } from '../common/SafeImage';\nimport { Instagram");
}

fs.writeFileSync('src/components/biolink/BioProfileView.tsx', code);
