const fs = require('fs');

const file = 'src/components/landing/MasterLandingView.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Replace the Chicken Pickle UI with the image, removing border and shadow
const phoneStart = `<div className="w-full bg-slate-50 border-[6px] border-slate-900 rounded-[2.5rem] p-4 shadow-2xl relative overflow-hidden transform hover:scale-105 transition-transform duration-700">`;
const phoneEnd = `</div>\n                      </div>\n\n                  </div>`;
const startIndex = code.indexOf(phoneStart);
if (startIndex !== -1) {
  // Find the matching end div.
  // Actually, let's just use a regex or string replacement for the exact block.
} else {
  console.log("Could not find phoneStart");
}
