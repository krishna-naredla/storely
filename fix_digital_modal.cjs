const fs = require('fs');
let code = fs.readFileSync('src/components/storefront/StorefrontView.tsx', 'utf8');

const modalCode = `
      {/* Digital Purchase Status Modal */}
      {selectedItemForDigital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <button 
              onClick={() => setSelectedItemForDigital(null)} 
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            {digitalPurchaseStatus === 'processing' && (
              <div className="py-6 space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
                <h3 className="text-xl font-bold text-slate-900">Processing Request...</h3>
                <p className="text-sm text-slate-500">Please wait while we prepare your digital file.</p>
              </div>
            )}
            
            {digitalPurchaseStatus === 'success' && (
              <div className="py-6 space-y-6">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-4 border-white shadow-xl">
                  <Check className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 font-heading">Success!</h3>
                  <p className="text-sm text-slate-600 mt-2">Your file is ready to download.</p>
                </div>
                {digitalDownloadUrl && (
                  <a 
                    href={digitalDownloadUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download File Now</span>
                  </a>
                )}
              </div>
            )}
            
            {digitalPurchaseStatus === 'error' && (
              <div className="py-6 space-y-6">
                <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto border-4 border-white shadow-xl">
                  <X className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Payment Failed</h3>
                  <p className="text-sm text-slate-600 mt-2">There was an issue processing your request.</p>
                </div>
                <button 
                  onClick={() => setSelectedItemForDigital(null)}
                  className="w-full py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
`;

code = code.replace('{/* Write Review Modal */}', modalCode + '\n      {/* Write Review Modal */}');
if (!code.includes('Download }')) {
   code = code.replace('import { ', 'import { Download, ');
}
fs.writeFileSync('src/components/storefront/StorefrontView.tsx', code);
