const fs = require('fs');
let code = fs.readFileSync('src/components/storefront/EventCheckoutModal.tsx', 'utf8');

const replacement = `        let data;
        try {
          data = JSON.parse(await response.text());
        } catch (e) {
          throw new Error('Invalid response from server.');
        }`;

code = code.replace("const data = await response.json();", replacement);
fs.writeFileSync('src/components/storefront/EventCheckoutModal.tsx', code);
console.log('patched event checkout modal');
