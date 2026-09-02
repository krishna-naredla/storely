import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Copy,
  Star,
  Check,
  CheckCircle2,
  X,
  RotateCcw,
  Eye,
  CreditCard,
  Palette,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  ShieldCheck,
  Zap,
  Globe,
  DollarSign,
  Lock,
  ExternalLink,
  Key,
} from 'lucide-react';
import { PlatformPricingPlan, PlatformPricingCMS, PlatformRazorpayConfig } from '../../types/admin';
import {
  adminGetPricingPlans,
  adminSavePricingPlan,
  adminDeletePricingPlan,
  adminReorderPricingPlans,
  adminGetPricingCMS,
  adminSavePricingCMS,
  adminResetPricingToDefaults,
  DEFAULT_PRICING_PLANS,
  DEFAULT_PRICING_CMS,
} from '../../services/adminService';
import {
  getRazorpayConfig,
  saveRazorpayConfig,
  initiateRazorpaySubscription,
  DEFAULT_RAZORPAY_CONFIG,
} from '../../services/razorpayService';

interface AdminPricingManagerProps {
  onNotify?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminPricingManager: React.FC<AdminPricingManagerProps> = ({ onNotify }) => {
  const [plans, setPlans] = useState<PlatformPricingPlan[]>([]);
  const [cms, setCms] = useState<PlatformPricingCMS>(DEFAULT_PRICING_CMS);
  const [razorpayConfig, setRazorpayConfig] = useState<PlatformRazorpayConfig>(DEFAULT_RAZORPAY_CONFIG);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [subTab, setSubTab] = useState<'tiers' | 'cms' | 'razorpay'>('tiers');

  // Plan Edit/Create Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<PlatformPricingPlan>({
    id: '',
    name: '',
    tagline: '',
    currency: '₹',
    monthlyPrice: 0,
    yearlyPrice: 0,
    billingCycle: '/ month',
    badge: '',
    isRecommended: false,
    trialDays: 0,
    isActive: true,
    order: 1,
    ctaText: 'Start Free',
    ctaAction: 'signup',
    features: [],
    limits: {
      catalogueItems: 10,
      monthlyOrders: 100,
      customerRecords: 200,
      hasCustomDomain: false,
      hasAiPromotions: false,
      hasDigitalCard: true,
    },
  });

  // Feature Input
  const [featureInput, setFeatureInput] = useState<string>('');
  const [isSavingPlan, setIsSavingPlan] = useState<boolean>(false);

  // CMS Form State
  const [cmsForm, setCmsForm] = useState<PlatformPricingCMS>(DEFAULT_PRICING_CMS);
  const [isSavingCMS, setIsSavingCMS] = useState<boolean>(false);

  // Razorpay Form State
  const [isSavingRzp, setIsSavingRzp] = useState<boolean>(false);
  const [isTestingRzp, setIsTestingRzp] = useState<boolean>(false);

  // Load all pricing & gateway settings
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedPlans, fetchedCms, fetchedRzp] = await Promise.all([
        adminGetPricingPlans(),
        adminGetPricingCMS(),
        getRazorpayConfig(),
      ]);
      setPlans(fetchedPlans);
      setCms(fetchedCms);
      setCmsForm(fetchedCms);
      setRazorpayConfig(fetchedRzp);
    } catch (err) {
      console.error('Failed to load pricing and gateway config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handlePricingChange = () => loadData();
    window.addEventListener('storelly_pricing_changed', handlePricingChange);
    window.addEventListener('storelly_pricing_cms_changed', handlePricingChange);
    window.addEventListener('storelly_razorpay_config_changed', handlePricingChange);

    return () => {
      window.removeEventListener('storelly_pricing_changed', handlePricingChange);
      window.removeEventListener('storelly_pricing_cms_changed', handlePricingChange);
      window.removeEventListener('storelly_razorpay_config_changed', handlePricingChange);
    };
  }, []);

  const notify = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (onNotify) {
      onNotify(msg, type);
    } else {
      console.log(`[Notification ${type}]: ${msg}`);
    }
  };

  // Open Create Plan Modal
  const handleOpenAddPlan = () => {
    setEditingPlanId(null);
    setPlanForm({
      id: 'plan_' + Date.now(),
      name: 'PRO PLUS',
      tagline: 'Custom power tier configured by Super Admin',
      currency: '₹',
      monthlyPrice: 499,
      yearlyPrice: 4999,
      billingCycle: '/ month',
      badge: 'Popular',
      isRecommended: false,
      trialDays: 14,
      isActive: true,
      order: plans.length + 1,
      ctaText: 'Upgrade with Razorpay',
      ctaAction: 'signup',
      features: [
        'Unlimited Products',
        'Custom Domain Link',
        'Direct UPI & Razorpay Checkout',
        'Priority 24/7 Phone Support',
        'Automated Invoice Generator',
      ],
      limits: {
        catalogueItems: 5000,
        monthlyOrders: 10000,
        customerRecords: 10000,
        hasCustomDomain: true,
        hasAiPromotions: true,
        hasDigitalCard: true,
      },
    });
    setFeatureInput('');
    setIsPlanModalOpen(true);
  };

  // Open Edit Plan Modal
  const handleOpenEditPlan = (plan: PlatformPricingPlan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      ...plan,
      currency: plan.currency || '₹',
      features: [...(plan.features || [])],
      limits: {
        catalogueItems: plan.limits?.catalogueItems ?? 100,
        monthlyOrders: plan.limits?.monthlyOrders ?? 500,
        customerRecords: plan.limits?.customerRecords ?? 1000,
        hasCustomDomain: plan.limits?.hasCustomDomain ?? false,
        hasAiPromotions: plan.limits?.hasAiPromotions ?? false,
        hasDigitalCard: plan.limits?.hasDigitalCard ?? true,
      },
    });
    setFeatureInput('');
    setIsPlanModalOpen(true);
  };

  // Duplicate Plan
  const handleDuplicatePlan = async (plan: PlatformPricingPlan) => {
    const duplicated: PlatformPricingPlan = {
      ...plan,
      id: 'plan_' + Date.now(),
      name: `${plan.name} (Copy)`,
      order: plans.length + 1,
    };
    await adminSavePricingPlan(duplicated);
    notify(`Plan duplicated as "${duplicated.name}" and saved to system_settings.`);
    loadData();
  };

  // Delete Plan
  const handleDeletePlan = async (plan: PlatformPricingPlan) => {
    if (plans.length <= 1) {
      alert('You must keep at least 1 pricing plan on the platform.');
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to permanently delete the "${plan.name}" plan?`);
    if (!confirmed) return;

    await adminDeletePricingPlan(plan.id);
    notify(`Plan "${plan.name}" removed from global system_settings.`);
    loadData();
  };

  // Reorder Plans (Move Up/Down)
  const handleMovePlan = async (planId: string, direction: 'up' | 'down') => {
    const index = plans.findIndex((p) => p.id === planId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === plans.length - 1) return;

    const newPlans = [...plans];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newPlans[index];
    newPlans[index] = newPlans[targetIndex];
    newPlans[targetIndex] = temp;

    setPlans(newPlans);
    await adminReorderPricingPlans(newPlans);
    notify('Plan order updated in system_settings.');
  };

  // Toggle Recommended Star
  const handleTogglePlanRecommended = async (plan: PlatformPricingPlan) => {
    const updated = {
      ...plan,
      isRecommended: !plan.isRecommended,
      badge: !plan.isRecommended ? (plan.badge || 'Recommended') : (plan.badge === 'Recommended' ? '' : plan.badge),
    };
    await adminSavePricingPlan(updated);
    notify(`Updated recommendation status for "${plan.name}".`);
    loadData();
  };

  // Add Feature to form
  const handleAddFeature = () => {
    const trimmed = featureInput.trim();
    if (!trimmed) return;
    if (planForm.features.includes(trimmed)) return;
    setPlanForm({ ...planForm, features: [...planForm.features, trimmed] });
    setFeatureInput('');
  };

  // Remove Feature from form
  const handleRemoveFeature = (idx: number) => {
    const updated = [...planForm.features];
    updated.splice(idx, 1);
    setPlanForm({ ...planForm, features: updated });
  };

  // Save Plan Submit
  const handleSavePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name.trim()) {
      alert('Plan name is required.');
      return;
    }

    setIsSavingPlan(true);
    try {
      await adminSavePricingPlan(planForm);
      notify(`Plan "${planForm.name}" published and synced to Firestore global system_settings!`);
      setIsPlanModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to save plan:', err);
      alert('Error saving plan to Firestore.');
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Save Pricing CMS Submit
  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCMS(true);
    try {
      await adminSavePricingCMS(cmsForm);
      setCms(cmsForm);
      notify('Landing page pricing CMS copy saved to system_settings/pricing_cms!');
    } catch (err) {
      console.error('Failed to save CMS copy:', err);
      alert('Error saving CMS copy.');
    } finally {
      setIsSavingCMS(false);
    }
  };

  // Save Razorpay Gateway Config
  const handleSaveRazorpayConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRzp(true);
    try {
      await saveRazorpayConfig(razorpayConfig);
      notify('Razorpay Gateway credentials saved to system_settings/payment_config in Firestore!');
    } catch (err) {
      console.error('Failed to save Razorpay config:', err);
      alert('Error saving Razorpay gateway settings.');
    } finally {
      setIsSavingRzp(false);
    }
  };

  // Test Razorpay Checkout Live/Sandbox
  const handleTestRazorpayCheckout = async (plan: PlatformPricingPlan) => {
    setIsTestingRzp(true);
    try {
      await initiateRazorpaySubscription({
        plan,
        business: {
          id: 'test_biz_admin',
          name: 'Storelly Super Admin Test Store',
          email: 'admin@storelly.com',
          phone: '+91 98765 43210',
        },
        customer: {
          name: 'Super Admin Tester',
          email: 'admin@storelly.com',
          phone: '9876543210',
        },
        onSuccess: (tx) => {
          notify(`Test payment authorized successfully! TxID: ${tx.id}`);
        },
        onFailure: (err) => {
          notify(`Checkout test ended: ${err?.message || 'Cancelled'}`, 'info');
        },
      });
    } catch (err: any) {
      notify(`Razorpay test error: ${err?.message || err}`, 'error');
    } finally {
      setIsTestingRzp(false);
    }
  };

  // Reset to Defaults
  const handleResetToOfficialDefaults = async () => {
    const isConfirm = window.confirm(
      'Reset all pricing tiers and landing page CMS copy to the official Storelly defaults (FREE ₹0 & PRO ₹199)?'
    );
    if (!isConfirm) return;

    const result = await adminResetPricingToDefaults();
    setPlans(result.plans);
    setCms(result.cms);
    setCmsForm(result.cms);
    notify('Reset completed! Default Free & Pro plans restored in system_settings.');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700">Loading SaaS Pricing & System Settings...</p>
        <p className="text-xs text-slate-400 mt-1">Connecting to Firestore `system_settings` collection</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
              ₹
            </div>
            <h3 className="text-lg font-black text-slate-900">Admin SaaS Pricing & Monetization Manager</h3>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              Global system_settings
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 max-w-2xl">
            Update subscription tiers (Free vs Pro), set price points, customize limits, configure Razorpay payments,
            and edit landing page copy. All changes persist to Firestore and sync in real-time across all merchant stores.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetToOfficialDefaults}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Restore official FREE (₹0) and PRO (₹199) defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" /> Defaults
          </button>

          <button
            type="button"
            onClick={handleOpenAddPlan}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" /> Create Tier
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSubTab('tiers')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'tiers'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Subscription Tiers ({plans.length})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('razorpay')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'razorpay'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Razorpay Payment Gateway
          {razorpayConfig.isEnabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('cms')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            subTab === 'cms'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          Landing Page Pricing Copy
        </button>
      </div>

      {/* SUB-TAB 1: SUBSCRIPTION TIERS */}
      {subTab === 'tiers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                Active Store Subscription Plans
              </h4>
              <p className="text-xs text-slate-500">
                Live tiers presented to merchants during registration and in-dashboard upgrade prompts.
              </p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
              Firestore Synced
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, index) => {
              const isRecommended = plan.isRecommended || plan.badge === 'Recommended';
              const isFree = plan.monthlyPrice === 0;

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-3xl border p-6 space-y-4 shadow-sm flex flex-col justify-between relative transition-all duration-200 ${
                    isRecommended
                      ? 'border-2 border-emerald-500 ring-4 ring-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  } ${plan.isActive === false ? 'opacity-60 bg-slate-50' : ''}`}
                >
                  {/* Top Badges & Controls */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {plan.isActive !== false ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                          Live Tier
                        </span>
                      ) : (
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                          Draft / Inactive
                        </span>
                      )}

                      {(plan.badge || isRecommended) && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {plan.badge || 'Recommended'}
                        </span>
                      )}

                      {isFree && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                          Free Forever
                        </span>
                      )}
                    </div>

                    {/* Move Up/Down Order */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMovePlan(plan.id, 'up')}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                        title="Move Up / Left"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === plans.length - 1}
                        onClick={() => handleMovePlan(plan.id, 'down')}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 cursor-pointer"
                        title="Move Down / Right"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Plan Header Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-xl text-slate-900">{plan.name}</h4>
                      <button
                        type="button"
                        onClick={() => handleTogglePlanRecommended(plan)}
                        className={`p-1.5 rounded-xl transition cursor-pointer ${
                          isRecommended ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }`}
                        title={isRecommended ? 'Unset Recommended' : 'Highlight as Recommended'}
                      >
                        <Star className={`w-4 h-4 ${isRecommended ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 min-h-[32px]">{plan.tagline || 'No tagline specified'}</p>

                    <div className="pt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">
                        {plan.currency || '₹'}{plan.monthlyPrice}
                      </span>
                      {plan.billingCycle && (
                        <span className="text-xs text-slate-500 font-semibold">{plan.billingCycle}</span>
                      )}
                      {plan.yearlyPrice && plan.yearlyPrice > 0 && (
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold ml-2">
                          {plan.currency || '₹'}{plan.yearlyPrice}/yr
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 py-3 border-t border-b border-slate-100 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Features Included ({plan.features?.length || 0})
                      </span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700 max-h-48 overflow-y-auto pr-1">
                      {plan.features?.map((f, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-medium truncate">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Limits Summary */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px] space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Max Products:</span>
                      <span className="font-bold text-slate-900">{plan.limits?.catalogueItems ?? 'Unlimited'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Orders:</span>
                      <span className="font-bold text-slate-900">{plan.limits?.monthlyOrders ?? 'Unlimited'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Custom Domain:</span>
                      <span className="font-bold text-slate-900">{plan.limits?.hasCustomDomain ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Marketing:</span>
                      <span className="font-bold text-slate-900">{plan.limits?.hasAiPromotions ? 'Yes' : 'No'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPlan(plan)}
                        className="col-span-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit Tier
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicatePlan(plan)}
                        className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer"
                        title="Duplicate Plan"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePlan(plan)}
                        className="py-2 px-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Test Razorpay Checkout Button */}
                    {!isFree && (
                      <button
                        type="button"
                        disabled={isTestingRzp}
                        onClick={() => handleTestRazorpayCheckout(plan)}
                        className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-950"
                      >
                        <CreditCard className="w-3 h-3 text-emerald-400" />
                        Test Razorpay Checkout (₹{plan.monthlyPrice})
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RAZORPAY GATEWAY */}
      {subTab === 'razorpay' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h4 className="font-extrabold text-base text-slate-900">
                  Razorpay Payment Gateway & Auto-Billing
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure your official Razorpay Key ID and Secret. When merchants upgrade their plan,
                payments are processed securely via Razorpay and their account plan is automatically promoted.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Gateway Status:</span>
              <button
                type="button"
                onClick={() =>
                  setRazorpayConfig({ ...razorpayConfig, isEnabled: !razorpayConfig.isEnabled })
                }
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                  razorpayConfig.isEnabled
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {razorpayConfig.isEnabled ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ENABLED
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5 text-red-600" /> DISABLED
                  </>
                )}
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveRazorpayConfig} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Razorpay Key ID *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={razorpayConfig.keyId}
                    onChange={(e) =>
                      setRazorpayConfig({ ...razorpayConfig, keyId: e.target.value })
                    }
                    placeholder="rzp_test_... or rzp_live_..."
                    className="w-full text-xs p-2.5 pl-9 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Find this in your Razorpay Dashboard &rarr; Settings &rarr; API Keys.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Razorpay Key Secret (Optional / Server-Side)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={razorpayConfig.keySecret || ''}
                    onChange={(e) =>
                      setRazorpayConfig({ ...razorpayConfig, keySecret: e.target.value })
                    }
                    placeholder="••••••••••••••••••••••••"
                    className="w-full text-xs p-2.5 pl-9 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Stored securely for webhook and signature verification.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Razorpay Webhook Secret (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={razorpayConfig.webhookSecret || ''}
                    onChange={(e) =>
                      setRazorpayConfig({ ...razorpayConfig, webhookSecret: e.target.value })
                    }
                    placeholder="••••••••••••••••••••••••"
                    className="w-full text-xs p-2.5 pl-9 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Used to verify incoming subscription events from Razorpay.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Checkout Business / Merchant Name
                </label>
                <input
                  type="text"
                  value={razorpayConfig.merchantName}
                  onChange={(e) =>
                    setRazorpayConfig({ ...razorpayConfig, merchantName: e.target.value })
                  }
                  placeholder="e.g. Storelly Business OS"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Modal Theme Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={razorpayConfig.merchantThemeColor || '#155330'}
                    onChange={(e) =>
                      setRazorpayConfig({ ...razorpayConfig, merchantThemeColor: e.target.value })
                    }
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={razorpayConfig.merchantThemeColor || '#155330'}
                    onChange={(e) =>
                      setRazorpayConfig({ ...razorpayConfig, merchantThemeColor: e.target.value })
                    }
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Checkbox Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={razorpayConfig.isTestMode}
                  onChange={(e) =>
                    setRazorpayConfig({ ...razorpayConfig, isTestMode: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Test Mode (Sandbox Simulation)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Use simulated test payments without debiting real bank cards.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={razorpayConfig.autoUpgradePlan}
                  onChange={(e) =>
                    setRazorpayConfig({ ...razorpayConfig, autoUpgradePlan: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Auto-Upgrade Store Tier on Success
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Promotes store profile in Firestore instantly to 'pro' plan upon verified transaction.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Saves directly to <code className="text-slate-800 font-mono">system_settings/payment_config</code>
              </div>

              <button
                type="submit"
                disabled={isSavingRzp}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 active:scale-95"
              >
                {isSavingRzp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save & Deploy Gateway Config
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 3: CMS SECTION COPY */}
      {subTab === 'cms' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-600" />
                Landing Page Pricing Section Content (CMS)
              </h4>
              <p className="text-xs text-slate-500">
                Edit the public badge, headline, subtitle, and footer guarantee displayed on the Storelly landing page.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveCMS} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Section Badge</label>
                <input
                  type="text"
                  value={cmsForm.badge}
                  onChange={(e) => setCmsForm({ ...cmsForm, badge: e.target.value })}
                  placeholder="e.g. Transparent Pricing"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Section Headline (H2) *</label>
                <input
                  type="text"
                  value={cmsForm.title}
                  onChange={(e) => setCmsForm({ ...cmsForm, title: e.target.value })}
                  placeholder="e.g. Start Free. Upgrade When You Grow."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Section Subtitle</label>
                <input
                  type="text"
                  value={cmsForm.subtitle}
                  onChange={(e) => setCmsForm({ ...cmsForm, subtitle: e.target.value })}
                  placeholder="e.g. Start free, upgrade as your business grows. No hidden fees."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Footer Guarantee / Note</label>
                <input
                  type="text"
                  value={cmsForm.footerNote}
                  onChange={(e) => setCmsForm({ ...cmsForm, footerNote: e.target.value })}
                  placeholder="e.g. Same simple pricing for vendors and creators."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingCMS}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSavingCMS ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save & Sync to system_settings/pricing_cms
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PLAN EDIT & CREATE MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingPlanId ? `Edit Tier: ${planForm.name}` : 'Create New Subscription Tier'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure price, features, usage quotas, and Razorpay upgrade action.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Form (7 cols) */}
              <form id="plan-form-modal" onSubmit={handleSavePlanSubmit} className="lg:col-span-7 space-y-5">
                {/* Basic Details */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Basic Information
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Plan Name *</label>
                      <input
                        type="text"
                        value={planForm.name}
                        onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                        placeholder="e.g. FREE, PRO, ENTERPRISE"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={planForm.badge || ''}
                        onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                        placeholder="e.g. Recommended, Popular"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tagline / Subtitle</label>
                    <input
                      type="text"
                      value={planForm.tagline}
                      onChange={(e) => setPlanForm({ ...planForm, tagline: e.target.value })}
                      placeholder="e.g. Get started without upfront cost."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Pricing & Billing */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Pricing & Billing
                  </h5>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                          {planForm.currency || '₹'}
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={planForm.monthlyPrice}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, monthlyPrice: Number(e.target.value) })
                          }
                          className="w-full text-xs p-2.5 pl-7 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Yearly Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                          {planForm.currency || '₹'}
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={planForm.yearlyPrice || 0}
                          onChange={(e) =>
                            setPlanForm({ ...planForm, yearlyPrice: Number(e.target.value) })
                          }
                          className="w-full text-xs p-2.5 pl-7 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Billing Label</label>
                      <input
                        type="text"
                        value={planForm.billingCycle || ''}
                        onChange={(e) => setPlanForm({ ...planForm, billingCycle: e.target.value })}
                        placeholder="e.g. / month"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="flex items-center gap-6 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={planForm.isActive !== false}
                        onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      Active & Visible on Storefront
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={planForm.isRecommended || false}
                        onChange={(e) =>
                          setPlanForm({
                            ...planForm,
                            isRecommended: e.target.checked,
                            badge: e.target.checked ? planForm.badge || 'Recommended' : planForm.badge,
                          })
                        }
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      Highlight as Recommended
                    </label>
                  </div>
                </div>

                {/* Call To Action */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Button Action
                  </h5>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CTA Button Text</label>
                      <input
                        type="text"
                        value={planForm.ctaText || ''}
                        onChange={(e) => setPlanForm({ ...planForm, ctaText: e.target.value })}
                        placeholder="e.g. Start Free, Get Started"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Action Type</label>
                      <select
                        value={planForm.ctaAction || 'signup'}
                        onChange={(e) => setPlanForm({ ...planForm, ctaAction: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="signup">Open Signup / Registration</option>
                        <option value="login">Open Login Modal</option>
                        <option value="contact">Contact Support</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Features List ({planForm.features.length})
                    </h5>
                    <span className="text-[11px] text-slate-500">Quick-click presets below</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      placeholder="Type a feature and click Add (e.g. Razorpay Integration)"
                      className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      'Store link',
                      'Basic storefront',
                      'Limited products',
                      'More products',
                      'QR code',
                      'WhatsApp orders',
                      'UPI payments',
                      'Razorpay Integration',
                      'Advanced storefront features',
                      'Digital products',
                      'Booking',
                      'Link hub',
                      'Analytics',
                      'Priority support',
                      'Custom domain',
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!planForm.features.includes(preset)) {
                            setPlanForm({ ...planForm, features: [...planForm.features, preset] });
                          }
                        }}
                        disabled={planForm.features.includes(preset)}
                        className={`text-[11px] px-2 py-1 rounded-lg border transition cursor-pointer ${
                          planForm.features.includes(preset)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 opacity-60 cursor-default'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'
                        }`}
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>

                  {/* Features Pills List */}
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {planForm.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                          title="Remove feature"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Account Limits */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Account Limits & Quotas
                  </h5>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Max Products</label>
                      <input
                        type="number"
                        min="1"
                        value={planForm.limits?.catalogueItems ?? 100}
                        onChange={(e) =>
                          setPlanForm({
                            ...planForm,
                            limits: { ...planForm.limits, catalogueItems: Number(e.target.value) },
                          })
                        }
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Monthly Orders</label>
                      <input
                        type="number"
                        min="1"
                        value={planForm.limits?.monthlyOrders ?? 500}
                        onChange={(e) =>
                          setPlanForm({
                            ...planForm,
                            limits: { ...planForm.limits, monthlyOrders: Number(e.target.value) },
                          })
                        }
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">CRM Limit</label>
                      <input
                        type="number"
                        min="1"
                        value={planForm.limits?.customerRecords ?? 1000}
                        onChange={(e) =>
                          setPlanForm({
                            ...planForm,
                            limits: { ...planForm.limits, customerRecords: Number(e.target.value) },
                          })
                        }
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.limits?.hasCustomDomain ?? false}
                        onChange={(e) =>
                          setPlanForm({
                            ...planForm,
                            limits: { ...planForm.limits, hasCustomDomain: e.target.checked },
                          })
                        }
                        className="rounded text-emerald-600"
                      />
                      Custom Domain
                    </label>

                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.limits?.hasAiPromotions ?? false}
                        onChange={(e) =>
                          setPlanForm({
                            ...planForm,
                            limits: { ...planForm.limits, hasAiPromotions: e.target.checked },
                          })
                        }
                        className="rounded text-emerald-600"
                      />
                      AI Marketing
                    </label>

                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.limits?.hasDigitalCard ?? true}
                        onChange={(e) =>
                          setPlanForm({
                            ...planForm,
                            limits: { ...planForm.limits, hasDigitalCard: e.target.checked },
                          })
                        }
                        className="rounded text-emerald-600"
                      />
                      Digital Card
                    </label>
                  </div>
                </div>
              </form>

              {/* Right Live Preview Card (5 cols) */}
              <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Storefront Preview
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                      Live Mockup
                    </span>
                  </div>

                  <div
                    className={`rounded-3xl p-6 relative transition-all shadow-md ${
                      planForm.isRecommended || planForm.badge === 'Recommended'
                        ? 'bg-white border-2 border-emerald-600 shadow-xl'
                        : 'bg-white border border-slate-200'
                    }`}
                  >
                    {(planForm.badge || planForm.isRecommended) && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-white" /> {planForm.badge || 'Recommended'}
                      </div>
                    )}

                    <h4 className="text-xl font-black text-slate-900 mb-1">{planForm.name || 'PLAN NAME'}</h4>

                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-black text-slate-900">
                        {planForm.currency || '₹'}{planForm.monthlyPrice}
                      </span>
                      {planForm.billingCycle && (
                        <span className="text-xs text-slate-500 font-semibold">{planForm.billingCycle}</span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mb-6">{planForm.tagline || 'Short descriptive tagline'}</p>

                    <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
                      {planForm.features.length === 0 && (
                        <li className="text-slate-400 italic">No features added yet</li>
                      )}
                      {planForm.features.map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-medium">{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <div
                      className={`w-full py-3 rounded-full text-center text-xs font-bold transition shadow-xs ${
                        planForm.isRecommended || planForm.badge === 'Recommended'
                          ? 'bg-emerald-600 text-white'
                          : 'border-2 border-emerald-200 text-emerald-700 bg-emerald-50'
                      }`}
                    >
                      {planForm.ctaText || (planForm.monthlyPrice === 0 ? 'Start Free' : 'Get Started')}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 text-center">
                  <p className="text-[11px] text-slate-400">
                    Saves instantly to Firestore <code className="font-mono text-slate-600">system_settings</code> and syncs across all live vendor storefronts.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="plan-form-modal"
                disabled={isSavingPlan}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 active:scale-95"
              >
                {isSavingPlan ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {editingPlanId ? 'Update & Publish Tier' : 'Create & Publish Tier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
