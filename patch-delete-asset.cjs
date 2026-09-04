const fs = require('fs');
let code = fs.readFileSync('src/services/firebaseService.ts', 'utf8');

const newAssetFunc = `
/**
 * Secure utility to delete a creator asset recursively,
 * removing documents and associated cloud storage files.
 */
export async function deleteCreatorAsset(businessId: string, assetId: string, assetType: 'biolink' | 'portfolio' | 'product' | 'event' | 'quote'): Promise<void> {
  try {
    switch (assetType) {
      case 'biolink':
        await deleteDoc(doc(db, 'biolinks', assetId));
        break;
      case 'portfolio': {
        const pRef = doc(db, 'businesses', businessId, 'portfolio', assetId);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
          const itemData = pSnap.data() as PortfolioItem;
          if (itemData.coverImage) await deleteImageFromStorage(itemData.coverImage);
          if (itemData.mediaUrls) {
            for (const url of itemData.mediaUrls) {
              const isVideo = itemData.mediaType === 'video_file' || url.includes('/video/');
              await deleteImageFromStorage(url, isVideo ? 'video' : 'image');
            }
          }
          if (itemData.cloudinaryPublicIds) {
            for (const pid of itemData.cloudinaryPublicIds) await deleteImageFromStorage(pid);
          }
          await deleteDoc(pRef);
        }
        break;
      }
      case 'product': {
        const prodRef = doc(db, 'businesses', businessId, 'catalog', assetId);
        const prodSnap = await getDoc(prodRef);
        if (prodSnap.exists()) {
          const prodData = prodSnap.data() as CatalogItem;
          if (prodData.images) {
            for (const img of prodData.images) await deleteImageFromStorage(img);
          }
          if (prodData.digitalFileUrl) await deleteImageFromStorage(prodData.digitalFileUrl, 'raw');
          await deleteDoc(prodRef);
        }
        break;
      }
      case 'event': {
        const evRef = doc(db, 'businesses', businessId, 'events', assetId);
        const evSnap = await getDoc(evRef);
        if (evSnap.exists()) {
          const evData = evSnap.data() as EventItem;
          if (evData.coverImage) await deleteImageFromStorage(evData.coverImage);
          await deleteDoc(evRef);
        }
        break;
      }
      case 'quote': {
        await deleteDoc(doc(db, 'businesses', businessId, 'quote_requests', assetId));
        break;
      }
    }
  } catch (err) {
    console.error(\`Failed to delete \${assetType} \${assetId}:\`, err);
    throw err;
  }
}
`;

code = code + newAssetFunc;
fs.writeFileSync('src/services/firebaseService.ts', code);
console.log('patched deleteCreatorAsset');
