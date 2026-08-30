const fs = require('fs');
const file = 'src/components/storefront/StorefrontView.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add state for Digital Checkout
if (!code.includes('selectedItemForDigital')) {
  code = code.replace(
    'const [selectedItemForBooking, setSelectedItemForBooking] = useState<CatalogItem | null>(null);',
    'const [selectedItemForBooking, setSelectedItemForBooking] = useState<CatalogItem | null>(null);\n  const [selectedItemForDigital, setSelectedItemForDigital] = useState<CatalogItem | null>(null);\n  const [digitalPurchaseStatus, setDigitalPurchaseStatus] = useState<"idle" | "processing" | "success" | "error">("idle");\n  const [digitalDownloadUrl, setDigitalDownloadUrl] = useState<string | null>(null);'
  );
}

// 2. Add Razorpay Script loading
if (!code.includes('loadRazorpay')) {
  const rzpCode = `
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleDigitalPurchase = async (item: CatalogItem) => {
    setSelectedItemForDigital(item);
    setDigitalPurchaseStatus("processing");
    setDigitalDownloadUrl(null);
    try {
      if (item.price <= 0) {
        // Free flow
        const res = await fetch("/api/digital/free", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: item.id })
        });
        const data = await res.json();
        if (data.success) {
          setDigitalPurchaseStatus("success");
          setDigitalDownloadUrl(data.downloadUrl);
        } else {
          setDigitalPurchaseStatus("error");
          alert(data.error || "Failed to get free product");
        }
        return;
      }

      // Paid Flow
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        setDigitalPurchaseStatus("error");
        alert("Payment gateway failed to load.");
        return;
      }

      const res = await fetch("/api/digital/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id })
      });
      const order = await res.json();
      if (order.error) {
        setDigitalPurchaseStatus("error");
        alert(order.error);
        return;
      }

      const options = {
        key: 'rzp_test_dummy', // Will be ignored by real Razorpay if order_id is valid, but required.
        amount: order.amount,
        currency: order.currency,
        name: business.name,
        description: item.name,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/digital/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                itemId: item.id
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setDigitalPurchaseStatus("success");
              setDigitalDownloadUrl(verifyData.downloadUrl);
            } else {
              setDigitalPurchaseStatus("error");
              alert(verifyData.error || "Payment verification failed");
            }
          } catch(e) {
            setDigitalPurchaseStatus("error");
          }
        },
        theme: { color: "#10b981" }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () {
        setDigitalPurchaseStatus("error");
      });
      rzp.open();

    } catch (e) {
      setDigitalPurchaseStatus("error");
      console.error(e);
    }
  };
`;
  code = code.replace(
    'const bizMeta = BUSINESS_TYPES[business.type] || BUSINESS_TYPES.retail;',
    `const bizMeta = BUSINESS_TYPES[business.type] || BUSINESS_TYPES.retail;\n\n${rzpCode}`
  );
}

// 3. Update the Product Card logic
const targetLogic = `                        {/* Order / Book Button */}
                        {isBookable ? (
                          <button
                            type="button"
                            onClick={() => setSelectedItemForBooking(item)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                          >
                            Book
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={item.inStock === false}
                            onClick={() => {`;

const newLogic = `                        {/* Order / Book Button */}
                        {isBookable ? (
                          <button
                            type="button"
                            onClick={() => setSelectedItemForBooking(item)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                          >
                            Book
                          </button>
                        ) : item.productType === 'digital_file' ? (
                          <button
                            type="button"
                            onClick={(e) => {
                               e.stopPropagation();
                               handleDigitalPurchase(item);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                          >
                            {item.price === 0 ? 'Get Free' : 'Buy Now'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={item.inStock === false}
                            onClick={(e) => {
                              e.stopPropagation();`;

code = code.replace(targetLogic, newLogic);


// 4. Add the Digital Download Modal JSX
const modalJsx = `
      {/* Digital Download Modal */}
      {selectedItemForDigital && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden text-center">
            <button 
              onClick={() => {
                setSelectedItemForDigital(null);
                setDigitalPurchaseStatus("idle");
              }}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition"
            >
              <Plus className="w-5 h-5 rotate-45" />
            </button>

            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
               {digitalPurchaseStatus === 'processing' && <Sparkles className="w-8 h-8 text-emerald-600 animate-pulse" />}
               {digitalPurchaseStatus === 'success' && <CheckCircle2 className="w-8 h-8 text-emerald-600" />}
               {digitalPurchaseStatus === 'error' && <Plus className="w-8 h-8 text-red-500 rotate-45" />}
               {digitalPurchaseStatus === 'idle' && <Store className="w-8 h-8 text-emerald-600" />}
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {digitalPurchaseStatus === 'processing' && "Processing..."}
              {digitalPurchaseStatus === 'success' && "Success!"}
              {digitalPurchaseStatus === 'error' && "Transaction Failed"}
              {digitalPurchaseStatus === 'idle' && "Starting..."}
            </h3>

            <p className="text-slate-600 text-sm mb-6">
              {digitalPurchaseStatus === 'processing' && "Please complete the payment to access your digital file."}
              {digitalPurchaseStatus === 'success' && "Your digital file is ready for download."}
              {digitalPurchaseStatus === 'error' && "Something went wrong. Please try again."}
            </p>

            {digitalPurchaseStatus === 'success' && digitalDownloadUrl && (
               <a 
                 href={digitalDownloadUrl} 
                 target="_blank" 
                 rel="noreferrer"
                 className="block w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition"
               >
                 Download File
               </a>
            )}
          </div>
        </div>
      )}
`;

if (!code.includes('Digital Download Modal')) {
  code = code.replace('{/* Customer Orders Portal Modal */}', modalJsx + '\n      {/* Customer Orders Portal Modal */}');
}

// 5. Fix isBookable definition
code = code.replace(
  "item.type === 'package';",
  "item.type === 'package' || item.productType === 'consultation_slot';"
);

// 6. Update TS window for Razorpay
if (!code.includes('declare global {')) {
  code = `declare global {
  interface Window {
    Razorpay: any;
  }
}
` + code;
}

fs.writeFileSync(file, code);
