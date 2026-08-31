const fs = require('fs');
const file = 'src/components/landing/MasterLandingView.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Increase size for Hero image container
code = code.replace(
  'className="relative w-[clamp(280px,95vw,400px)] lg:w-[clamp(400px,40vw,500px)] mx-auto lg:ml-auto lg:mr-4"',
  'className="relative w-full max-w-[500px] lg:max-w-[800px] lg:w-[125%] xl:w-[140%] mx-auto lg:-mr-10 xl:-mr-20 z-20"'
);

// 2. Add HD rendering to images
code = code.replace(
  '<img src="/landingpage.jpeg" alt="Hero Storefront" className="w-full h-auto object-contain" />',
  '<img src="/landingpage.jpeg" alt="Hero Storefront" className="w-full h-auto object-contain drop-shadow-2xl" style={{ imageRendering: "high-quality", transform: "translateZ(0)", backfaceVisibility: "hidden" }} />'
);

code = code.replace(
  '<img \n                          src="/storelly6.jpg" \n                          alt="Storelly for Vendors" \n                          className="max-w-full h-auto object-contain hover:scale-105 transition-transform duration-700"\n                        />',
  '<img \n                          src="/storelly6.jpg" \n                          alt="Storelly for Vendors" \n                          className="w-full max-w-[120%] lg:max-w-[130%] h-auto object-contain hover:scale-105 transition-transform duration-700 drop-shadow-xl"\n                          style={{ imageRendering: "high-quality", transform: "translateZ(0)", backfaceVisibility: "hidden" }}\n                        />'
);

code = code.replace(
  '<img \n                          src="/creator.jpeg" \n                          alt="Storelly for Creators" \n                          className="max-w-full h-auto object-contain hover:scale-105 transition-transform duration-700"\n                        />',
  '<img \n                          src="/creator.jpeg" \n                          alt="Storelly for Creators" \n                          className="w-full max-w-[120%] lg:max-w-[130%] h-auto object-contain hover:scale-105 transition-transform duration-700 drop-shadow-xl"\n                          style={{ imageRendering: "high-quality", transform: "translateZ(0)", backfaceVisibility: "hidden" }}\n                        />'
);

fs.writeFileSync(file, code);
