const { execSync } = require('child_process');
console.log(execSync('grep -rn "catch" src/components/storefront/StorefrontView.tsx -A 5').toString());
