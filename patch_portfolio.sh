sed -i '/\/\* 1\. CREATOR HERO BANNER & PROFILE \*\//,/<div className="max-w-6xl mx-auto/c\
      {/* 1. CREATOR HEADER */}\
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-16 pb-8 sm:pb-12 border-b border-slate-200/60">\
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">\
          <div className="flex items-center gap-5">\
            {business.logo && (\
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-white shadow-md border border-slate-200 shrink-0 overflow-hidden">\
                <img src={business.logo} alt={business.name} className="w-full h-full object-cover rounded-xl" />\
              </div>\
            )}\
            <div>\
              <h1 className="text-2xl sm:text-4xl font-black font-heading tracking-tight">{business.name}</h1>\
              <p className="text-sm sm:text-base opacity-75 mt-1">{headlineText}</p>\
            </div>\
          </div>\
' src/components/portfolio/StandalonePortfolioView.tsx
