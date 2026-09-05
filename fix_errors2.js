import fs from 'fs';

let service = fs.readFileSync('src/services/firebaseService.ts', 'utf8');

service = service.replace(/console\.error\(\s*["']Error fetching bio links:["']\s*,\s*error\s*\);/g, "console.error('Error fetching bio links:', error?.message || error, error);");
service = service.replace(/console\.error\(\s*["']Error fetching portfolio items:["']\s*,\s*err\s*\);/g, "console.error('Error fetching portfolio items:', err?.message || err, err);");
service = service.replace(/console\.error\(\s*["']Error fetching testimonials:["']\s*,\s*err\s*\);/g, "console.error('Error fetching testimonials:', err?.message || err, err);");
service = service.replace(/console\.error\(\s*["']Error fetching event tickets:["']\s*,\s*err\s*\);/g, "console.error('Error fetching event tickets:', err?.message || err, err);");

fs.writeFileSync('src/services/firebaseService.ts', service);
console.log("Updated error logging 2");
