import fs from 'fs';

let content = fs.readFileSync('src/components/biolink/BioProfileManager.tsx', 'utf8');

// Import getDigitalStoreUrl
content = content.replace(/getBioLinkUrl/g, "getBioLinkUrl, getDigitalStoreUrl");

// Add routing state
content = content.replace(/const \[qrCodeUrl, setQrCodeUrl\] = useState\(''\);/g, `const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  const routingMode = business.bioRouting || 'standalone';
  const standaloneUrl = getBioLinkUrl(business.slug);
  const storefrontUrl = getDigitalStoreUrl(business.slug);
  const publicUrl = routingMode === 'storefront' ? storefrontUrl : standaloneUrl;

  const handleRoutingChange = async (val: 'standalone' | 'storefront' | 'both') => {
    await updateBusinessProfile(business.id, { bioRouting: val });
    window.location.reload(); // Simple way to refresh the parent state and qr code
  };
`);

// Replace the old publicUrl definition
content = content.replace(/const publicUrl = getBioLinkUrl, getDigitalStoreUrl\(business\.slug\);\n/g, "");
content = content.replace(/const publicUrl = getBioLinkUrl\(business\.slug\);\n/g, "");
content = content.replace(/const publicUrl = getBioLinkUrl, getDigitalStoreUrl\(business\.slug\);/g, "");
content = content.replace(/const publicUrl = getBioLinkUrl\(business\.slug\);/g, "");


// Add Routing UI inside the UI, maybe near the top under the header
const routingHtml = `
      {business.modules?.digital_products && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-900">Routing Preference</h3>
          <p className="text-sm text-slate-500">Since you have Digital Products enabled, choose where your Bio Link QR code and share link should point.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleRoutingChange('standalone')}
              className={\`flex-1 p-4 rounded-xl border text-left transition \${routingMode === 'standalone' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-slate-300'}\`}
            >
              <div className="font-bold text-slate-900">Standalone (@{business.slug})</div>
              <div className="text-xs text-slate-500 mt-1">Show a dedicated link-in-bio page.</div>
            </button>
            <button
              onClick={() => handleRoutingChange('storefront')}
              className={\`flex-1 p-4 rounded-xl border text-left transition \${routingMode === 'storefront' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-slate-300'}\`}
            >
              <div className="font-bold text-slate-900">Combined Storefront (/store/{business.slug})</div>
              <div className="text-xs text-slate-500 mt-1">Show bio links as a section within your storefront.</div>
            </button>
            <button
              onClick={() => handleRoutingChange('both')}
              className={\`flex-1 p-4 rounded-xl border text-left transition \${routingMode === 'both' ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-slate-300'}\`}
            >
              <div className="font-bold text-slate-900">Both (Primary: Storefront)</div>
              <div className="text-xs text-slate-500 mt-1">Keep @{business.slug} active, but point QR code to storefront.</div>
            </button>
          </div>
        </div>
      )}
`;

content = content.replace(/<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">/g, routingHtml + '\n      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">');

fs.writeFileSync('src/components/biolink/BioProfileManager.tsx', content);
console.log("Updated BioProfileManager");
