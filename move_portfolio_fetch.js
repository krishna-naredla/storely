import fs from 'fs';
let storeContent = fs.readFileSync('src/components/storefront/StorefrontView.tsx', 'utf8');

storeContent = storeContent.replace(/getBioLinks, recordBioLinkClick,/g, "getBioLinks, recordBioLinkClick, getPortfolioItems, getTestimonials,");

storeContent = storeContent.replace(/const \[bioLinks, setBioLinks\] = useState<any\[\]>\(\[\]\);/, "const [bioLinks, setBioLinks] = useState<any[]>([]);\n  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);\n  const [testimonials, setTestimonials] = useState<any[]>([]);");

storeContent = storeContent.replace(/fetchedBioLinks\] = await Promise.all\(\[/, "fetchedBioLinks, fetchedPortfolioItems, fetchedTestimonials] = await Promise.all([");

storeContent = storeContent.replace(/getBioLinks\(business\.id\) as Promise<any\[\]>,/, "getBioLinks(business.id) as Promise<any[]>,\n        getPortfolioItems(business.id, true),\n        getTestimonials(business.id, true),");

storeContent = storeContent.replace(/setBioLinks\(fetchedBioLinks\.filter\(l => l\.enabled\)\.sort\(\(a,b\) => \(a\.order \|\| 0\) - \(b\.order \|\| 0\)\)\);/, "setBioLinks(fetchedBioLinks.filter(l => l.enabled).sort((a,b) => (a.order || 0) - (b.order || 0)));\n      setPortfolioItems(fetchedPortfolioItems);\n      setTestimonials(fetchedTestimonials);");

storeContent = storeContent.replace(/bioLinks: fetchedBioLinks\.filter\(l => l\.enabled\)\.sort\(\(a,b\) => \(a\.order \|\| 0\) - \(b\.order \|\| 0\)\),/, "bioLinks: fetchedBioLinks.filter(l => l.enabled).sort((a,b) => (a.order || 0) - (b.order || 0)),\n          portfolioItems: fetchedPortfolioItems,\n          testimonials: fetchedTestimonials,");

storeContent = storeContent.replace(/setBioLinks\(parsed\.bioLinks \|\| \[\]\);/, "setBioLinks(parsed.bioLinks || []);\n        setPortfolioItems(parsed.portfolioItems || []);\n        setTestimonials(parsed.testimonials || []);");

// Update JSX
storeContent = storeContent.replace(/<PortfolioShowcase business=\{business\} \/>/g, "<PortfolioShowcase business={business} items={portfolioItems} testimonials={testimonials} />");
storeContent = storeContent.replace(/\{\(business\.modules\?\.portfolio \|\| business\.modules\?\.work_portfolio\) && \(/g, "{(business.modules?.portfolio || business.modules?.work_portfolio) && (portfolioItems.length > 0 || testimonials.length > 0 || business.mediaKit?.enabled) && (");


fs.writeFileSync('src/components/storefront/StorefrontView.tsx', storeContent);


let portContent = fs.readFileSync('src/components/storefront/PortfolioShowcase.tsx', 'utf8');

portContent = portContent.replace(/interface PortfolioShowcaseProps \{/, "interface PortfolioShowcaseProps {\n  items?: PortfolioItem[];\n  testimonials?: Testimonial[];");
portContent = portContent.replace(/business,\n  onBookConsultation,/, "business,\n  items: passedItems,\n  testimonials: passedTestimonials,\n  onBookConsultation,");
portContent = portContent.replace(/const \[items, setItems\] = useState<PortfolioItem\[\]>\(\[\]\);/, "const [items, setItems] = useState<PortfolioItem[]>(passedItems || []);");
portContent = portContent.replace(/const \[testimonials, setTestimonials\] = useState<Testimonial\[\]>\(\[\]\);/, "const [testimonials, setTestimonials] = useState<Testimonial[]>(passedTestimonials || []);");

// Remove data fetching from PortfolioShowcase if passed
const fetchRegex = /useEffect\(\(\) => \{\n    const loadPublicData[\s\S]*?loadPublicData\(\);\n  \}, \[business\.id\]\);/g;
portContent = portContent.replace(fetchRegex, `useEffect(() => {
    if (passedItems) setItems(passedItems);
    if (passedTestimonials) setTestimonials(passedTestimonials);
  }, [passedItems, passedTestimonials]);`);

fs.writeFileSync('src/components/storefront/PortfolioShowcase.tsx', portContent);

console.log("Moved data fetching up to StorefrontView");
