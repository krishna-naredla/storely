import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  Film,
  LayoutGrid,
  Brush,
  Briefcase,
  Check,
  Zap,
  Eye,
  Save,
  CheckCircle2,
  Sliders,
  Layers,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { PortfolioTemplateId, BusinessProfile, PortfolioSettings } from '../../types';
import {
  PORTFOLIO_LAYOUT_TEMPLATES,
  PortfolioTemplateDefinition,
} from '../../utils/portfolioTheme';
import { updateBusinessProfile, updatePortfolioSettings } from '../../services/firebaseService';

interface PortfolioTemplateSelectorProps {
  selectedTemplateId: PortfolioTemplateId;
  onSelectTemplate: (template: PortfolioTemplateDefinition | PortfolioTemplateId) => void;
  business?: BusinessProfile;
  onBusinessUpdated?: (updated: BusinessProfile) => void;
}

const TEMPLATE_ICONS: Record<string, React.ElementType> = {
  Sparkles,
  Camera,
  Film,
  LayoutGrid,
  Brush,
  Briefcase,
};

/**
 * Visual Layout Mockup Wireframe Component for each Template Archetype
 */
const TemplateWireframeMockup: React.FC<{ templateId: PortfolioTemplateId; isSelected: boolean }> = ({
  templateId,
  isSelected,
}) => {
  switch (templateId) {
    case 'modern_showcase':
      return (
        <div className="w-full h-32 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 flex flex-col justify-between overflow-hidden relative">
          {/* Top Hero Banner */}
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-800">
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] text-white font-bold shrink-0">
              ●
            </div>
            <div className="space-y-1 flex-1">
              <div className="h-2 w-16 bg-slate-300 dark:bg-slate-700 rounded-full" />
              <div className="h-1.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="h-3 w-8 bg-indigo-100 dark:bg-indigo-900/60 rounded-full" />
          </div>
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-1 py-1">
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
          {/* 2-Col Project Cards */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="h-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 p-1 flex flex-col justify-between">
              <div className="h-1.5 w-10 bg-indigo-400 dark:bg-indigo-500 rounded-full" />
              <div className="h-1 w-6 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 flex flex-col justify-between">
              <div className="h-1.5 w-10 bg-slate-400 dark:bg-slate-600 rounded-full" />
              <div className="h-1 w-6 bg-slate-300 dark:bg-slate-700 rounded-full" />
            </div>
          </div>
        </div>
      );

    case 'minimalist_studio':
      return (
        <div className="w-full h-32 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between overflow-hidden relative">
          {/* Clean Editorial Title */}
          <div className="space-y-1 text-center flex flex-col items-center">
            <div className="h-2 w-20 bg-slate-900 dark:bg-slate-100 rounded-full" />
            <div className="h-1 w-28 bg-slate-300 dark:bg-slate-700 rounded-full" />
          </div>
          <div className="w-full h-[1px] bg-slate-100 dark:bg-slate-800 my-1" />
          {/* Edge-to-Edge Full Bleed Frame */}
          <div className="grid grid-cols-3 gap-1.5 flex-1 items-center">
            <div className="h-14 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-sm" />
            <div className="h-14 bg-slate-200 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 rounded-sm" />
            <div className="h-14 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-sm" />
          </div>
          {/* Minimal Typography Caption */}
          <div className="flex justify-between items-center pt-1 text-[7px] text-slate-400">
            <div className="h-1 w-10 bg-slate-300 dark:bg-slate-700 rounded-full" />
            <div className="h-1 w-8 bg-slate-300 dark:bg-slate-700 rounded-full" />
          </div>
        </div>
      );

    case 'dark_luxury':
      return (
        <div className="w-full h-32 rounded-xl bg-slate-950 border border-slate-800 p-2.5 flex flex-col justify-between overflow-hidden relative shadow-inner">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 via-cyan-400 to-indigo-500" />
          {/* Top Cinematic Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-[7px] text-cyan-300 font-bold">
                ★
              </div>
              <div className="h-2 w-16 bg-slate-200 rounded-full" />
            </div>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[8px] font-bold border border-amber-500/30">
              VIP
            </span>
          </div>
          {/* Widescreen Video Card */}
          <div className="h-12 bg-slate-900 rounded-lg border border-slate-700/80 flex items-center justify-center relative overflow-hidden group">
            <div className="w-5 h-5 rounded-full bg-cyan-500/30 text-cyan-300 flex items-center justify-center text-[9px] shadow-sm">
              ▶
            </div>
          </div>
          {/* Glowing Badges & Bottom Bar */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="h-4 bg-slate-900/90 rounded border border-cyan-500/30" />
            <div className="h-4 bg-slate-900/90 rounded border border-amber-500/30" />
          </div>
        </div>
      );

    case 'bento_grid':
      return (
        <div className="w-full h-32 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 flex flex-col justify-between overflow-hidden relative">
          {/* Asymmetric Bento Modular Grid */}
          <div className="grid grid-cols-3 gap-1.5 flex-1">
            {/* 2x2 Large Featured Bento Box */}
            <div className="col-span-2 row-span-2 bg-indigo-100/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 rounded-lg p-1.5 flex flex-col justify-between">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-indigo-600 text-white text-[6px] font-bold flex items-center justify-center">
                  B
                </div>
                <div className="h-1.5 w-12 bg-indigo-700/70 dark:bg-indigo-300 rounded-full" />
              </div>
              <div className="h-6 bg-white/80 dark:bg-slate-900/80 rounded border border-indigo-200/50 dark:border-indigo-800/50" />
            </div>
            {/* Top Right Mini Box */}
            <div className="bg-emerald-100/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-1 flex flex-col justify-center items-center">
              <div className="h-2 w-6 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
              <div className="h-1 w-4 bg-emerald-400 dark:bg-emerald-600 rounded-full mt-1" />
            </div>
            {/* Bottom Right Mini Box */}
            <div className="bg-purple-100/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-lg p-1 flex flex-col justify-center items-center">
              <div className="h-1.5 w-6 bg-purple-600 dark:bg-purple-400 rounded-full" />
            </div>
          </div>
          {/* Tech Stack Chips Bar */}
          <div className="flex gap-1 pt-1.5">
            <div className="h-2.5 w-8 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="h-2.5 w-10 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="h-2.5 w-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
          </div>
        </div>
      );

    case 'creative_masonry':
      return (
        <div className="w-full h-32 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 flex flex-col justify-between overflow-hidden relative">
          {/* Filter Pills */}
          <div className="flex gap-1 pb-1">
            <div className="h-2 w-8 bg-rose-500 rounded-full" />
            <div className="h-2 w-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="h-2 w-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
          </div>
          {/* Staggered Height Masonry Columns */}
          <div className="grid grid-cols-3 gap-1.5 flex-1 items-start">
            <div className="space-y-1">
              <div className="h-10 bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-md" />
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
            <div className="space-y-1">
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-10 bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-md" />
            </div>
            <div className="space-y-1">
              <div className="h-14 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
          </div>
        </div>
      );

    case 'executive_agency':
      return (
        <div className="w-full h-32 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 flex flex-col justify-between overflow-hidden relative">
          {/* Trust Ticker Header */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
            <div className="h-2 w-14 bg-slate-700 dark:bg-slate-300 rounded-full" />
            <div className="flex gap-1">
              <div className="h-2 w-4 bg-emerald-500 rounded-sm" />
              <div className="h-2 w-4 bg-emerald-500 rounded-sm" />
            </div>
          </div>
          {/* Milestone Stat Numbers */}
          <div className="grid grid-cols-3 gap-1 py-1 text-center">
            <div className="h-3.5 bg-emerald-100 dark:bg-emerald-950/40 rounded border border-emerald-200 dark:border-emerald-800" />
            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          {/* Structured Deliverables Matrix Card */}
          <div className="h-8 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="h-1.5 w-12 bg-slate-700 dark:bg-slate-300 rounded-full" />
              <div className="h-1 w-8 bg-slate-400 dark:bg-slate-500 rounded-full" />
            </div>
            <div className="h-4 w-10 bg-emerald-600 rounded text-[7px] text-white font-bold flex items-center justify-center">
              Quote
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="w-full h-32 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 flex items-center justify-center text-slate-400 text-xs">
          Visual Layout
        </div>
      );
  }
};

export const PortfolioTemplateSelector: React.FC<PortfolioTemplateSelectorProps> = ({
  selectedTemplateId,
  onSelectTemplate,
  business,
  onBusinessUpdated,
}) => {
  const [savingTemplateId, setSavingTemplateId] = useState<PortfolioTemplateId | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const handleApplyTemplate = async (tmpl: PortfolioTemplateDefinition, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // 1. Instantly trigger live preview callback in parent
    onSelectTemplate(tmpl);

    // 2. If business exists, update the Firestore business document template & portfolioSettings
    if (business?.id) {
      setSavingTemplateId(tmpl.id);
      try {
        const updatedSettings: PortfolioSettings = {
          ...business.portfolioSettings,
          templateId: tmpl.id,
          themeColor: tmpl.recommendedTheme || business.portfolioSettings?.themeColor || 'default',
          fontStyle: tmpl.recommendedFont || business.portfolioSettings?.fontStyle || 'sans',
          themeConfig: {
            ...business.portfolioSettings?.themeConfig,
            primaryColor: business.portfolioSettings?.themeConfig?.primaryColor || '#4f46e5',
            fontFamily: tmpl.recommendedFont || 'sans',
            cardStyle: tmpl.recommendedCardStyle || 'bordered',
            colorMode: tmpl.recommendedTheme === 'dark' ? 'dark' : 'light',
          },
        };

        // Update both template and portfolioSettings in Firestore
        await updateBusinessProfile(business.id, {
          template: tmpl.id,
          portfolioSettings: updatedSettings,
        });

        await updatePortfolioSettings(business.id, updatedSettings);

        if (onBusinessUpdated) {
          onBusinessUpdated({
            ...business,
            template: tmpl.id,
            portfolioSettings: updatedSettings,
          });
        }

        setSavedFeedback(`Applied & Saved "${tmpl.name}" to your profile!`);
        setTimeout(() => setSavedFeedback(null), 3000);
      } catch (err) {
        console.error('Error saving template to Firestore:', err);
      } finally {
        setSavingTemplateId(null);
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider">
              Visual Template Architect
            </span>
            {savedFeedback && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {savedFeedback}
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-black font-heading text-slate-900 dark:text-white mt-1">
            Choose Portfolio Layout Style &amp; Theme Archetype
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any layout to inspect real-time live preview in the studio panel. Click "Apply &amp; Save" to update Firestore.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>Live Interactive Preview</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {PORTFOLIO_LAYOUT_TEMPLATES.map((tmpl) => {
          const isSelected = selectedTemplateId === tmpl.id;
          const IconComponent = TEMPLATE_ICONS[tmpl.iconName] || Sparkles;
          const isSaving = savingTemplateId === tmpl.id;

          return (
            <div
              key={tmpl.id}
              onClick={() => onSelectTemplate(tmpl)}
              className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between overflow-hidden group hover:shadow-lg ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-xs flex items-center gap-1 z-10">
                  <Check className="w-3 h-3 stroke-[3]" /> Active Live Style
                </div>
              )}

              <div>
                {/* Header Icon + Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition shadow-2xs ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 pr-14">
                    <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">
                      {tmpl.name}
                    </h4>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 truncate block">
                      {tmpl.tagline}
                    </span>
                  </div>
                </div>

                {/* Visual Miniature Wireframe Mockup */}
                <div className="mb-3.5">
                  <TemplateWireframeMockup templateId={tmpl.id} isSelected={isSelected} />
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 min-h-[44px]">
                  {tmpl.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                  {tmpl.badge}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => handleApplyTemplate(tmpl, e)}
                    disabled={isSaving}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    {isSaving ? (
                      <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : isSelected ? (
                      <Save className="w-3 h-3" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                    <span>{isSelected ? 'Saved / Apply' : 'Select & Save'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PortfolioTemplateSelector;
