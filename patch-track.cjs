const fs = require('fs');

let bioCode = fs.readFileSync('src/components/biolink/BioProfileView.tsx', 'utf8');
if (!bioCode.includes('recordAnalyticsEvent')) {
  bioCode = bioCode.replace(
    /import { getBioLinks, getCatalogItems } from '\.\.\/\.\.\/services\/firebaseService';/,
    "import { getBioLinks, getCatalogItems, recordAnalyticsEvent } from '../../services/firebaseService';"
  );
  bioCode = bioCode.replace(
    /setLinks\(data\.filter\(\(l: any\) => l\.enabled\)\);/,
    "setLinks(data.filter((l: any) => l.enabled));\n    recordAnalyticsEvent(business.id, 'bio_views', { slug: business.slug }).catch(() => {});"
  );
  bioCode = bioCode.replace(
    /const handleLinkClick = \(link: any\) => \{/,
    `const handleLinkClick = (link: any) => {
    recordAnalyticsEvent(business.id, 'bio_clicks', { linkId: link.id, linkType: link.type }).catch(() => {});`
  );
  fs.writeFileSync('src/components/biolink/BioProfileView.tsx', bioCode);
}

let portCode = fs.readFileSync('src/components/storefront/PortfolioShowcase.tsx', 'utf8');
if (!portCode.includes('recordAnalyticsEvent')) {
  portCode = portCode.replace(
    /getPortfolioItems,/,
    "getPortfolioItems,\n  recordAnalyticsEvent,"
  );
  portCode = portCode.replace(
    /setItems\(fetchedItems\);/,
    "setItems(fetchedItems);\n        recordAnalyticsEvent(business.id, 'portfolio_views', { slug: business.slug }).catch(() => {});"
  );
  
  // Track project views if there's an item click
  portCode = portCode.replace(
    /const handleItemClick = \(item: PortfolioItem\) => \{/g,
    `const handleItemClick = (item: PortfolioItem) => {
    recordAnalyticsEvent(business.id, 'project_views', { itemId: item.id }).catch(() => {});`
  );
  
  fs.writeFileSync('src/components/storefront/PortfolioShowcase.tsx', portCode);
}

console.log('patched tracking');
