const fs = require('fs');
let code = fs.readFileSync('src/components/storefront/PortfolioShowcase.tsx', 'utf8');

const oldUseEffect = `  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        setIsLoading(true);`;

const newUseEffect = `  useEffect(() => {
    // 1. Update SEO Meta Data
    document.title = \`\${business.name} | Professional Portfolio\`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', \`Explore the professional work portfolio, case studies, and services of \${business.name}.\`);
    }

    const fetchPublicData = async () => {
      try {
        setIsLoading(true);`;

code = code.replace(oldUseEffect, newUseEffect);
fs.writeFileSync('src/components/storefront/PortfolioShowcase.tsx', code);
console.log('patched PortfolioShowcase SEO');
