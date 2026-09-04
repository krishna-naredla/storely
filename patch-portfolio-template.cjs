const fs = require('fs');
let code = fs.readFileSync('src/components/storefront/PortfolioShowcase.tsx', 'utf8');

const declaration = `  const ctaText =
    business.portfolioSettings?.customCtaText ||
    (ctaMode === 'booking' ? 'Book a Consultation Slot' : 'Enquire on WhatsApp');`;

const newDeclaration = `  const ctaText =
    business.portfolioSettings?.customCtaText ||
    (ctaMode === 'booking' ? 'Book a Consultation Slot' : 'Enquire on WhatsApp');

  const template = business.portfolioSettings?.template || 'default';
  
  const getContainerClass = () => {
    switch(template) {
      case 'developer': return 'bg-slate-950 text-slate-100 selection:bg-emerald-500 font-mono';
      case 'photographer': return 'bg-white text-slate-900 selection:bg-rose-500';
      case 'designer': return 'bg-[#F9F9F8] text-[#111111] selection:bg-indigo-500 font-sans';
      default: return 'bg-slate-50 text-slate-900 selection:bg-indigo-500';
    }
  };

  const getCardClass = () => {
    switch(template) {
      case 'developer': return 'bg-slate-900 border-slate-800 hover:border-emerald-500/50';
      case 'photographer': return 'bg-white border-transparent hover:shadow-2xl';
      case 'designer': return 'bg-white border-slate-200 hover:shadow-xl rounded-3xl';
      default: return 'bg-white border-slate-200/60 hover:border-slate-300';
    }
  };
`;

code = code.replace(declaration, newDeclaration);

// Inject into the main wrapper
code = code.replace(
  `<div className="min-h-screen bg-slate-50 text-slate-900 pb-24 selection:bg-indigo-500 selection:text-white">`,
  `<div className={\`min-h-screen pb-24 \${getContainerClass()}\`}>`
);

// Inject into grid items
code = code.replace(
  `            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group bg-white rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 cursor-pointer flex flex-col"
            >`,
  `            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={\`group rounded-3xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col \${getCardClass()}\`}
            >`
);

fs.writeFileSync('src/components/storefront/PortfolioShowcase.tsx', code);
console.log('patched portfolio templates');
