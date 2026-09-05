import fs from 'fs';
['src/components/dashboard/CustomQuoteManager.tsx', 'src/components/dashboard/WorkPortfolioManager.tsx'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import \{ DashboardEmptyState \} from "..\/common\/DashboardEmptyState";\nimport \{ DashboardSkeleton \} from "..\/common\/DashboardSkeleton";\n/g, "");
  // add it once at top
  content = `import { DashboardEmptyState } from "../common/DashboardEmptyState";\nimport { DashboardSkeleton } from "../common/DashboardSkeleton";\n` + content;
  fs.writeFileSync(file, content);
});
console.log("Fixed duplicates");
