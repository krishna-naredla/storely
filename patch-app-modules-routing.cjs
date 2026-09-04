const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldRoutingBlock = `      // Check if it's a bio link
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
          onOpenDigitalCard={() => setIsShareModalOpen(true)}
        />
      );`;

const newRoutingBlock = `      // Check if it's a bio link or portfolio
      const pathname = window.location.pathname;
      const isBioLink = pathname.startsWith('/@');
      const isPortfolio = pathname.startsWith('/portfolio');
      const isStore = pathname.startsWith('/store') || window.location.search.includes('store=');
      
      const modules = targetBusiness.modules || {};
      const isCreator = targetBusiness.type === 'creator';
      
      const NotFoundMessage = ({ title, moduleName }: { title: string, moduleName: string }) => (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <h1 className="text-2xl font-black text-white">{title}</h1>
            <p className="text-sm text-slate-400">
              The {moduleName} module is currently unavailable or disabled by the creator.
            </p>
            {isOwner && (
              <button
                onClick={navigateToDashboard}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm"
              >
                Back to Dashboard to Enable
              </button>
            )}
          </div>
        </div>
      );

      if (isBioLink) {
        if (isCreator && !modules.universal_links && !isOwner) {
          return <NotFoundMessage title="Bio Link Unavailable" moduleName="Universal Bio Link" />;
        }
        return (
          <BioProfileView
            business={targetBusiness}
            onBackToDashboard={isOwner ? navigateToDashboard : undefined}
          />
        );
      }

      if (isPortfolio) {
        if (isCreator && !modules.work_portfolio && !modules.portfolio && !isOwner) {
          return <NotFoundMessage title="Portfolio Unavailable" moduleName="Professional Portfolio" />;
        }
        return (
          <div className="bg-slate-50 min-h-screen">
            {isOwner && (
              <div className="bg-slate-900 text-white p-3 flex justify-between items-center z-50 sticky top-0">
                <span className="text-xs font-bold">Previewing your Portfolio</span>
                <button onClick={navigateToDashboard} className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition">
                  Back to Dashboard
                </button>
              </div>
            )}
            <PortfolioShowcase business={targetBusiness} />
          </div>
        );
      }

      // Default to Storefront
      if (isCreator && !modules.digital_products && !modules.digitalProducts && !isOwner) {
         return <NotFoundMessage title="Store Unavailable" moduleName="Digital Store" />;
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

code = code.replace(oldRoutingBlock, newRoutingBlock);

fs.writeFileSync('src/App.tsx', code);
console.log('patched App.tsx routing');
