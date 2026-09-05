import fs from 'fs';

let service = fs.readFileSync('src/services/firebaseService.ts', 'utf8');

// 1. Update forceSyncLocalToFirestore
service = service.replace(/export async function forceSyncLocalToFirestore\(\) \{\s+const localList = getLocalBusinesses\(\);\s+for \(const lb of localList\) \{\s+if \(lb && lb\.id\) \{\s+try \{\s+const docRef = doc\(db, 'businesses', lb\.id\);\s+setDoc\(docRef, sanitizeForFirestore\(lb\), \{ merge: true \}\)\.catch\(\(\) => \{\}\);\s+\} catch \(e\) \{\}\s+\}\s+\}\s+\}/g, `export async function forceSyncLocalToFirestore() {
  const localList = getLocalBusinesses();
  for (const lb of localList) {
    if (lb && lb.id) {
      try {
        const docRef = doc(db, 'businesses', lb.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().status === 'deleted') {
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

// 2. Update getBusinessBySlug to check status !== 'deleted'
service = service.replace(/if \(!snap\.empty\) \{\s+const data = snap\.docs\[0\]\.data\(\) as BusinessProfile;\s+saveLocalBusiness\(data\);\s+return data;\s+\}/g, `if (!snap.empty) {
      const data = snap.docs[0].data() as BusinessProfile;
      if (data.status === 'deleted') {
        removeLocalBusiness(data.id);
        return null;
      }
      saveLocalBusiness(data);
      return data;
    }`);

service = service.replace(/if \(!snapLower\.empty\) \{\s+const data = snapLower\.docs\[0\]\.data\(\) as BusinessProfile;\s+saveLocalBusiness\(data\);\s+return data;\s+\}/g, `if (!snapLower.empty) {
        const data = snapLower.docs[0].data() as BusinessProfile;
        if (data.status === 'deleted') {
          removeLocalBusiness(data.id);
          return null;
        }
        saveLocalBusiness(data);
        return data;
      }`);

fs.writeFileSync('src/services/firebaseService.ts', service);
console.log("Updated forceSync and getBusinessBySlug");
