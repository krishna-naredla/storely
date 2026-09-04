import fs from 'fs';

let view = fs.readFileSync('src/components/biolink/BioProfileView.tsx', 'utf8');
view = view.split('link.url.match(/^https?:\\\\/\\\\//i)').join("link.url.startsWith('http')");
view = view.split('!/^https?:\\\\/\\\\//i.test(finalUrl)').join("!finalUrl.startsWith('http')");
fs.writeFileSync('src/components/biolink/BioProfileView.tsx', view);

let manager = fs.readFileSync('src/components/biolink/BioProfileManager.tsx', 'utf8');
manager = manager.split('!/^https?:\\\\/\\\\//i.test(safeUrl)').join("!safeUrl.startsWith('http')");
fs.writeFileSync('src/components/biolink/BioProfileManager.tsx', manager);
console.log("Fixed");
