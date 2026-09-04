const fs = require('fs');

function injectAdvancedSEO(filePath, type) {
  let code = fs.readFileSync(filePath, 'utf8');
  let newSeo = '';
  
  if (type === 'store') {
    newSeo = `
    document.title = \`\${business.name} - Official Store | Storelly\`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', business.description || \`Shop digital products, services, and exclusive content from \${business.name}.\`);
    
    // Advanced SEO
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);

    const ogTags = [
      { property: 'og:title', content: \`\${business.name} - Official Store\` },
      { property: 'og:description', content: business.description || \`Shop digital products from \${business.name}\` },
      { property: 'og:url', content: window.location.href },
      { property: 'og:type', content: 'website' }
    ];
    
    ogTags.forEach(tag => {
      let el = document.querySelector(\`meta[property="\${tag.property}"]\`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', tag.property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', tag.content);
    });
`;
    // Find the old SEO logic and replace it
    code = code.replace(/document\.title = `\$\{business\.name\} - Official Store \| Storelly`;[\s\S]*?metaDesc\.setAttribute\('content', business\.description \|\| `Shop digital products, services, and exclusive content from \$\{business\.name\}\.`\);\s*\}/g, newSeo);
  } else if (type === 'bio') {
    newSeo = `
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', business.description || \`Official links and resources for \${business.name}.\`);
    
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);

    const ogTags = [
      { property: 'og:title', content: title },
      { property: 'og:description', content: business.description || \`Links for \${business.name}\` },
      { property: 'og:url', content: window.location.href },
      { property: 'og:type', content: 'profile' }
    ];
    
    ogTags.forEach(tag => {
      let el = document.querySelector(\`meta[property="\${tag.property}"]\`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', tag.property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', tag.content);
    });
`;
    code = code.replace(/document\.title = title;[\s\S]*?metaDesc\.setAttribute\('content', business\.description \|\| `Official links and resources for \$\{business\.name\}\.`\);\s*\}/g, newSeo);
  } else if (type === 'portfolio') {
    newSeo = `
    document.title = \`\${business.name} | Professional Portfolio\`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', \`Explore the professional work portfolio, case studies, and services of \${business.name}.\`);
    
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);

    const ogTags = [
      { property: 'og:title', content: \`\${business.name} | Professional Portfolio\` },
      { property: 'og:description', content: \`Portfolio and case studies of \${business.name}\` },
      { property: 'og:url', content: window.location.href },
      { property: 'og:type', content: 'portfolio' }
    ];
    
    ogTags.forEach(tag => {
      let el = document.querySelector(\`meta[property="\${tag.property}"]\`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', tag.property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', tag.content);
    });
`;
    code = code.replace(/document\.title = `\$\{business\.name\} \| Professional Portfolio`;[\s\S]*?metaDesc\.setAttribute\('content', `Explore the professional work portfolio, case studies, and services of \$\{business\.name\}\.`\);\s*\}/g, newSeo);
  }
  
  fs.writeFileSync(filePath, code);
}

injectAdvancedSEO('src/components/storefront/StorefrontView.tsx', 'store');
injectAdvancedSEO('src/components/biolink/BioProfileView.tsx', 'bio');
injectAdvancedSEO('src/components/storefront/PortfolioShowcase.tsx', 'portfolio');

console.log('patched advanced SEO');
