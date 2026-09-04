import React, { useState } from 'react';
import { ShoppingBag, Link as LinkIcon, Briefcase, ExternalLink, Copy, QrCode, Eye, Check, Loader2 } from 'lucide-react';
import { BusinessProfile } from '../../types';
import { updateBusinessProfile, getDigitalStoreUrl, getBioLinkUrl, getPortfolioUrl } from '../../services/firebaseService';

interface Props {
  business: BusinessProfile;
  onBusinessUpdated: (updated: BusinessProfile) => void;
}

export const CreatorModulesManager: React.FC<Props> = ({ business, onBusinessUpdated }) => {
  const [updating, setUpdating] = useState<string | null>(null);

  const toggleModule = async (key: string, currentValue: boolean) => {
    setUpdating(key);
    try {
      const updatedModules = { ...business.modules, [key]: !currentValue };
      await updateBusinessProfile(business.id, { modules: updatedModules });
      onBusinessUpdated({ ...business, modules: updatedModules });
    } catch (err) {
      console.error(err);
      alert('Failed to update module');
    } finally {
      setUpdating(null);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Link Copied: ' + url);
  };

  const modules = [
    {
      id: 'digital_products',
      title: 'Digital Store',
      description: 'Sell digital files, courses, and consulting slots.',
      icon: ShoppingBag,
      url: getDigitalStoreUrl(business.slug),
      enabled: !!business.modules?.digital_products || !!business.modules?.digitalProducts
    },
    {
      id: 'universal_links',
      title: 'Universal Bio Link',
      description: 'Your one link for all socials, resources, and communities.',
      icon: LinkIcon,
      url: getBioLinkUrl(business.slug),
      enabled: !!business.modules?.universal_links
    },
    {
      id: 'portfolio',
      title: 'Professional Portfolio',
      description: 'Showcase your work, case studies, and resume.',
      icon: Briefcase,
      url: getPortfolioUrl(business.slug),
      enabled: !!business.modules?.work_portfolio || !!business.modules?.portfolio
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">My Modules</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your public creator modules and URLs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <div key={mod.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col h-full relative overflow-hidden">
            {mod.enabled && (
              <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase tracking-wider rounded-bl-lg">
                Published
              </div>
            )}
            
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className={`p-3 rounded-xl ${mod.enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                <mod.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900">{mod.title}</h3>
            </div>
            
            <p className="text-sm text-slate-500 mb-6 flex-1">
              {mod.description}
            </p>

            <div className="space-y-3 mt-auto">
              {mod.enabled ? (
                <>
                  <a
                    href={mod.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex justify-center items-center gap-2 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Public Page
                  </a>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyUrl(mod.url)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex justify-center items-center gap-2 transition"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Link
                    </button>
                  </div>
                  <button
                    onClick={() => toggleModule(mod.id, mod.enabled)}
                    disabled={updating === mod.id}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs flex justify-center items-center transition mt-2"
                  >
                    {updating === mod.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unpublish Module'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => toggleModule(mod.id, mod.enabled)}
                  disabled={updating === mod.id}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex justify-center items-center transition shadow-sm"
                >
                  {updating === mod.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enable & Publish'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
