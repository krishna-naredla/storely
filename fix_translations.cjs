const fs = require('fs');

const en = 'src/translations/en.ts';
let codeEn = fs.readFileSync(en, 'utf8');
if (!codeEn.includes('digitalCommerce')) {
  codeEn = codeEn.replace('export const en = {', 'export const en = {\n  digitalCommerce: {\n    buyNow: "Buy Now",\n    addToCart: "Add to Cart",\n    getFree: "Get Free",\n    download: "Download",\n    paymentSuccessful: "Payment Successful",\n    downloadReady: "Download Ready",\n    alreadyPurchased: "Already Purchased",\n    paymentFailed: "Payment Failed",\n    bookNow: "Book Now",\n    digitalProduct: "Digital Product",\n    processing: "Processing..."\n  },');
  fs.writeFileSync(en, codeEn);
}

const hi = 'src/translations/hi.ts';
let codeHi = fs.readFileSync(hi, 'utf8');
if (!codeHi.includes('digitalCommerce')) {
  codeHi = codeHi.replace('export const hi = {', 'export const hi = {\n  digitalCommerce: {\n    buyNow: "अभी खरीदें",\n    addToCart: "कार्ट में जोड़ें",\n    getFree: "मुफ़्त पाएं",\n    download: "डाउनलोड",\n    paymentSuccessful: "भुगतान सफल",\n    downloadReady: "डाउनलोड तैयार है",\n    alreadyPurchased: "पहले से खरीदा हुआ",\n    paymentFailed: "भुगतान विफल",\n    bookNow: "अभी बुक करें",\n    digitalProduct: "डिजिटल उत्पाद",\n    processing: "प्रसंस्करण..."\n  },');
  fs.writeFileSync(hi, codeHi);
}

const te = 'src/translations/te.ts';
let codeTe = fs.readFileSync(te, 'utf8');
if (!codeTe.includes('digitalCommerce')) {
  codeTe = codeTe.replace('export const te = {', 'export const te = {\n  digitalCommerce: {\n    buyNow: "ఇప్పుడే కొనండి",\n    addToCart: "కార్ట్‌కు జోడించండి",\n    getFree: "ఉచితంగా పొందండి",\n    download: "డౌన్‌లోడ్",\n    paymentSuccessful: "చెల్లింపు విజయవంతమైంది",\n    downloadReady: "డౌన్‌లోడ్ సిద్ధంగా ఉంది",\n    alreadyPurchased: "ఇప్పటికే కొనుగోలు చేశారు",\n    paymentFailed: "చెల్లింపు విఫలమైంది",\n    bookNow: "ఇప్పుడే బుక్ చేయండి",\n    digitalProduct: "డిజిటల్ ఉత్పత్తి",\n    processing: "ప్రాసెస్ అవుతోంది..."\n  },');
  fs.writeFileSync(te, codeTe);
}

