const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

if (!appCode.includes("import { CreatorAuthGuard }")) {
  appCode = "import { CreatorAuthGuard } from './components/auth/CreatorAuthGuard';\n" + appCode;
  fs.writeFileSync('src/App.tsx', appCode);
  console.log('fixed App.tsx');
}

let bioCode = fs.readFileSync('src/components/biolink/BioProfileView.tsx', 'utf8');
if (!bioCode.includes("recordAnalyticsEvent }")) {
  bioCode = "import { recordAnalyticsEvent } from '../../services/firebaseService';\n" + bioCode;
  fs.writeFileSync('src/components/biolink/BioProfileView.tsx', bioCode);
  console.log('fixed bio');
}
