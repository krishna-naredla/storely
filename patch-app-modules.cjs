const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "import { ModuleManager } from './components/dashboard/ModuleManager';",
  "import { ModuleManager } from './components/dashboard/ModuleManager';\nimport { CreatorModulesManager } from './components/dashboard/CreatorModulesManager';"
);

const oldModulesRender = `{activeTab === 'modules' && (
            <ModuleManager
              business={biz}
              onBusinessUpdated={(updated) => {
                setSelectedBusiness(updated);
                setBusinesses((prev) =>
                  prev.map((b) => (b.id === updated.id ? updated : b))
                );
              }}
            />
          )}`;

const newModulesRender = `{activeTab === 'modules' && biz.type === 'creator' ? (
            <CreatorModulesManager
              business={biz}
              onBusinessUpdated={(updated) => {
                setSelectedBusiness(updated);
                setBusinesses((prev) =>
                  prev.map((b) => (b.id === updated.id ? updated : b))
                );
              }}
            />
          ) : activeTab === 'modules' && (
            <ModuleManager
              business={biz}
              onBusinessUpdated={(updated) => {
                setSelectedBusiness(updated);
                setBusinesses((prev) =>
                  prev.map((b) => (b.id === updated.id ? updated : b))
                );
              }}
            />
          )}`;

code = code.replace(oldModulesRender, newModulesRender);

fs.writeFileSync('src/App.tsx', code);
console.log('patched App modules rendering');
