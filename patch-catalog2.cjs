const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/CatalogManager.tsx', 'utf8');

const oldCode = `    <div className="space-y-6">
      {/* Top Tab Bar when Digital Products module or Creator type is enabled */}
      {(isDigitalCreator || business.modules?.digital_products || business.modules?.digitalProducts) && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveCatalogTab('digital')}
            className={\`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer \${
              activeCatalogTab === 'digital'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }\`}
          >
            <FileText className="w-4 h-4" /> Digital Products & Courses
          </button>
          <button
            onClick={() => setActiveCatalogTab('standard')}
            className={\`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer \${
              activeCatalogTab === 'standard'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }\`}
          >
            <Package className="w-4 h-4" /> Standard Catalog & 1:1 Services
          </button>
        </div>
      )}

      {/* Render Digital Products Manager when active */}
      {activeCatalogTab === 'digital' && (isDigitalCreator || business.modules?.digital_products || business.modules?.digitalProducts) ? (
        <DigitalProductsManager businessId={business.id} businessName={business.name} />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">`;

const newCode = `    <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">`;

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync('src/components/dashboard/CatalogManager.tsx', code);
  console.log('patched CatalogManager tab rendering');
} else {
  console.log('could not find oldCode in CatalogManager');
}

// Remove DigitalFileItem import
code = code.replace("DigitalFileItem,", "");
code = code.replace("DigitalFileItem", "");
fs.writeFileSync('src/components/dashboard/CatalogManager.tsx', code);

