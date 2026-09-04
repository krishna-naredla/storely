const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CatalogManager.tsx', 'utf8');

// 1. Remove DigitalProductsManager import
code = code.replace("import { DigitalProductsManager } from './DigitalProductsManager';\n", "");

// 2. Remove activeCatalogTab state
code = code.replace(
  /const \[activeCatalogTab, setActiveCatalogTab\] = useState<'standard' \| 'digital'>\([\s\S]*?\);/,
  ""
);

// 3. Remove the tabs UI and the conditional rendering
const tabsSection = `{/* Creator Sub-navigation */}`;
const tabsEnd = `) : (`;

const startIdx = code.indexOf(tabsSection);
const endIdx = code.indexOf(tabsEnd) + tabsEnd.length;

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + code.substring(endIdx);
  // Also need to remove the closing tags at the very end
  // The structure is:
  // {activeCatalogTab === 'digital' ? <DigitalProductsManager /> : (
  //   <>
  //     ...
  //   </>
  // )}
  // So we need to remove the trailing `</>\n      )}`
  
  // Let's find the trailing part
  const trailingPart = `</>
      )}`;
  const lastIndex = code.lastIndexOf(trailingPart);
  if (lastIndex !== -1) {
    code = code.substring(0, lastIndex) + code.substring(lastIndex + trailingPart.length);
  }
}

fs.writeFileSync('src/components/dashboard/CatalogManager.tsx', code);
console.log('patched CatalogManager.tsx');
