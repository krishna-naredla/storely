const fs = require('fs');
let code = fs.readFileSync('src/services/firebaseService.ts', 'utf8');
code = code.replace(
`export async function getBusinessBySlug(rawSlug: string): Promise<BusinessProfile | null> {
  if (!rawSlug) return null;
  const slug = rawSlug.trim();
  const lowerSlug = slug.toLowerCase();`,
`export async function forceSyncLocalToFirestore() {
  const localList = getLocalBusinesses();
  for (const lb of localList) {
     if (lb && lb.id) {
       try {
         const docRef = doc(db, 'businesses', lb.id);
         setDoc(docRef, sanitizeForFirestore(lb), { merge: true }).catch(() => {});
       } catch (e) {}
     }
  }
}

export async function getBusinessBySlug(rawSlug: string): Promise<BusinessProfile | null> {
  // Always attempt a quick background sync when looking up a store
  // in case the creator is viewing their own store link right after creation
  forceSyncLocalToFirestore();

  if (!rawSlug) return null;
  const slug = rawSlug.trim();
  const lowerSlug = slug.toLowerCase();`
);
fs.writeFileSync('src/services/firebaseService.ts', code);
