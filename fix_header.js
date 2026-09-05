import fs from 'fs';
let content = fs.readFileSync('src/components/storefront/StorefrontView.tsx', 'utf8');

const replacement = `            <div className="w-full h-full bg-linear-to-r from-emerald-900 to-teal-900 opacity-90" />
          )}
        </div>
        
        {/* Profile Info Card */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 -mt-12 sm:-mt-16 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
            {/* Logo */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-2xl sm:rounded-3xl shadow-xl border-4 border-white overflow-hidden flex items-center justify-center relative z-20">
                {business.logo || business.profileImage ? (
                  <img src={business.logo || business.profileImage} alt={business.name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-10 h-10 sm:w-14 sm:h-14 text-emerald-600/40" />
                )}
              </div>
            </div>
            
            {/* Core Info */}
            <div className="flex-1 space-y-1 sm:pb-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading truncate">{business.name}</h1>
                <VerifiedBadge />
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 font-medium">
                {business.category && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>{business.category}</span>
                  </span>
                )}
                {business.city && (
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-4 h-4" />
                    <span>{business.city}, {business.state}</span>
                  </span>
                )}
              </div>
              
              {(business.tagline || business.description || business.bio) && (
                <p className="text-sm text-slate-600 mt-2 max-w-2xl line-clamp-2 leading-relaxed">
                  {business.tagline || business.bio || business.description}
                </p>
              )}
            </div>
            
            {/* Quick Actions (Share/Social) */}
            <div className="flex items-center gap-2 shrink-0 sm:pb-2">
              <button onClick={handleShareStore} className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition tooltip-trigger group relative">
                <Share2 className="w-4 h-4" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">Share</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-8">`;

content = content.replace(/<main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-8">/, replacement);

fs.writeFileSync('src/components/storefront/StorefrontView.tsx', content);
console.log("Fixed header");
