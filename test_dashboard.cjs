const fs = require('fs');
const ts = require('typescript');
const content = fs.readFileSync('src/App.tsx', 'utf8');

// Just check what happens in App.tsx when logged in
const hasDashboard = content.includes('DashboardOverview');
console.log("Has dashboard:", hasDashboard);
