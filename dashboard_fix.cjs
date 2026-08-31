const fs = require('fs');

let content = fs.readFileSync('src/components/dashboard/DashboardOverview.tsx', 'utf8');

// Replace {storeUrl} with {displayUrl}
content = content.replace(/{storeUrl}/g, '{displayUrl}');
// But wait, there are places where storeUrl is in string literal like `... ${storeUrl}` so let's only replace the JSX one:
// Let's replace: <div className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-xs text-xs font-mono text-emerald-800 truncate border border-emerald-200 shadow-xs max-w-sm sm:max-w-md font-bold">\n                {storeUrl}\n              </div>
// Wait, the regex replace is easier.

content = content.replace(
    /<div className="px-3 py-1.5([^>]+)>\s*\{storeUrl\}\s*<\/div>/g,
    '<div className="px-3 py-1.5$1>\n                {displayUrl}\n              </div>'
);

// We want to add SafeImage support
content = content.replace(/<img\s+src=\{business.logo\}[^>]*\/>/g, (match) => {
    return match.replace('<img', '<SafeImage fallbackType="avatar"');
});

content = content.replace(/import \{ DashboardTab \} from '.\/Sidebar';/, "import { DashboardTab } from './Sidebar';\nimport { SafeImage } from '../common/SafeImage';");

fs.writeFileSync('src/components/dashboard/DashboardOverview.tsx', content);
