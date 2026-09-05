import fs from 'fs';

let content = fs.readFileSync('src/components/storefront/StorefrontView.tsx', 'utf8');

content = content.replace(/import \{ EventsShowcase \} from '\.\/EventsShowcase';/g, "import { EventsShowcase } from './EventsShowcase';\nimport { BioLinksShowcase } from './BioLinksShowcase';");

// Replace the creator view switcher entirely
const switcherRegex = /\{\/\* Creator View Switcher \(Portfolio vs Store Catalog vs Events\) \*\/\}[\s\S]*?\{\/\* Main Store Content Area \/ Maintenance Mode View \*\/\}/;

content = content.replace(switcherRegex, `{/* Main Store Content Area / Maintenance Mode View */}`);

// We also need to remove `creatorTab === 'events' ? ...` logic from the rendering flow.
// Currently it is:
// ) : hasPortfolioModule && creatorTab === 'events' ? (
//  <main ... events ... </main>
// ) : (
//  <main ... 
// Let's replace the whole structure.

const mainViewRegex = /\) : hasPortfolioModule && creatorTab === 'events' \? \([\s\S]*?\) : \(/;
content = content.replace(mainViewRegex, ") : (");

// Now we are inside the main view. We need to inject BioLinks, Portfolio, Events in a sensible order.
// Let's find: {/* Active Promotional Offers Ribbon */}
// and insert Bio Links above it.

const offersRegex = /\{\/\* Active Promotional Offers Ribbon \*\/\}/;
content = content.replace(offersRegex, `
        {/* Bio Link Buttons */}
        {(business.modules?.universal_links) && (
           <BioLinksShowcase links={bioLinks} business={business} />
        )}
        
        {/* Active Promotional Offers Ribbon */}`);

// Now we need to append Portfolio and Events below the Catalog sections.
// Let's find: {/* Testimonials Section */}
// and inject Portfolio and Events above it.

const testimonialsRegex = /\{\/\* Testimonials Section \*\/\}/;
content = content.replace(testimonialsRegex, `
        {/* Portfolio gallery */}
        {(business.modules?.portfolio || business.modules?.work_portfolio) && (
           <div className="pt-8">
             <PortfolioShowcase business={business} />
           </div>
        )}

        {/* Events */}
        {business.modules?.events_ticketing && events.length > 0 && (
           <div className="pt-8">
             <EventsShowcase events={events} business={business} />
           </div>
        )}

        {/* Testimonials Section */}`);

// And we can remove `hasPortfolioModule` and `creatorTab` state definitions from the top since they are not used.
content = content.replace(/const hasPortfolioModule =[\s\S]*?const \[creatorTab, setCreatorTab\] = useState<'store' \| 'events'>\('store'\);/, "");


fs.writeFileSync('src/components/storefront/StorefrontView.tsx', content);
console.log("Rewrote StorefrontView structure");
