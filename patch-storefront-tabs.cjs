const fs = require('fs');
let code = fs.readFileSync('src/components/storefront/StorefrontView.tsx', 'utf8');

// Replace the tab buttons wrapper and portfolio tab logic
const tabButtonsRegex = /<div className="flex items-center gap-2 shrink-0">[\s\S]*?<button[\s\S]*?onClick=\{\(\) => setCreatorTab\('portfolio'\)\}[\s\S]*?<\/button>[\s\S]*?<\/div>/;

// Let's just do text replacements for safety
let oldCodeTabs = `            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setCreatorTab('portfolio')}
                className={\`px-4 sm:px-5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer shrink-0 \${
                  creatorTab === 'portfolio'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }\`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Portfolio</span>
              </button>
              <button
                type="button"
                onClick={() => setCreatorTab('store')}
                className={\`px-4 sm:px-5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer shrink-0 \${
                  creatorTab === 'store'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }\`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Store</span>
              </button>
              <button
                type="button"
                onClick={() => setCreatorTab('events')}
                className={\`px-4 sm:px-5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer shrink-0 \${
                  creatorTab === 'events'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }\`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Events</span>
              </button>
            </div>`;

const newCodeTabs = `            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setCreatorTab('store')}
                className={\`px-4 sm:px-5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer shrink-0 \${
                  creatorTab === 'store'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }\`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Store</span>
              </button>
              {events.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCreatorTab('events')}
                  className={\`px-4 sm:px-5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer shrink-0 \${
                    creatorTab === 'events'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }\`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Events</span>
                </button>
              )}
            </div>`;

code = code.replace(oldCodeTabs, newCodeTabs);

// Replace default state
code = code.replace(
  `const [creatorTab, setCreatorTab] = useState<'portfolio' | 'store' | 'events'>(
    business.type === 'creator' ? 'portfolio' : 'store'
  );`,
  `const [creatorTab, setCreatorTab] = useState<'store' | 'events'>('store');`
);

// Remove the portfolio render
const portfolioRenderOld = `      ) : hasPortfolioModule && creatorTab === 'portfolio' ? (
        <PortfolioShowcase
          business={business}
          onBookConsultation={(item) => {
            const target = item || catalogItems.find(i => i.productType === 'consultation_slot' || i.type === 'service') || catalogItems[0];
            if (target) {
              setSelectedItemForBooking(target);
            }
          }}
        />
      ) : hasPortfolioModule && creatorTab === 'events' ? (`;

const portfolioRenderNew = `      ) : hasPortfolioModule && creatorTab === 'events' ? (`;

code = code.replace(portfolioRenderOld, portfolioRenderNew);

fs.writeFileSync('src/components/storefront/StorefrontView.tsx', code);
console.log('patched StorefrontView tabs');
