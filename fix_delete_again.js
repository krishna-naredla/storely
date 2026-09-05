import fs from 'fs';

let service = fs.readFileSync('src/services/firebaseService.ts', 'utf8');

const newDeleteBusiness = `export async function deleteBusiness(businessId: string): Promise<void> {
  // Purge ALL businesses from localStorage to be safe, or just this one? 
  // "Also purge ALL businesses from localStorage on delete confirmation... at minimum ensure the deleting device's local cache is fully cleared"
  localStorage.removeItem(LOCAL_BIZ_KEY);

  try {
    const docRef = doc(db, 'businesses', businessId);
    
    // Soft delete first
    await setDoc(docRef, { status: 'deleted' }, { merge: true });
    
    // Also delete main document
    await deleteDoc(docRef);

    // Run cleanup as a background job
    setTimeout(async () => {
      const collectionsToClean = [
        'catalogItems',
        'biolinks',
        'communityLinks',
        'orders',
        'bookings',
        'customers',
        'events',
        'tickets',
        'portfolio',
        'testimonials',
        'quote_requests'
      ];
      
      try {
        for (const colName of collectionsToClean) {
          const q = query(collection(db, colName), where('businessId', '==', businessId));
          const snap = await getDocs(q);
          const deletePromises = snap.docs.map(d => deleteDoc(doc(db, colName, d.id)));
          await Promise.all(deletePromises);
        }
        console.log('Background cleanup completed for business:', businessId);
      } catch (err) {
        console.error('Background cleanup failed:', err);
      }
    }, 100);

  } catch (err) {
    console.warn('Firestore deleteBusiness warning:', err);
  }
}`;

service = service.replace(/export async function deleteBusiness[\s\S]*?console\.warn\('Firestore deleteBusiness warning:', err\);\s+\}\s+\}/g, newDeleteBusiness);

fs.writeFileSync('src/services/firebaseService.ts', service);
console.log("Updated deleteBusiness again");
