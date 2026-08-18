const fs = require('fs');
let code = fs.readFileSync('src/services/firebaseService.ts', 'utf8');
code = code.replace(
`  // 3. Try fetching by ID directly (in case slug is business ID)
  try {
    const docRef = doc(db, 'businesses', slug);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as BusinessProfile;
      saveLocalBusiness(data);
      return data;
    }
  } catch (err) {
    console.warn('Firestore slug lookup (by ID) warning:', err);
  }

  return null;
}`,
`  // 3. Try fetching by ID directly (in case slug is business ID)
  try {
    const docRef = doc(db, 'businesses', slug);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as BusinessProfile;
      saveLocalBusiness(data);
      return data;
    }
  } catch (err) {
    console.warn('Firestore slug lookup (by ID) warning:', err);
  }

  // 4. Fallback to local storage (in case the background sync hasn't finished yet)
  const localList = getLocalBusinesses();
  const localMatch = localList.find(b => 
    b.slug?.toLowerCase() === lowerSlug || b.id === slug
  );
  if (localMatch) {
    return localMatch;
  }

  return null;
}`
);
fs.writeFileSync('src/services/firebaseService.ts', code);
