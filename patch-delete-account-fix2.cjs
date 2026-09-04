const fs = require('fs');
let code = fs.readFileSync('src/services/firebaseService.ts', 'utf8');

const oldFunc = `    // 5d. Fetch and delete testimonials
    const testimonials = await getTestimonials(businessId);
    for (const t of testimonials) {
      if (t.photoUrl) await deleteImageFromStorage(t.photoUrl);
      await deleteDoc(doc(db, 'businesses', businessId, 'testimonials', t.id));
    }`;

const newFunc = `    // 5d. Fetch and delete testimonials
    const testimonials = await getTestimonials(businessId);
    for (const t of testimonials) {
      if (t.clientPhoto) await deleteImageFromStorage(t.clientPhoto);
      await deleteDoc(doc(db, 'businesses', businessId, 'testimonials', t.id));
    }`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/services/firebaseService.ts', code);
console.log('patched permanentlyDeleteStoreAccount 3');
