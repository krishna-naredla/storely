import fs from 'fs';
let content = fs.readFileSync('src/components/biolink/BioProfileManager.tsx', 'utf8');

if (!content.includes('DashboardEmptyState')) {
  content = content.replace(/import \{ Loader2, /g, "import { DashboardEmptyState } from '../common/DashboardEmptyState';\nimport { DashboardSkeleton } from '../common/DashboardSkeleton';\nimport { Loader2, ");
}

const loadingRegex = /\{loading \? \([\s\S]*?\) \: links\.length === 0 && !isEditing \? \(/;
content = content.replace(loadingRegex, `{loading ? (
                <div className="py-4">
                  <DashboardSkeleton count={3} type="list" />
                </div>
              ) : links.length === 0 && !isEditing ? (`);

const emptyRegex = /<div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">[\s\S]*?<\/div>\s*\) : \(/;
content = content.replace(emptyRegex, `<DashboardEmptyState
                  icon={LinkIcon}
                  title="No Links Yet"
                  description="Add your first link to start building your bio page."
                  actionLabel="Add New Link"
                  onAction={() => {
                    resetForm();
                    setIsEditing(true);
                  }}
                />
              ) : (`);

fs.writeFileSync('src/components/biolink/BioProfileManager.tsx', content);
console.log("Updated BioProfileManager");
