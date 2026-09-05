import fs from 'fs';
let content = fs.readFileSync('src/components/dashboard/CustomQuoteManager.tsx', 'utf8');

if (!content.includes('DashboardEmptyState')) {
  content = content.replace(/import \{ \n  FileText,/g, "import { DashboardEmptyState } from '../common/DashboardEmptyState';\nimport { DashboardSkeleton } from '../common/DashboardSkeleton';\nimport { \n  FileText,");
}

const loadingRegex = /\{loading \? \([\s\S]*?\) \: filteredRequests\.length === 0 \? \(/;
content = content.replace(loadingRegex, `{loading ? (
        <div className="py-8">
          <DashboardSkeleton count={6} type="list" />
        </div>
      ) : filteredRequests.length === 0 ? (`);

const emptyRegex = /<div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3 shadow-xs">[\s\S]*?<\/div>/;

content = content.replace(emptyRegex, `<DashboardEmptyState
          icon={FileText}
          title="No commission inquiries"
          description={searchQuery ? 'No requests match your search query.' : 'You have no custom quote requests matching this filter.'}
        />`);

fs.writeFileSync('src/components/dashboard/CustomQuoteManager.tsx', content);
console.log("Updated CustomQuoteManager");
