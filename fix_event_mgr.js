import fs from 'fs';
let content = fs.readFileSync('src/components/dashboard/EventManager.tsx', 'utf8');

content = content.replace(/import \{ \n  Plus, /g, "import { DashboardEmptyState } from '../common/DashboardEmptyState';\nimport { DashboardSkeleton } from '../common/DashboardSkeleton';\nimport { \n  Plus, ");
content = content.replace(/import \{\s+Plus,/g, "import { DashboardEmptyState } from '../common/DashboardEmptyState';\nimport { DashboardSkeleton } from '../common/DashboardSkeleton';\nimport {\n  Plus,");

const loadingRegex = /\{loading \? \([\s\S]*?\} \: filteredEvents\.length === 0 \? \(/;
content = content.replace(loadingRegex, `{loading ? (
        <div className="py-8">
          <DashboardSkeleton count={6} type="card" />
        </div>
      ) : filteredEvents.length === 0 ? (`);

const emptyRegex = /<div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-4 shadow-xs">[\s\S]*?<\/div>/;

content = content.replace(emptyRegex, `<DashboardEmptyState
          icon={Calendar}
          title="No events found"
          description={searchQuery ? 'No events match your search query.' : 'Host your first webinar or workshop! Multiple attendees can purchase tickets simultaneously.'}
          actionLabel="Create Masterclass / Event"
          onAction={() => handleOpenCreateModal()}
        />`);

fs.writeFileSync('src/components/dashboard/EventManager.tsx', content);
console.log("Updated EventManager");
