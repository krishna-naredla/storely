const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');

const oldSettings = `export interface PortfolioSettings {
  ctaMode: 'whatsapp' | 'booking' | 'custom_quote'; // Enquiry mode`;

const newSettings = `export interface PortfolioSettings {
  template?: 'default' | 'developer' | 'designer' | 'photographer';
  ctaMode: 'whatsapp' | 'booking' | 'custom_quote'; // Enquiry mode`;

code = code.replace(oldSettings, newSettings);

fs.writeFileSync('src/types/index.ts', code);
console.log('patched types');
