const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CatalogManager.tsx', 'utf8');

// 1. Remove import
code = code.replace("import { DigitalProductsManager } from './DigitalProductsManager';\n", "");

// 2. Remove the JSX rendering it
const digitalTabStart = `{/* Render Digital Products Manager when active */}`;
const activeCatalogTabSection = `{activeCatalogTab === 'digital' && (isDigitalCreator || business.modules?.digital_products || business.modules?.digitalProducts) ? (
        <DigitalProductsManager businessId={business.id} businessName={business.name} />
      ) : (`;

const endOfSection = `)}
    </div>`;

// Actually wait, let's just use regular expressions or simple replaces
