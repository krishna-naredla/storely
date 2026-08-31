const fs = require('fs');

let content = fs.readFileSync('src/services/businessConfig.ts', 'utf8');

content = content.replace(/id: 'digital_creator',([\s\S]*?)defaultModules: \{([\s\S]*?)\}/, (match, p1, p2) => {
    if (!p2.includes('digital_products')) {
        return `id: 'digital_creator',${p1}defaultModules: {${p2}      digital_products: true,\n}`;
    }
    return match;
});

content = content.replace(/id: 'education',([\s\S]*?)defaultModules: \{([\s\S]*?)\}/, (match, p1, p2) => {
    if (!p2.includes('digital_products')) {
        return `id: 'education',${p1}defaultModules: {${p2}      digital_products: true,\n}`;
    }
    return match;
});

fs.writeFileSync('src/services/businessConfig.ts', content);
