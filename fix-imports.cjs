const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

if (!appCode.includes("import { CreatorAuthGuard }")) {
  appCode = appCode.replace(
    /import \{ AuthGuard \} from '\.\/components\/auth\/AuthGuard';/,
    "import { AuthGuard } from './components/auth/AuthGuard';\nimport { CreatorAuthGuard } from './components/auth/CreatorAuthGuard';"
  );
  fs.writeFileSync('src/App.tsx', appCode);
}

let bioCode = fs.readFileSync('src/components/biolink/BioProfileView.tsx', 'utf8');
if (!bioCode.includes("import { getBioLinks, getCatalogItems, recordAnalyticsEvent }")) {
  bioCode = bioCode.replace(
    /import \{ getBioLinks, getCatalogItems \} from '\.\.\/\.\.\/services\/firebaseService';/,
    "import { getBioLinks, getCatalogItems, recordAnalyticsEvent } from '../../services/firebaseService';"
  );
  fs.writeFileSync('src/components/biolink/BioProfileView.tsx', bioCode);
}
console.log('fixed imports');
