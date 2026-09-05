import fs from 'fs';
let content = fs.readFileSync('src/components/dashboard/CatalogManager.tsx', 'utf8');

content = content.replace(/import \{ \n  Plus, /g, "import { DashboardEmptyState } from '../common/DashboardEmptyState';\nimport { DashboardSkeleton } from '../common/DashboardSkeleton';\nimport { \n  Plus, ");
content = content.replace(/import \{\s+Plus,/g, "import { DashboardEmptyState } from '../common/DashboardEmptyState';\nimport { DashboardSkeleton } from '../common/DashboardSkeleton';\nimport {\n  Plus,");

const loadingRegex = /\{isLoading \? \([\s\S]*?\} \: filteredItems\.length > 0 \? \(/;
content = content.replace(loadingRegex, `{isLoading ? (
        <div className="py-8">
          <DashboardSkeleton count={6} type="card" />
        </div>
      ) : filteredItems.length > 0 ? (`);

const emptyRegex = /\) : \(\n\s*<div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">\n\s*<p className="text-sm font-semibold text-slate-700">No products found<\/p>\n\s*<p className="text-xs text-slate-400 mt-1">Click Add New Product above to create your first offering\.<\/p>\n\s*<\/div>\n\s*\)\}/;

content = content.replace(emptyRegex, `) : (
        <DashboardEmptyState
          icon={PackageOpen}
          title="No products found"
          description={searchQuery ? "No products match your search query." : "You haven't added any products or services yet. Create your first offering to start selling!"}
          actionLabel="Add New Product"
          onAction={openCreateModal}
        />
      )}`);
      
content = content.replace(/<PackageOpen className="w-4 h-4" \/>/, ""); // wait, PackageOpen import?
// Check if PackageOpen is imported, if not, add it.

fs.writeFileSync('src/components/dashboard/CatalogManager.tsx', content);
console.log("Updated CatalogManager");
