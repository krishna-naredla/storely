const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/WorkPortfolioManager.tsx', 'utf8');

// Add template state
const oldState = `  const [ctaSuccessMessage, setCtaSuccessMessage] = useState(false);`;
const newState = `  const [ctaSuccessMessage, setCtaSuccessMessage] = useState(false);
  const [portfolioTemplate, setPortfolioTemplate] = useState<'default' | 'developer' | 'designer' | 'photographer'>(business.portfolioSettings?.template || 'default');`;

code = code.replace(oldState, newState);

// Add template to settings update
const oldUpdateSettings1 = `      const updatedSettings: PortfolioSettings = {
        ...currentSettings,
        mediaKit: {`;

const newUpdateSettings1 = `      const updatedSettings: PortfolioSettings = {
        ...currentSettings,
        template: portfolioTemplate,
        mediaKit: {`;
code = code.replace(oldUpdateSettings1, newUpdateSettings1);

const oldUpdateSettings2 = `      const updatedSettings: PortfolioSettings = {
        ...currentSettings,
        ctaMode,`;
const newUpdateSettings2 = `      const updatedSettings: PortfolioSettings = {
        ...currentSettings,
        template: portfolioTemplate,
        ctaMode,`;
code = code.replace(oldUpdateSettings2, newUpdateSettings2);

// Add Template selector to the CTA section (renaming it to Settings & CTA)
const oldTabs = `        <button
          onClick={() => setActiveTab('cta')}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer \${
            activeTab === 'cta'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }\`}
        >
          <MousePointerClick className="w-4 h-4" /> Enquiry & CTA
        </button>`;

const newTabs = `        <button
          onClick={() => setActiveTab('cta')}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer \${
            activeTab === 'cta'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }\`}
        >
          <Settings2 className="w-4 h-4" /> Settings & CTA
        </button>`;
code = code.replace(oldTabs, newTabs);

const oldCtaSection = `            <p className="text-xs text-slate-500 mt-0.5">
              Choose how prospective clients convert when viewing your work showcase.
            </p>
          </div>
          <div className="space-y-4">`;

const newCtaSection = `            <p className="text-xs text-slate-500 mt-0.5">
              Choose your portfolio template and how prospective clients convert when viewing your work showcase.
            </p>
          </div>
          
          <div className="space-y-4 pb-6 border-b border-slate-100">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Portfolio Template</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'default', label: 'Default Minimal', desc: 'Clean, standard showcase' },
                { id: 'developer', label: 'Developer', desc: 'Code focused, tech stacks' },
                { id: 'designer', label: 'UI/UX Designer', desc: 'Visual grids, case studies' },
                { id: 'photographer', label: 'Photographer', desc: 'Full-bleed masonry grids' }
              ].map(tpl => (
                <div 
                  key={tpl.id}
                  onClick={() => setPortfolioTemplate(tpl.id as any)}
                  className={\`p-4 rounded-xl border-2 cursor-pointer transition \${portfolioTemplate === tpl.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200 bg-white'}\`}
                >
                  <div className="font-bold text-sm text-slate-900">{tpl.label}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{tpl.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">`;

code = code.replace(oldCtaSection, newCtaSection);

fs.writeFileSync('src/components/dashboard/WorkPortfolioManager.tsx', code);
console.log('patched portfolio manager');
