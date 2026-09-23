import React, { useState, useEffect } from 'react';
import { isCreatorProfile } from '../../utils/profileHelper';
import {
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  DollarSign,
  Users,
  CalendarCheck,
  Package,
  ArrowUpRight,
  Eye,
  CheckCircle2,
  Clock,
  MessageCircle,
  MousePointerClick,
  FileDown,
  ExternalLink,
} from 'lucide-react';
import { BusinessProfile, AnalyticsSummary } from '../../types';
import { getAnalyticsSummary, getOrders } from '../../services/firebaseService';

interface AnalyticsViewProps {
  business: BusinessProfile;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ business }) => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getAnalyticsSummary(business.id);
        setSummary(data);
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [business.id]);

  const isCreator = isCreatorProfile(business);

  const avgOrderValue =
    summary && summary.totalOrders > 0
      ? Math.round(summary.totalRevenue / summary.totalOrders)
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
          {isCreator ? 'Performance & Creator Analytics' : 'Store Analytics & Intelligence'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          {isCreator 
            ? 'Track your profile visibility, link engagement, and digital product performance.'
            : 'Real-time metrics computed directly from your Firestore orders, bookings, and customer records.'}
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profile Visibility / Gross Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isCreator ? 'Profile Views' : 'Gross Revenue'}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isCreator ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {isCreator ? (
                <Eye className="w-4 h-4" />
              ) : business.currencySymbol === '$' ? (
                <DollarSign className="w-4 h-4" />
              ) : (
                <IndianRupee className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            {isLoading ? '...' : isCreator ? (summary?.totalViews ?? 0).toLocaleString() : `${business.currencySymbol}${(summary?.totalRevenue ?? 0).toLocaleString()}`}
          </div>
          <p className={`text-[11px] font-semibold flex items-center gap-1 ${isCreator ? 'text-indigo-700' : 'text-emerald-700'}`}>
            <ArrowUpRight className="w-3 h-3" />
            <span>{isCreator ? 'Total profile traffic' : 'Direct storefront revenue'}</span>
          </p>
        </div>

        {/* Link Clicks / Total Orders */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isCreator ? 'Link Engagement' : 'Total Orders'}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isCreator ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'}`}>
              {isCreator ? <MousePointerClick className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            {isLoading ? '...' : isCreator ? (summary?.totalClicks ?? 0).toLocaleString() : summary?.totalOrders ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">
            {isCreator ? 'Clicks on your bio links' : 'Total checkouts processed'}
          </p>
        </div>

        {/* Digital Downloads / Average Order Value */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isCreator ? 'Digital Sales' : 'Average Order'}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isCreator ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
              {isCreator ? <FileDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            {isLoading ? '...' : isCreator ? (summary?.totalDigitalSales ?? summary?.totalOrders ?? 0) : `${business.currencySymbol}${avgOrderValue}`}
          </div>
          <p className="text-[11px] text-slate-400">
            {isCreator ? 'Successful digital deliveries' : 'Per customer order value'}
          </p>
        </div>

        {/* Customer Base */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isCreator ? 'Client Base' : 'Customer Base'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            {isLoading ? '...' : summary?.totalCustomers ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">
            {isCreator ? 'Direct buyers & clients' : 'Direct buyers in CRM'}
          </p>
        </div>
      </div>

      {/* Deep Dive Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Catalog & Operations Health */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Operational Summary
          </h3>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600">Active Listed Products / Services</span>
              <span className="font-bold text-slate-900">{summary?.totalProducts ?? 0}</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600">Total Bookings & Inquiries</span>
              <span className="font-bold text-slate-900">{summary?.totalBookings ?? 0}</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600">WhatsApp Commerce Readiness</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active 100%
              </span>
            </div>
          </div>
        </div>

        {/* Growth Recommendations */}
        <div className="p-5 rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <MessageCircle className="w-4 h-4" />
            <span>Storelly Growth Engine</span>
          </div>

          <h4 className="text-base font-bold font-heading">
            How to increase your direct sales
          </h4>

          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span>
                <strong>Share WhatsApp Catalog:</strong> Post your public link on your WhatsApp Status and Instagram bio.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span>
                <strong>Print & Display QR Code:</strong> Use the Digital Card view to download and display table/counter QR stands.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span>
                <strong>Launch Festive Offers:</strong> Use the Promotions manager to create 10-20% discounts for repeat customers.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
