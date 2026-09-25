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
  Store,
  CheckCircle2,
  QrCode,
} from 'lucide-react';
import { BusinessProfile } from '../../types';
import { updateBusinessProfile, getDigitalStoreUrl, getBioLinkUrl, getPortfolioUrl } from '../../services/firebaseService';
import { DashboardTab } from './Sidebar';
import { ConfirmActionModal } from '../common/ConfirmActionModal';
import { ModuleQrModal } from '../common/ModuleQrModal';
import { isCreatorProfile, getPrimaryPublicDisplayPath } from '../../utils/profileHelper';
import { isModuleApplicableForBusiness } from '../../services/businessConfig';

interface Props {
  business: BusinessProfile;
  onBusinessUpdated: (updated: BusinessProfile) => void;
  onNavigateTab?: (tab: DashboardTab) => void;
}

interface CreatorModuleItem {
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
}

export const CreatorModulesManager: React.FC<Props> = ({ business, onBusinessUpdated, onNavigateTab }) => {
  const [updating, setUpdating] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [moduleToDisable, setModuleToDisable] = useState<CreatorModuleItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedQrModule, setSelectedQrModule] = useState<CreatorModuleItem | null>(null);

  const applyModuleToggle = async (keys: string[], nextVal: boolean) => {
    const primaryKey = keys[0];
    setUpdating(primaryKey);
    try {
      const updatedModules = { ...business.modules };
      for (const k of keys) {
        (updatedModules as any)[k] = nextVal;
      }
      
      await updateBusinessProfile(business.id, { modules: updatedModules });
      onBusinessUpdated({ ...business, modules: updatedModules });
    } catch (err) {
      console.error('Failed to update creator module:', err);
      setErrorMessage('Failed to update module state. Please check your internet connection.');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleModule = (mod: CreatorModuleItem) => {
    if (mod.enabled) {
      setModuleToDisable(mod);
    } else {
      applyModuleToggle(mod.keys, true);
    }
  };

  const confirmDisableModule = () => {
    if (moduleToDisable) {
      applyModuleToggle(moduleToDisable.keys, false);
      setModuleToDisable(null);
    }
  };

  const copyUrl = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSlug = business.username || business.slug;

  const allCreatorModules: CreatorModuleItem[] = [
    {
      id: 'portfolio',
      keys: ['work_portfolio', 'portfolio'],
      title: 'Portfolio Showcase',
      description: 'Case studies, visual project galleries, client feedback, skills, and media kit.',
      tabId: 'portfolio',
      tabLabel: 'Manage Showcase',
      icon: Briefcase,
      badgeColor: 'bg-[var(--g100)] text-[var(--g700)] border-[var(--g200)]',
      activeBg: 'bg-[var(--g100)] text-[var(--g600)]',
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
      badgeColor: 'bg-[var(--g100)] text-[var(--g700)] border-[var(--g200)]',
      activeBg: 'bg-[var(--g100)] text-[var(--g600)]',
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
      badgeColor: 'bg-[var(--g100)] text-[var(--g700)] border-[var(--g200)]',
      activeBg: 'bg-[var(--g100)] text-[var(--g600)]',
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
      badgeColor: 'bg-[var(--g100)] text-[var(--g700)] border-[var(--g200)]',
      activeBg: 'bg-[var(--g100)] text-[var(--g600)]',
      url: getDigitalStoreUrl(handleSlug),
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
      badgeColor: 'bg-[var(--g100)] text-[var(--g700)] border-[var(--g200)]',
      activeBg: 'bg-[var(--g100)] text-[var(--g600)]',
      url: getDigitalStoreUrl(handleSlug),
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
      badgeColor: 'bg-[var(--g100)] text-[var(--g700)] border-[var(--g200)]',
      activeBg: 'bg-[var(--g100)] text-[var(--g600)]',
      url: getDigitalStoreUrl(handleSlug),
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
      badgeColor: 'bg-[var(--g100)] text-[var(--g700)] border-[var(--g200)]',
      activeBg: 'bg-[var(--g100)] text-[var(--g600)]',
      url: getPortfolioUrl(handleSlug),
      enabled: business.modules?.reviews !== false,
    },
  ];

  const isCreator = isCreatorProfile(business);

  // Filter modules strictly based on business type whitelist
  const visibleModules = allCreatorModules.filter((m) =>
    m.keys.some((k) => isModuleApplicableForBusiness(k, business))
  );

  const activeCount = visibleModules.filter((m) => m.enabled).length;

  if (!isCreator) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="p-6 sm:p-8 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--r8)] bg-[var(--g100)] border border-[var(--g200)] text-[var(--g700)] text-xs font-bold uppercase tracking-wider">
              <Store className="w-3.5 h-3.5 text-[var(--g600)]" />
              Vendor Store Account Detected
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-heading text-[var(--t1)]">
              Vendor Storefront Configuration
            </h2>
            <p className="text-xs sm:text-sm text-[var(--t2)] leading-relaxed">
              <strong>{business.name}</strong> is currently set up as a Commerce Vendor storefront. Irrelevant creator-only tools (case study portfolios, biolink hubs) are hidden to keep your dashboard focused on physical products, table ordering, menu items, and bookings.
            </p>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('modules')}
              className="ds-btn-primary min-h-[44px] px-6 text-xs sm:text-sm shadow-[var(--shadow-xs)] transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>Manage Store Modules</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Info Grid for Vendor Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-1">
            <div className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider">Store Type</div>
            <div className="text-base font-black text-[var(--t1)] capitalize">{business.type.replace('_', ' ')}</div>
            <div className="text-xs text-[var(--t2)]">Retail, Catalog &amp; Cart Checkout</div>
          </div>
          <div className="p-5 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-1">
            <div className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider">Ordering Flow</div>
            <div className="text-base font-black text-[var(--g600)]">WhatsApp &amp; UPI Live</div>
            <div className="text-xs text-[var(--t2)]">Zero Commission on Direct Orders</div>
          </div>
          <div className="p-5 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-1">
            <div className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider">Public Storefront</div>
            <div className="text-base font-black text-[var(--t1)] font-mono text-xs truncate">/store/{business.slug}</div>
            <div className="text-xs text-[var(--t2)]">Live Customer Storefront URL</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-[var(--r8)] bg-[var(--g100)] border border-[var(--g200)] text-[var(--g700)] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--g600)]" />
                Creator Modular Architecture
              </span>
              <span className="px-2.5 py-1 rounded-[var(--r8)] bg-[var(--bg)] border border-[var(--border)] text-[var(--t2)] text-xs font-semibold">
                {activeCount} of {visibleModules.length} Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-heading mt-1 text-[var(--t1)]">
              Creator Modules &amp; Public Destinations
            </h2>
            <p className="text-[var(--t2)] text-xs sm:text-sm leading-relaxed">
              Enable or disable capabilities on the fly. Your navigation sidebar, public portfolio page, bio link, and digital store update instantly.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const primaryMod = visibleModules.find((m) => m.enabled) || visibleModules[0];
                if (primaryMod) setSelectedQrModule(primaryMod);
              }}
              className="ds-btn-secondary min-h-[44px] px-4 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-[var(--shadow-xs)]"
              title="Open module QR code generator"
            >
              <QrCode className="w-4 h-4 text-[var(--g600)]" />
              <span>Module QR Codes</span>
            </button>

            <a
              href={getPrimaryPublicDisplayPath(business)}
              target="_blank"
              rel="noopener noreferrer"
              className="ds-btn-primary min-h-[44px] px-4 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-[var(--shadow-xs)]"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Preview Live Profile</span>
            </a>
          </div>
        </div>
      </div>

      {/* Error message banner if any */}
      {errorMessage && (
        <div className="p-4 rounded-[var(--r12)] bg-[var(--r100)] border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleModules.map((mod) => (
          <div
            key={mod.id}
            className={`bg-[var(--card)] rounded-[var(--r16)] p-5 sm:p-6 shadow-[var(--shadow-xs)] border transition-all flex flex-col justify-between relative overflow-hidden ${
              mod.enabled ? 'border-[var(--g500)]/40 ring-1 ring-[var(--g500)]/10' : 'border-[var(--border)] opacity-90'
            }`}
          >
            {mod.enabled && (
              <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-[var(--r12)] border-l border-b ${mod.badgeColor}`}>
                Active
              </div>
            )}

            <div>
              <div className="flex items-center gap-3 mb-3 mt-1">
                <div className={`w-12 h-12 rounded-[var(--r12)] flex items-center justify-center transition ${
                  mod.enabled ? mod.activeBg : 'bg-[var(--bg)] text-[var(--t3)]'
                }`}>
                  <mod.icon className="w-6 h-6" />
                </div>
                <div className="min-w-0 pr-12">
                  <h3 className="font-bold text-sm text-[var(--t1)] leading-snug">{mod.title}</h3>
                  <span className="text-[11px] font-medium text-[var(--t3)]">
                    {mod.enabled ? 'Live on Profile' : 'Inactive'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[var(--t2)] mb-5 leading-relaxed min-h-[36px]">
                {mod.description}
              </p>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-[var(--border)]">
              {mod.enabled ? (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {onNavigateTab ? (
                      <button
                        type="button"
                        onClick={() => onNavigateTab(mod.tabId)}
                        className="py-2 px-2 bg-[var(--g50)] hover:bg-[var(--g100)] text-[var(--g700)] border border-[var(--g200)] rounded-[var(--r8)] font-bold text-xs flex justify-center items-center gap-1 transition cursor-pointer"
                        title={mod.tabLabel}
                      >
                        <span className="truncate">Manage</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    ) : (
                      <div />
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedQrModule(mod)}
                      className="py-2 px-2 bg-[var(--card)] hover:bg-[var(--bg)] text-[var(--t1)] border border-[var(--border)] rounded-[var(--r8)] font-bold text-xs flex justify-center items-center gap-1 transition cursor-pointer shadow-[var(--shadow-xs)]"
                      title="View, download, and print QR code for this module"
                    >
                      <QrCode className="w-3.5 h-3.5 text-[var(--g600)] shrink-0" />
                      <span>QR Code</span>
                    </button>
                    <a
                      href={mod.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-2 ds-btn-primary rounded-[var(--r8)] font-bold text-xs flex justify-center items-center gap-1 transition truncate"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>Live</span>
                    </a>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => copyUrl(mod.id, mod.url)}
                      className="text-[11px] font-semibold text-[var(--t2)] hover:text-[var(--g600)] flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedKey === mod.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[var(--g600)]" />
                          <span className="text-[var(--g700)]">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[var(--t3)]" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedQrModule(mod)}
                      className="text-[11px] font-semibold text-[var(--g600)] hover:text-[var(--g700)] flex items-center gap-1 transition cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Show QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleModule(mod)}
                      disabled={updating === mod.keys[0]}
                      className="text-[var(--t3)] hover:text-[var(--r500)] text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      {updating === mod.keys[0] ? (
                        <Loader2 className="w-3 h-3 animate-spin text-[var(--t3)]" />
                      ) : (
                        'Disable'
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleModule(mod)}
                  disabled={updating === mod.keys[0]}
                  className="w-full ds-btn-primary py-2.5 rounded-[var(--r8)] font-bold text-xs flex justify-center items-center gap-1.5 transition shadow-[var(--shadow-xs)] cursor-pointer"
                >
                  {updating === mod.keys[0] ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Enable &amp; Add to Navigation</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog for Disabling Creator Module */}
      <ConfirmActionModal
        isOpen={!!moduleToDisable}
        title={`Deactivate ${moduleToDisable?.title || "Creator Module"}?`}
        message={`Are you sure you want to deactivate "${moduleToDisable?.title}"? This will hide its section from your public profile and creator dashboard until you turn it back on.`}
        confirmText="Deactivate Module"
        cancelText="Keep Active"
        isDestructive={true}
        onConfirm={confirmDisableModule}
        onCancel={() => setModuleToDisable(null)}
      />

      {/* Dedicated Module QR Code Modal */}
      {selectedQrModule && (
        <ModuleQrModal
          isOpen={!!selectedQrModule}
          onClose={() => setSelectedQrModule(null)}
          title={`${selectedQrModule.title} QR Code`}
          subtitle={selectedQrModule.description}
          badge={selectedQrModule.title}
          url={selectedQrModule.url}
          businessName={business.name}
          logoUrl={business.logo || business.profileImage}
          accentColor="emerald"
        />
      )}
    </div>
  );
};
