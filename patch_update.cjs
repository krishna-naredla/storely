const fs = require('fs');
let code = fs.readFileSync('src/services/firebaseService.ts', 'utf8');
code = code.replace(
`export async function updateBusiness(businessId: string, data: Partial<BusinessProfile>): Promise<void> {
  const updatedData = {
    ...data,
    updatedAt: Date.now(),
  };

  // Update local cache
  const localList = getLocalBusinesses();
  const existing = localList.find((b) => b.id === businessId);
  if (existing) {
    saveLocalBusiness({ ...existing, ...updatedData });
  }

  try {
    const sanitized = sanitizeForFirestore(updatedData);
    const docRef = doc(db, 'businesses', businessId);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    console.warn('Firestore updateBusiness warning, preserved in local cache:', err);
  }
}`,
`export async function updateBusiness(businessId: string, data: Partial<BusinessProfile>): Promise<void> {
  const updatedData = {
    ...data,
    updatedAt: Date.now(),
  };

  // Update local cache
  const localList = getLocalBusinesses();
  const existing = localList.find((b) => b.id === businessId);
  
  let dataToWrite = updatedData;
  if (existing) {
    const fullUpdated = { ...existing, ...updatedData };
    saveLocalBusiness(fullUpdated);
    dataToWrite = fullUpdated; // Upload full document in case it's missing in Firestore
  }

  try {
    const sanitized = sanitizeForFirestore(dataToWrite);
    const docRef = doc(db, 'businesses', businessId);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    console.warn('Firestore updateBusiness warning, preserved in local cache:', err);
  }
}`
);
fs.writeFileSync('src/services/firebaseService.ts', code);
