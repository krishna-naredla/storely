import fs from 'fs';

let service = fs.readFileSync('src/services/firebaseService.ts', 'utf8');

service = service.replace(/export async function forceSyncLocalToFirestore\(\) \{[\s\S]*?console\.warn\('Sync warning:', e\);\s+\}\s+\}\s+\}\s+\}/g, `export async function forceSyncLocalToFirestore() {
  const localList = getLocalBusinesses();
  for (const lb of localList) {
    if (lb && lb.id) {
      try {
        const docRef = doc(db, 'businesses', lb.id);
        const docSnap = await getDoc(docRef);
        
        // If the document was hard-deleted (doesn't exist) or soft-deleted (status === 'deleted')
        if (!docSnap.exists() || docSnap.data()?.status === 'deleted') {
          removeLocalBusiness(lb.id);
          continue;
        }
        
        await setDoc(docRef, sanitizeForFirestore(lb), { merge: true });
      } catch (e) {
        console.warn('Sync warning:', e);
      }
    }
  }
}`);

fs.writeFileSync('src/services/firebaseService.ts', service);
console.log("Fixed sync");
