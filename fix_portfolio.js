import fs from 'fs';
let content = fs.readFileSync('src/components/storefront/PortfolioShowcase.tsx', 'utf8');

const replacement = `  if (!isLoading && items.length === 0 && testimonials.length === 0 && !hasMediaKit && !hasCollabs) {
    return null;
  }

  return (
    <div className="space-y-12 animate-in fade-in">`;

content = content.replace(/return \(\n    <div className="space-y-12 animate-in fade-in">/, replacement);

fs.writeFileSync('src/components/storefront/PortfolioShowcase.tsx', content);
console.log("Fixed PortfolioShowcase");
