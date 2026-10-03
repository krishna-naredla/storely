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
  Globe,
  EyeOff,
  Eye,
  Plus,
  X,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { BusinessProfile } from '../../types';
import { DashboardTab } from './Sidebar';
import { ConfirmActionModal } from '../common/ConfirmActionModal';
import { ModuleQrModal } from '../common/ModuleQrModal';
import { isCreatorProfile, getPrimaryPublicDisplayPath } from '../../utils/profileHelper';
import { isModuleApplicableForBusiness } from '../../services/businessConfig';
import {
  CREATOR_MODULES_REGISTRY,
  CreatorModuleRegistryEntry,
  ModulePublishState,
  getCreatorModulePublicUrl,
  getCreatorModuleState,
  setCreatorModuleState,
} from '../../utils/creatorModuleManager';

interface Props {
  business: BusinessProfile;
  onBusinessUpdated: (updated: BusinessProfile) => void;
  onNavigateTab?: (tab: DashboardTab) => void;
}

interface ActiveModuleViewItem extends CreatorModuleRegistryEntry {
  url: string;
  enabled: boolean;
  published: boolean;
  status: ModulePublishState;
}

export const CreatorModulesManager: React.FC<Props> = ({
  business,
  onBusinessUpdated,
  onNavigateTab,
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [moduleToDisable, setModuleToDisable] = useState<ActiveModuleViewItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedQrModule, setSelectedQrModule] = useState<ActiveModuleViewItem | null>(null);
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  const handleEnableModuleFromPicker = async (mod: ActiveModuleViewItem) => {
    setUpdatingId(mod.id);
    try {
      // Enabling sets enabled: true and published: false (draft mode) so creator can configure before going live
      const updated = await setCreatorModuleState(business, mod.id, {
        enabled: true,
        published: false,
      });
      onBusinessUpdated(updated);
      showSuccess(`"${mod.title}" has been added to your active modules in Draft mode.`);
      setIsAddModuleModalOpen(false);
    } catch (err) {
      console.error('Failed to enable creator module:', err);
      showError('Failed to enable module. Please check your network connection.');
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDisableModule = async () => {
    if (!moduleToDisable) return;
    const modId = moduleToDisable.id;
    const modTitle = moduleToDisable.title;
    setUpdatingId(modId);
    setModuleToDisable(null);

    try {
      const updated = await setCreatorModuleState(business, modId, {
        enabled: false,
        published: false,
      });
      onBusinessUpdated(updated);
      showSuccess(`"${modTitle}" deactivated. All your settings and content remain safely preserved.`);
    } catch (err) {
      console.error('Failed to disable creator module:', err);
      showError('Failed to deactivate module. Please check your network connection.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTogglePublish = async (mod: ActiveModuleViewItem) => {
    setUpdatingId(mod.id);
    try {
      const nextPublished = !mod.published;
      const updated = await setCreatorModuleState(business, mod.id, {
        enabled: true,
        published: nextPublished,
      });
      onBusinessUpdated(updated);
      showSuccess(
        nextPublished
          ? `"${mod.title}" is now LIVE and accessible to the public!`
          : `"${mod.title}" is now unpublished (Draft mode).`
      );
    } catch (err) {
      console.error('Failed to toggle publish state:', err);
      showError('Failed to update publication state. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const isCreator = isCreatorProfile(business);

  // Build authoritative list of creator modules with deterministic public URLs and exact publish state
  const allCreatorModules: ActiveModuleViewItem[] = CREATOR_MODULES_REGISTRY.map((entry) => {
    const state = getCreatorModuleState(business, entry.id);
    return {
      ...entry,
      url: getCreatorModulePublicUrl(business, entry.id),
      enabled: state.enabled,
      published: state.published,
      status: state.status,
    };
  });

  // Filter modules based on business type whitelist
  const allowedModules = allCreatorModules.filter((m) =>
    m.dbKeys.some((k) => isModuleApplicableForBusiness(k, business))
  );

  // Partition into Active and Inactive modules
  const activeModules = allowedModules.filter((m) => m.enabled);
  const inactiveModules = allowedModules.filter((m) => !m.enabled);

  const publishedCount = activeModules.filter((m) => m.published).length;

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
              <strong>{business.name}</strong> is currently set up as a Commerce Vendor storefront. Creator modules are tailored for digital creators, artists, and independent professionals.
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-[var(--r8)] bg-[var(--g100)] border border-[var(--g200)] text-[var(--g700)] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--g600)]" />
                Modular Creator Suite
              </span>
              <span className="px-2.5 py-1 rounded-[var(--r8)] bg-[var(--bg)] border border-[var(--border)] text-[var(--t2)] text-xs font-semibold">
                {activeModules.length} of {allowedModules.length} Active ({publishedCount} Live)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-heading mt-1 text-[var(--t1)]">
              Creator Modules
            </h2>
            <p className="text-[var(--t2)] text-xs sm:text-sm leading-relaxed">
              Choose the tools you need. Each active module has its own independent management area, dedicated public destination, and customer experience.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {inactiveModules.length > 0 && (
              <button
                type="button"
                onClick={() => setIsAddModuleModalOpen(true)}
                className="ds-btn-primary min-h-[44px] px-4 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-[var(--shadow-xs)]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Module</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const primaryMod = activeModules.find((m) => m.published) || activeModules[0] || allowedModules[0];
                if (primaryMod) setSelectedQrModule(primaryMod);
              }}
              className="ds-btn-secondary min-h-[44px] px-3.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-[var(--shadow-xs)]"
              title="Open module QR code generator"
            >
              <QrCode className="w-4 h-4 text-[var(--g600)]" />
              <span className="hidden sm:inline">Module QR Codes</span>
            </button>

            <a
              href={getPrimaryPublicDisplayPath(business)}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3.5 rounded-[var(--r8)] bg-[var(--bg)] hover:bg-[var(--border)]/50 text-[var(--t1)] border border-[var(--border)] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <ExternalLink className="w-4 h-4 text-[var(--t2)]" />
              <span>Preview Profile</span>
            </a>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-4 rounded-[var(--r12)] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="p-4 rounded-[var(--r12)] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SECTION: Active Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-[var(--t1)]">
              Active Modules
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-[var(--g100)] text-[var(--g700)] text-xs font-bold">
              {activeModules.length}
            </span>
          </div>

          {inactiveModules.length > 0 && activeModules.length > 0 && (
            <button
              type="button"
              onClick={() => setIsAddModuleModalOpen(true)}
              className="text-xs font-bold text-[var(--g600)] hover:text-[var(--g700)] flex items-center gap-1 cursor-pointer transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Module ({inactiveModules.length} available)</span>
            </button>
          )}
        </div>

        {activeModules.length === 0 ? (
          /* Empty State when no modules are active */
          <div className="p-8 sm:p-12 rounded-[var(--r16)] bg-[var(--card)] border border-dashed border-[var(--border)] text-center space-y-4 shadow-[var(--shadow-xs)]">
            <div className="w-14 h-14 rounded-2xl bg-[var(--g50)] text-[var(--g600)] flex items-center justify-center mx-auto shadow-inner">
              <Layers className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="text-base font-bold text-[var(--t1)]">
                No Active Creator Modules
              </h4>
              <p className="text-xs sm:text-sm text-[var(--t2)] leading-relaxed">
                Assemble your digital presence by adding only the tools you need — such as a Portfolio, 1:1 Consultations, Universal Bio Link, or Event Tickets.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModuleModalOpen(true)}
              className="ds-btn-primary min-h-[44px] px-6 text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer shadow-[var(--shadow-xs)]"
            >
              <Plus className="w-4 h-4" />
              <span>Browse &amp; Add Modules</span>
            </button>
          </div>
        ) : (
          /* Active Modules Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeModules.map((mod) => {
              const isBusy = updatingId === mod.id;
              const isPublished = mod.published;

              return (
                <div
                  key={mod.id}
                  className={`bg-[var(--card)] rounded-[var(--r16)] p-5 sm:p-6 shadow-[var(--shadow-xs)] border transition-all flex flex-col justify-between relative overflow-hidden ${
                    isPublished
                      ? 'border-[var(--g500)]/40 ring-1 ring-[var(--g500)]/10'
                      : 'border-amber-300 bg-amber-50/15 ring-1 ring-amber-400/10'
                  }`}
                >
                  {/* Status Badge */}
                  {isPublished ? (
                    <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-[var(--r12)] border-l border-b bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      <span>Live</span>
                    </div>
                  ) : (
                    <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-[var(--r12)] border-l border-b bg-amber-100 text-amber-900 border-amber-300 flex items-center gap-1">
                      <EyeOff className="w-3 h-3 text-amber-700" />
                      <span>Draft</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-3 mb-3 mt-1">
                      <div
                        className={`w-12 h-12 rounded-[var(--r12)] flex items-center justify-center transition ${
                          isPublished
                            ? mod.activeBg
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <mod.icon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 pr-14">
                        <h3 className="font-bold text-sm text-[var(--t1)] leading-snug">{mod.title}</h3>
                        <span className="text-[11px] font-semibold text-[var(--t3)]">
                          {isPublished ? 'Live on Profile' : 'Active (Draft Mode)'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--t2)] mb-3 leading-relaxed min-h-[36px]">
                      {mod.description}
                    </p>

                    {/* Public URL Preview Pill */}
                    <div className="mb-4 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 truncate flex items-center justify-between gap-1">
                      <span className="truncate">{mod.url.replace(/^https?:\/\//, '')}</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-3 border-t border-[var(--border)]">
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

                      {isPublished ? (
                        <a
                          href={mod.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2 ds-btn-primary rounded-[var(--r8)] font-bold text-xs flex justify-center items-center gap-1 transition truncate"
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span>Live</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleTogglePublish(mod)}
                          className="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[var(--r8)] font-bold text-xs flex justify-center items-center gap-1 transition truncate cursor-pointer shadow-xs"
                          title="Publish this module to make it live to public visitors"
                        >
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Globe className="w-3.5 h-3.5 shrink-0" />
                              <span>Publish</span>
                            </>
                          )}
                        </button>
                      )}
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
                            <span className="text-[var(--g700)]">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[var(--t3)]" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      {isPublished ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleTogglePublish(mod)}
                          className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition cursor-pointer"
                          title="Hide from public view while keeping module enabled"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Unpublish</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleTogglePublish(mod)}
                          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition cursor-pointer"
                          title="Make this module live to the public"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Make Live</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setModuleToDisable(mod)}
                        disabled={isBusy}
                        className="text-[var(--t3)] hover:text-[var(--r500)] text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="Deactivate this module"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3 h-3 animate-spin text-[var(--t3)]" />
                        ) : (
                          'Disable'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD MODULE MODAL / DRAWER */}
      {isAddModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[var(--card)] rounded-[var(--r20)] border border-[var(--border)] shadow-[var(--shadow-lg)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[var(--border)] flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-[var(--r8)] bg-[var(--g100)] text-[var(--g700)]">
                    <Layers className="w-4 h-4" />
                  </span>
                  <h3 className="text-lg font-black font-heading text-[var(--t1)]">
                    Add Creator Module
                  </h3>
                </div>
                <p className="text-xs text-[var(--t2)] mt-1">
                  Select an independent capability to enable in your workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModuleModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-[var(--bg)] text-[var(--t3)] hover:text-[var(--t1)] flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Inactive Modules List */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {inactiveModules.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-[var(--g600)] mx-auto" />
                  <h4 className="text-sm font-bold text-[var(--t1)]">
                    All Modules Are Active
                  </h4>
                  <p className="text-xs text-[var(--t2)] max-w-sm mx-auto">
                    You have enabled all available Creator tools. You can manage or publish each of them from your Active Modules dashboard.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {inactiveModules.map((mod) => {
                    const isBusy = updatingId === mod.id;

                    return (
                      <div
                        key={mod.id}
                        className="p-4 rounded-[var(--r16)] bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--g300)] transition flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[var(--r10)] bg-[var(--card)] border border-[var(--border)] flex items-center justify-center text-[var(--t1)]">
                              <mod.icon className="w-5 h-5 text-[var(--g600)]" />
                            </div>
                            <div>
                              <h4 className="text-xs sm:text-sm font-bold text-[var(--t1)]">
                                {mod.title}
                              </h4>
                              <span className="text-[10px] font-mono text-[var(--t3)]">
                                {mod.publicPathPrefix}/...
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-[var(--t2)] leading-relaxed">
                            {mod.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleEnableModuleFromPicker(mod)}
                          className="w-full ds-btn-primary py-2 px-3 rounded-[var(--r8)] font-bold text-xs flex justify-center items-center gap-1.5 transition shadow-[var(--shadow-xs)] cursor-pointer mt-1"
                        >
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Enable Module</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--bg)]/50 flex items-center justify-between text-xs text-[var(--t3)]">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Enabling a module starts it in Draft mode. You can publish whenever you are ready.</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModuleModalOpen(false)}
                className="px-4 py-2 rounded-[var(--r8)] hover:bg-[var(--border)] text-[var(--t1)] font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Disabling Creator Module */}
      <ConfirmActionModal
        isOpen={!!moduleToDisable}
        title={`Deactivate ${moduleToDisable?.title || 'Creator Module'}?`}
        message={`Are you sure you want to deactivate "${moduleToDisable?.title}"? This will hide its section from your public profile and navigation. All your existing projects, files, bookings, and settings will remain safely preserved.`}
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
          badge={selectedQrModule.shortTitle}
          url={selectedQrModule.url}
          businessName={business.name}
          logoUrl={business.logo || business.profileImage}
          accentColor={selectedQrModule.accentColor}
        />
      )}
    </div>
  );
};
