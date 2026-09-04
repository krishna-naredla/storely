const fs = require('fs');
let code = fs.readFileSync('src/services/firebaseService.ts', 'utf8');

const oldFunc = `    // 5e. Fetch and delete custom quotes
    const quotes = await getCustomQuotes(businessId);
    for (const q of quotes) {
      await deleteDoc(doc(db, 'businesses', businessId, 'custom_quotes', q.id));
    }`;

const newFunc = `    // 5e. Fetch and delete custom quotes
    const quotes = await getCustomQuoteRequests(businessId);
    for (const q of quotes) {
      await deleteDoc(doc(db, 'businesses', businessId, 'quote_requests', q.id));
    }`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/services/firebaseService.ts', code);
console.log('patched permanentlyDeleteStoreAccount 2');
