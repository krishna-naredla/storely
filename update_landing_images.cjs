const fs = require('fs');

// Update HeroSection
const heroFile = 'src/components/landing/sections/HeroSection.tsx';
let heroCode = fs.readFileSync(heroFile, 'utf8');
heroCode = heroCode.replace('heroImageUrl: "/storelly6.jpg.jpeg"', 'heroImageUrl: "/landingpage.jpeg"');
fs.writeFileSync(heroFile, heroCode);

// Update MasterLandingView
const masterFile = 'src/components/landing/MasterLandingView.tsx';
let masterCode = fs.readFileSync(masterFile, 'utf8');
masterCode = masterCode.replace('src="/creator.jpeg"', 'src="/creatorlink.jpeg"');
fs.writeFileSync(masterFile, masterCode);

console.log('Images updated.');
