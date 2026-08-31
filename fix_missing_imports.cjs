const fs = require('fs');

function fixBioProfileView() {
    let code = fs.readFileSync('src/components/biolink/BioProfileView.tsx', 'utf8');
    if (!code.includes('import { SafeImage }')) {
        code = code.replace("import { BusinessProfile", "import { SafeImage } from '../common/SafeImage';\nimport { BusinessProfile");
        fs.writeFileSync('src/components/biolink/BioProfileView.tsx', code);
    }
}

function fixCatalogManager() {
    let code = fs.readFileSync('src/components/dashboard/CatalogManager.tsx', 'utf8');
    if (!code.includes('import { SafeImage }')) {
        code = code.replace("import React, {", "import { SafeImage } from '../common/SafeImage';\nimport React, {");
        fs.writeFileSync('src/components/dashboard/CatalogManager.tsx', code);
    }
}

fixBioProfileView();
fixCatalogManager();
