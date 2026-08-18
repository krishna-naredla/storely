const fs = require('fs');
let code = fs.readFileSync('src/services/firebaseService.ts', 'utf8');
code = code.replace(
`  // Merge with local businesses
  const localList = getLocalBusinesses().filter((b) => b.ownerId === ownerId || ownerId === 'guest_user');
  const combinedMap = new Map<string, BusinessProfile>();

  localList.forEach((b) => combinedMap.set(b.id, b));
  list.forEach((b) => combinedMap.set(b.id, b));

  const result = Array.from(combinedMap.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  result.forEach((b) => saveLocalBusiness(b));

  return result;`,
`  // Merge with local businesses
  const localList = getLocalBusinesses().filter((b) => b.ownerId === ownerId || ownerId === 'guest_user');
  const combinedMap = new Map<string, BusinessProfile>();

  // Auto-sync local missing businesses to Firestore (since earlier permission issues blocked them)
  const firestoreIds = new Set(list.map(b => b.id));
  for (const lb of localList) {
    if (!firestoreIds.has(lb.id) && ownerId !== 'guest_user') {
       try {
         const docRef = doc(db, 'businesses', lb.id);
         setDoc(docRef, sanitizeForFirestore(lb), { merge: true }).catch(e => console.warn('Auto-sync failed:', e));
       } catch (e) {}
    }
  }

  localList.forEach((b) => combinedMap.set(b.id, b));
  list.forEach((b) => combinedMap.set(b.id, b));

  const result = Array.from(combinedMap.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  result.forEach((b) => saveLocalBusiness(b));

  return result;`
);
fs.writeFileSync('src/services/firebaseService.ts', code);
