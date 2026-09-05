import fs from 'fs';
let content = fs.readFileSync('src/services/firebaseService.ts', 'utf8');

const replacement = `export function getStorefrontUrl(businessOrSlug: any): string {
  if (typeof businessOrSlug === 'object' && businessOrSlug !== null) {
    const slug = businessOrSlug.slug;
    
    // If they have Bio Links enabled, check their routing preference
    if (businessOrSlug.modules?.universal_links) {
      const routingMode = businessOrSlug.bioRouting || 'standalone';
      if (routingMode === 'standalone') {
        return getBioLinkUrl(slug);
      }
    }
    
    // Default to storefront for everything else (retail, products, etc)
    return getDigitalStoreUrl(slug);
  }

  const slug = typeof businessOrSlug === 'string' ? businessOrSlug : businessOrSlug?.slug || '';
  return getDigitalStoreUrl(slug);
}`;

content = content.replace(/export function getStorefrontUrl[\s\S]*?return getDigitalStoreUrl\(slug\);\n\}/, replacement);

fs.writeFileSync('src/services/firebaseService.ts', content);
console.log("Fixed getStorefrontUrl");
