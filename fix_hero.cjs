const fs = require('fs');
const heroFile = 'src/components/landing/sections/HeroSection.tsx';
let heroCode = fs.readFileSync(heroFile, 'utf8');

// Always use landingpage.jpeg regardless of local storage for now to fulfill the prompt
heroCode = heroCode.replace(
  'src={heroConfig.heroImageUrl}',
  'src={"/landingpage.jpeg"}'
);

fs.writeFileSync(heroFile, heroCode);
console.log('Fixed hero image');
