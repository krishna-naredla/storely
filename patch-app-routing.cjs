const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update parseStoreSlugFromUrl
const oldParse = `function parseStoreSlugFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Check query parameter e.g. ?store=myshop or ?store=nmk-restent
  const urlParams = new URLSearchParams(window.location.search);
  const storeParam = urlParams.get('store');
  if (storeParam && storeParam.trim()) {
    return storeParam.trim();
  }

  // 2. Check path e.g. /@username or /store/myshop/
  const pathname = window.location.pathname;
  
  const bioMatch = pathname.match(/^\\/@([^/?#]+)/i);
  if (bioMatch && bioMatch[1]) {
    return decodeURIComponent(bioMatch[1]).trim();
  }

  const match = pathname.match(/^\\/store\\/([^/?#]+)/i);
  if (match && match[1]) {
    return decodeURIComponent(match[1]).trim();
  }

  return null;
}`;

const newParse = `function parseStoreSlugFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  const pathname = window.location.pathname;
  
  const bioMatch = pathname.match(/^\\/@([^/?#]+)/i);
  if (bioMatch && bioMatch[1]) {
    return decodeURIComponent(bioMatch[1]).trim();
  }
  
  const portMatch = pathname.match(/^\\/portfolio\\/([^/?#]+)/i);
  if (portMatch && portMatch[1]) {
    return decodeURIComponent(portMatch[1]).trim();
  }

  const match = pathname.match(/^\\/store\\/([^/?#]+)/i);
  if (match && match[1]) {
    return decodeURIComponent(match[1]).trim();
  }

  const urlParams = new URLSearchParams(window.location.search);
  const storeParam = urlParams.get('store');
  if (storeParam && storeParam.trim()) {
    return storeParam.trim();
  }

  return null;
}`;

code = code.replace(oldParse, newParse);

// Update ROUTE 1 handling
const oldRoute1 = `      // Check if it's a bio link
      const pathname = window.location.pathname;
      const isBioLink = pathname.startsWith('/@');
      if (isBioLink) {
        return (
          <BioProfileView
            business={targetBusiness}
            onBackToDashboard={isOwner ? navigateToDashboard : undefined}
          />
        );
      }

      return (
        <StorefrontView
          business={targetBusiness}
          onBackToDashboard={isOwner ? navigateToDashboard : undefined}
          onOpenDigitalCard={() => {
            setSelectedBusiness(targetBusiness);
            setIsShareModalOpen(true);
          }}
        />
      );`;

const newRoute1 = `      // Check if it's a bio link or portfolio
      const pathname = window.location.pathname;
      const isBioLink = pathname.startsWith('/@');
      const isPortfolio = pathname.startsWith('/portfolio');
      
      if (isBioLink) {
        return (
          <BioProfileView
            business={targetBusiness}
            onBackToDashboard={isOwner ? navigateToDashboard : undefined}
          />
        );
      }

      if (isPortfolio) {
        return (
          <div className="bg-slate-50 min-h-screen">
            {isOwner && (
              <div className="bg-slate-900 text-white p-3 flex justify-between items-center z-50 relative sticky top-0">
                <span className="text-xs font-bold">Previewing your Portfolio</span>
                <button onClick={navigateToDashboard} className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition">
                  Back to Dashboard
                </button>
              </div>
            )}
            <PortfolioShowcase
              business={targetBusiness}
            />
          </div>
        );
      }

      return (
        <StorefrontView
          business={targetBusiness}
          onBackToDashboard={isOwner ? navigateToDashboard : undefined}
          onOpenDigitalCard={() => {
            setSelectedBusiness(targetBusiness);
            setIsShareModalOpen(true);
          }}
        />
      );`;

code = code.replace(oldRoute1, newRoute1);
fs.writeFileSync('src/App.tsx', code);
console.log('patched App.tsx routing');
