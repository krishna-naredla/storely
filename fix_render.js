import fs from 'fs';
let storeContent = fs.readFileSync('src/components/storefront/StorefrontView.tsx', 'utf8');

const regex = /\{\(business\.modules\?\.portfolio \|\| business\.modules\?\.work_portfolio\) && \(portfolioItems\.length > 0 \|\| testimonials\.length > 0 \|\| business\.mediaKit\?\.enabled\) && \(/;

const replacement = `
        {/* Portfolio gallery */}
        {(business.modules?.portfolio || business.modules?.work_portfolio) && (portfolioItems.length > 0 || testimonials.length > 0 || (business.portfolioSettings?.mediaKit?.enabled !== false && (business.portfolioSettings?.mediaKit?.platformStats?.length > 0 || business.portfolioSettings?.mediaKit?.brandCollabs?.length > 0))) && (
`;

storeContent = storeContent.replace(/\{\/\* Portfolio gallery \*\/\}\n[\s\S]*?\{\(business\.modules\?\.portfolio \|\| business\.modules\?\.work_portfolio\) && \(portfolioItems\.length > 0 \|\| testimonials\.length > 0 \|\| business\.mediaKit\?\.enabled\) && \(/, replacement);

fs.writeFileSync('src/components/storefront/StorefrontView.tsx', storeContent);
console.log("Fixed conditional render");
