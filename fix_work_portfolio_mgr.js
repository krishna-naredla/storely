import fs from 'fs';
let content = fs.readFileSync('src/components/dashboard/WorkPortfolioManager.tsx', 'utf8');

if (!content.includes('DashboardEmptyState')) {
  content = content.replace(/import \{\s+Plus,/g, "import { DashboardEmptyState } from '../common/DashboardEmptyState';\nimport { DashboardSkeleton } from '../common/DashboardSkeleton';\nimport {\n  Plus,");
}

const loadingRegex = /\{isLoading \? \([\s\S]*?\} \: filteredItems\.length === 0 \? \(/;
content = content.replace(loadingRegex, `{isLoading ? (
            <div className="py-8">
              <DashboardSkeleton count={6} type="card" />
            </div>
          ) : filteredItems.length === 0 ? (`);

const emptyRegex = /<div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-4">[\s\S]*?<\/div>/;

content = content.replace(emptyRegex, `<DashboardEmptyState
              icon={Briefcase}
              title="No portfolio items found"
              description={searchQuery ? 'No items match your search query.' : 'Showcase your best work, case studies, or design mockups to attract potential clients.'}
              actionLabel="Add Portfolio Item"
              onAction={() => handleOpenItemModal()}
            />`);

fs.writeFileSync('src/components/dashboard/WorkPortfolioManager.tsx', content);
console.log("Updated WorkPortfolioManager");
