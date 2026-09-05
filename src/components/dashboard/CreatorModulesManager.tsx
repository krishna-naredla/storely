import React, { useState } from 'react';
import {
  ShoppingBag,
  Link as LinkIcon,
  Briefcase,
  ExternalLink,
  Copy,
  CalendarCheck,
  FileText,
  Ticket,
  Check,
  Loader2,
  Sparkles,
  ArrowRight,
  Star,
  Layers,
  Sliders,
  Store,
} from 'lucide-react';
import { BusinessProfile } from '../../types';
import { updateBusinessProfile, getDigitalStoreUrl, getBioLinkUrl, getPortfolioUrl } from '../../services/firebaseService';
import { DashboardTab } from './Sidebar';

interface Props {
  business: BusinessProfile;
  onBusinessUpdated: (updated: BusinessProfile) => void;
  onNavigateTab?: (tab: DashboardTab) => void;
}

export const CreatorModulesManager: React.FC<Props> = ({ business, onBusinessUpdated, onNavigateTab }) => {
  const [updating, setUpdating] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleModule = async (keys: string[], currentValue: boolean) => {
    const primaryKey = keys[0];
    setUpdating(primaryKey);
    try {
      const updatedModules = { ...business.modules };
      const nextVal = !currentValue;
      for (const k of keys) {
        (updatedModules as any)[k] = nextVal;
      }
      
      // If enabling digital products, ensure cart_ordering and products flag are set for compatibility
      if (keys.includes('digital_products') && nextVal) {
        updatedModules.products = true;
        updatedModules.cart_ordering = true;
      }

      await updateBusinessProfile(business.id, { modules: updatedModules });
      onBusinessUpdated({ ...business, modules: updatedModules });
    } catch (err) {
      console.error('Failed to update creator module:', err);
      alert('Failed to update module state. Please check your internet connection.');
    } finally {
      setUpdating(null);
    }
  };

  const copyUrl = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSlug = business.username || business.slug;

  const modules: {
    id: string;
    keys: string[];
    title: string;
    description: string;
    tabId: DashboardTab;
    tabLabel: string;
    icon: React.ElementType;
    badgeColor: string;
    activeBg: string;
    url: string;
    enabled: boolean;
  }[] = [
    {
      id: 'portfolio',
      keys: ['work_portfolio', 'portfolio'],
      title: 'Portfolio Showcase',
      description: 'Case studies, visual project galleries, client feedback, skills, and media kit.',
      tabId: 'portfolio',
      tabLabel: 'Manage Showcase',
      icon: Briefcase,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      activeBg: 'bg-indigo-50 text-indigo-600',
      url: getPortfolioUrl(handleSlug),
      enabled: !!business.modules?.work_portfolio || !!business.modules?.portfolio,
    },
    {
      id: 'universal_links',
      keys: ['universal_links'],
      title: 'Universal Bio Link',
      description: 'One link in bio for all socials, YouTube videos, resources, and custom links.',
      tabId: 'biolink',
      tabLabel: 'Configure Bio Links',
      icon: LinkIcon,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      activeBg: 'bg-purple-50 text-purple-600',
      url: getBioLinkUrl(handleSlug),
      enabled: !!business.modules?.universal_links,
    },
    {
      id: 'digital_products',
      keys: ['digital_products', 'digitalProducts'],
      title: 'Digital Store & Downloads',
      description: 'Sell downloadable assets, PDFs, design templates, software, and presets.',
      tabId: 'catalog',
      tabLabel: 'Add Digital Products',
      icon: ShoppingBag,
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      activeBg: 'bg-teal-50 text-teal-600',
      url: getDigitalStoreUrl(handleSlug),
      enabled: !!business.modules?.digital_products || !!business.modules?.digitalProducts,
    },
    {
      id: 'booking_appointments',
      keys: ['booking_appointments'],
      title: '1:1 Consultations & Mentorship',
      description: 'Paid video calls, portfolio reviews, advice sessions, and appointment slots.',
      tabId: 'bookings',
      tabLabel: 'Manage Appointments',
      icon: CalendarCheck,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      activeBg: 'bg-blue-50 text-blue-600',
      url: getPortfolioUrl(handleSlug),
      enabled: !!business.modules?.booking_appointments,
    },
    {
      id: 'custom_quotes',
      keys: ['custom_quotes'],
      title: 'Custom Project Quotes',
      description: 'Receive project briefs and send customized estimates, scopes & payment links.',
      tabId: 'quotes',
      tabLabel: 'Review Quotes',
      icon: FileText,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      activeBg: 'bg-amber-50 text-amber-600',
      url: getPortfolioUrl(handleSlug),
      enabled: !!business.modules?.custom_quotes,
    },
    {
      id: 'events_tickets',
      keys: ['events_tickets', 'events_ticketing'],
      title: 'Events, Workshops & Webinars',
      description: 'Sell tickets for live masterclasses, cohort meetups, bootcamps, and workshops.',
      tabId: 'events',
      tabLabel: 'Manage Events',
      icon: Ticket,
      badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
      activeBg: 'bg-pink-50 text-pink-600',
      url: getPortfolioUrl(handleSlug),
      enabled: !!business.modules?.events_tickets || !!business.modules?.events_ticketing,
    },
    {
      id: 'reviews',
      keys: ['reviews'],
      title: 'Client Testimonials & Ratings',
      description: 'Collect and display verified client feedback, ratings, and social proof.',
      tabId: 'reviews',
      tabLabel: 'Manage Testimonials',
      icon: Star,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      activeBg: 'bg-amber-50 text-amber-600',
      url: getPortfolioUrl(handleSlug),
      enabled: business.modules?.reviews !== false,
    },
  ];

  const activeCount = modules.filter((m) => m.enabled).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Creator Modular Architecture
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-white text-xs font-semibold">
                {activeCount} of {modules.length} Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-heading mt-1 text-white">
              Creator Modules &amp; Public Destinations
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Enable or disable capabilities on the fly. Your navigation sidebar, public portfolio page, bio link, and digital store update instantly.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href={getPortfolioUrl(handleSlug)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-950/40"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Preview Live Profile</span>
            </a>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod) => (
          <div
            key={mod.id}
            className={`bg-white rounded-3xl p-5 sm:p-6 shadow-xs border transition-all flex flex-col justify-between relative overflow-hidden hover:shadow-md ${
              mod.enabled ? 'border-indigo-200/90 ring-1 ring-indigo-500/10' : 'border-slate-200/90 opacity-90'
            }`}
          >
            {mod.enabled && (
              <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-2xl border-l border-b shadow-2xs ${mod.badgeColor}`}>
                Active
              </div>
            )}

            <div>
              <div className="flex items-center gap-3 mb-3 mt-1">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shadow-2xs ${
                  mod.enabled ? mod.activeBg : 'bg-slate-100 text-slate-400'
                }`}>
                  <mod.icon className="w-6 h-6" />
                </div>
                <div className="min-w-0 pr-12">
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{mod.title}</h3>
                  <span className="text-[11px] font-medium text-slate-400">
                    {mod.enabled ? 'Live on Profile' : 'Inactive'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-5 leading-relaxed min-h-[36px]">
                {mod.description}
              </p>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              {mod.enabled ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {onNavigateTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab(mod.tabId)}
                        className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl font-bold text-xs flex justify-center items-center gap-1.5 transition cursor-pointer"
                      >
                        <span>{mod.tabLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <a
                      href={mod.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex justify-center items-center gap-1.5 transition ${
                        !onNavigateTab ? 'col-span-2' : ''
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Live</span>
                    </a>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => copyUrl(mod.id, mod.url)}
                      className="text-[11px] font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedKey === mod.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Live Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleModule(mod.keys, mod.enabled)}
                      disabled={updating === mod.keys[0]}
                      className="text-slate-400 hover:text-rose-600 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      {updating === mod.keys[0] ? (
                        <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
                      ) : (
                        'Disable'
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleModule(mod.keys, mod.enabled)}
                  disabled={updating === mod.keys[0]}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex justify-center items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  {updating === mod.keys[0] ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Enable &amp; Add to Navigation</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

