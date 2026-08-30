const fs = require('fs');

const addHeaderKeys = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('header: {')) {
    const headerEn = `
  header: {
    selectStore: "Select Store",
    myBusinesses: "My Businesses",
    createNewStore: "Create New Store",
    storeLive: "Store Live",
    copied: "Copied",
    copyLink: "Copy Link",
    shareQR: "Share QR & Card",
    visitStore: "Visit Store"
  },`;
    const headerTe = `
  header: {
    selectStore: "స్టోర్‌ను ఎంచుకోండి",
    myBusinesses: "నా వ్యాపారాలు",
    createNewStore: "కొత్త స్టోర్ సృష్టించండి",
    storeLive: "స్టోర్ లైవ్",
    copied: "కాపీ చేయబడింది",
    copyLink: "లింక్ కాపీ చేయండి",
    shareQR: "QR & కార్డ్ షేర్ చేయండి",
    visitStore: "స్టోర్ చూడండి"
  },`;
    const headerHi = `
  header: {
    selectStore: "स्टोर चुनें",
    myBusinesses: "मेरे व्यवसाय",
    createNewStore: "नया स्टोर बनाएं",
    storeLive: "स्टोर लाइव",
    copied: "कॉपी किया गया",
    copyLink: "लिंक कॉपी करें",
    shareQR: "QR और कार्ड साझा करें",
    visitStore: "स्टोर देखें"
  },`;

    const toInject = filePath.includes('en.ts') ? headerEn : (filePath.includes('te.ts') ? headerTe : headerHi);
    content = content.replace('export const ', toInject + '\nexport const ');
    content = content.replace(/export const .*? = {/, `$&${toInject}`);
    
    // clean up duplicate if I messed up replacement
    content = content.replace(new RegExp(toInject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n' + 'export const ', 'g'), 'export const ');
    
    fs.writeFileSync(filePath, content);
  }
};

addHeaderKeys('src/translations/en.ts');
addHeaderKeys('src/translations/te.ts');
addHeaderKeys('src/translations/hi.ts');
