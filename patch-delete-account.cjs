const fs = require('fs');
let code = fs.readFileSync('src/services/firebaseService.ts', 'utf8');

const oldFunc = `    // 5. Fetch and delete offers
    const offers = await getOffers(businessId);
    for (const offer of offers) {
      await deleteOffer(businessId, offer.id);
    }`;

const newFunc = `    // 5. Fetch and delete offers
    const offers = await getOffers(businessId);
    for (const offer of offers) {
      await deleteOffer(businessId, offer.id);
    }

    // 5a. Fetch and delete biolinks
    const links = await getBioLinks(businessId);
    for (const link of links) {
      await deleteBioLink(link.id);
    }

    // 5b. Fetch and delete portfolio items & media
    const portfolioItems = await getPortfolioItems(businessId);
    for (const pItem of portfolioItems) {
      await deletePortfolioItem(businessId, pItem.id, pItem);
    }

    // 5c. Fetch and delete events & media
    const events = await getEvents(businessId);
    for (const ev of events) {
      if (ev.coverImage) await deleteImageFromStorage(ev.coverImage);
      await deleteDoc(doc(db, 'businesses', businessId, 'events', ev.id));
    }

    // 5d. Fetch and delete testimonials
    const testimonials = await getTestimonials(businessId);
    for (const t of testimonials) {
      if (t.photoUrl) await deleteImageFromStorage(t.photoUrl);
      await deleteDoc(doc(db, 'businesses', businessId, 'testimonials', t.id));
    }

    // 5e. Fetch and delete custom quotes
    const quotes = await getCustomQuotes(businessId);
    for (const q of quotes) {
      await deleteDoc(doc(db, 'businesses', businessId, 'custom_quotes', q.id));
    }
`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/services/firebaseService.ts', code);
console.log('patched permanentlyDeleteStoreAccount');
