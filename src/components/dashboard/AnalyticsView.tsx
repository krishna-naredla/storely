import React, { useState, useEffect } from 'react';
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

  const avgOrderValue =
    summary && summary.totalOrders > 0
      ? Math.round(summary.totalRevenue / summary.totalOrders)
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
          Store Analytics & Intelligence
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Real-time metrics computed directly from your Firestore orders, bookings, and customer records.
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              {business.currencySymbol === '$' ? (
                <DollarSign className="w-4 h-4" />
              ) : (
                <IndianRupee className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            {isLoading ? '...' : `${business.currencySymbol}${(summary?.totalRevenue ?? 0).toLocaleString()}`}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>Direct storefront revenue</span>
          </p>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            {isLoading ? '...' : summary?.totalOrders ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">Total checkouts processed</p>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Order</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            {isLoading ? '...' : `${business.currencySymbol}${avgOrderValue}`}
          </div>
          <p className="text-[11px] text-slate-400">Per customer order value</p>
        </div>

        {/* Total Customers */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Base</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            {isLoading ? '...' : summary?.totalCustomers ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">Direct buyers in CRM</p>
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
