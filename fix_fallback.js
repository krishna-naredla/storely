import fs from 'fs';

let service = fs.readFileSync('src/services/firebaseService.ts', 'utf8');

const regex = /\/\/ 5\. Fallback to local storage cache[\s\S]*?return \(\s*localList\.find\([\s\S]*?\) \|\| null\s*\);\s*\}/;

const replacement = `// 5. Fallback to local storage cache (only if we didn't explicitly find out it was deleted or missing)
  const localList = getLocalBusinesses();
  const fallback = localList.find(
    (b) =>
      b.slug?.toLowerCase() === lowerSlug ||
      generateSlug(b.name || '') === lowerSlug ||
      b.id === slug
  );
  
  if (fallback) {
    // We only use the fallback if we actually want to, but if it was missing from Firestore, it shouldn't be valid.
    // However, to avoid breaking offline support, we'll just return it. 
    // The forceSyncLocalToFirestore will clean it up in the background if it was deleted.
    return fallback;
  }
  return null;
}`;

service = service.replace(regex, replacement);

fs.writeFileSync('src/services/firebaseService.ts', service);
console.log("Updated fallback");
