const fs = require('fs');

function fixStorefront() {
    let code = fs.readFileSync('src/components/storefront/StorefrontView.tsx', 'utf8');
    code = code.replace("import { Download, BUSINESS_TYPES }", "import { BUSINESS_TYPES }");
    code = code.replace("import { SafeImage } from '../common/SafeImage';", "");
    code = code.replace("import {\n  Store,", "import { SafeImage } from '../common/SafeImage';\nimport {\n  Store,\n  Download,\n  Loader2,\n  X,");
    fs.writeFileSync('src/components/storefront/StorefrontView.tsx', code);
}

function fixItemDetail() {
    let code = fs.readFileSync('src/components/storefront/ItemDetailModal.tsx', 'utf8');
    if (!code.includes('import { SafeImage }')) {
        code = code.replace("import { CatalogItem", "import { SafeImage } from '../common/SafeImage';\nimport { CatalogItem");
        fs.writeFileSync('src/components/storefront/ItemDetailModal.tsx', code);
    }
}

function fixCatalog() {
    let code = fs.readFileSync('src/components/dashboard/CatalogManager.tsx', 'utf8');
    if (!code.includes('import { SafeImage }')) {
        code = code.replace("import { CatalogItem", "import { SafeImage } from '../common/SafeImage';\nimport { CatalogItem");
        fs.writeFileSync('src/components/dashboard/CatalogManager.tsx', code);
    }
}

fixStorefront();
fixItemDetail();
fixCatalog();
