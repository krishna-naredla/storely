const fs = require('fs');
const file = 'src/components/dashboard/CatalogManager.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add isFree state
if (!code.includes('const [isFree, setIsFree] = useState(false);')) {
  code = code.replace(
    "const [productType, setProductType] = useState<'physical' | 'digital_file' | 'consultation_slot'>('digital_file');",
    "const [productType, setProductType] = useState<'physical' | 'digital_file' | 'consultation_slot'>('digital_file');\n  const [isFree, setIsFree] = useState(false);"
  );
}

// 2. Set isFree when opening existing product
code = code.replace(
  "setProductType(item.productType || (business.type === 'digital_creator' ? 'digital_file' : 'physical'));",
  "setProductType(item.productType || (business.type === 'digital_creator' ? 'digital_file' : 'physical'));\n    setIsFree(item.price === 0);"
);
code = code.replace(
  "setProductType(business.type === 'digital_creator' ? 'digital_file' : 'physical');",
  "setProductType(business.type === 'digital_creator' ? 'digital_file' : 'physical');\n    setIsFree(false);"
);

// 3. Ensure price is 0 if isFree
code = code.replace(
  "price: Number(price),",
  "price: isFree ? 0 : Number(price),"
);

// 4. Add UI for Free/Paid selection
const targetUi = `<label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Price ({business.currencySymbol}) *
                        </label>`;

const uiReplacement = `{productType === 'digital_file' && (
                          <div className="flex gap-4 mb-3">
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                              <input type="radio" checked={!isFree} onChange={() => setIsFree(false)} className="accent-indigo-600" />
                              PAID PRODUCT
                            </label>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                              <input type="radio" checked={isFree} onChange={() => setIsFree(true)} className="accent-indigo-600" />
                              FREE PRODUCT
                            </label>
                          </div>
                        )}
                        
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          {isFree ? "Price (Set to 0)" : \`Price (\${business.currencySymbol}) *\`}
                        </label>`;

if (!code.includes('PAID PRODUCT')) {
  code = code.replace(targetUi, uiReplacement);
  
  // Disable price input if free
  code = code.replace(
    `onChange={(e) => setPrice(e.target.value)}`,
    `onChange={(e) => setPrice(e.target.value)}
                          disabled={isFree}`
  );
  code = code.replace(
    `value={price}`,
    `value={isFree ? 0 : price}`
  );
}

fs.writeFileSync(file, code);
