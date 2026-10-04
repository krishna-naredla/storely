import React, { useState, useEffect } from 'react';
import {
  Eye,
  MousePointerClick,
  TrendingUp,
  Download,
  CalendarCheck,
  Ticket,
  FileText,
  Star,
  Sparkles,
  Link as LinkIcon,
  Briefcase,
  ArrowUpRight,
  Clock,
  Filter,
  BarChart3,
  Calendar,
  Layers,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BusinessProfile, CreatorAnalyticsSummary } from '../../types';
import { getCreatorAnalyticsSummary } from '../../services/firebaseService';
import { isCreatorModuleEnabled } from '../../utils/creatorModuleManager';

interface CreatorAnalyticsViewProps {
  business: BusinessProfile;
}

type TimeRangeFilter = 'today' | '7d' | '30d' | '90d' | 'all';
type ActiveModuleTab = 'all' | 'biolink' | 'portfolio' | 'store' | 'consultations' | 'events' | 'quotes' | 'reviews' | 'affiliate';

export const CreatorAnalyticsView: React.FC<CreatorAnalyticsViewProps> = ({ business }) => {
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('7d');
  const [activeModuleTab, setActiveModuleTab] = useState<ActiveModuleTab>('all');
  const [data, setData] = useState<CreatorAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState<'traffic' | 'monetization'>('traffic');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const summary = await getCreatorAnalyticsSummary(business.id, timeRange);
        if (isMounted) {
          setData(summary);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading creator analytics:', err);
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [business.id, timeRange]);

  const currencySymbol = business.currencySymbol || '₹';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-[var(--r8)] bg-purple-100 text-purple-800 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600" />
              Creator Analytics Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--t1)] font-heading mt-1">
            Performance &amp; Audience Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-[var(--t2)] mt-0.5">
            Real telemetry and revenue events aggregated across your active creator modules.
          </p>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center gap-1 bg-[var(--bg)] p-1 rounded-[var(--r12)] border border-[var(--border)] self-start sm:self-auto shadow-[var(--shadow-xs)]">
          {(['today', '7d', '30d', '90d', 'all'] as TimeRangeFilter[]).map((range) => {
            const labelMap: Record<TimeRangeFilter, string> = {
              today: 'Today',
              '7d': '7 Days',
              '30d': '30 Days',
              '90d': '90 Days',
              all: 'All Time',
            };
            const isActive = timeRange === range;
            return (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-[var(--r8)] text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-[var(--shadow-xs)]'
                    : 'text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--card)]'
                }`}
              >
                {labelMap[range]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Views */}
        <div className="p-5 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider">Total Views</span>
            <div className="w-8 h-8 rounded-[var(--r8)] flex items-center justify-center bg-indigo-50 text-indigo-600">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--t1)] font-heading tabular-nums">
            {isLoading ? '...' : (data?.totalViews ?? 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-[var(--t3)] flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500" />
            <span>Profile, bio &amp; portfolio impressions</span>
          </p>
        </div>

        {/* Total Interactions / Clicks */}
        <div className="p-5 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider">Outbound Clicks</span>
            <div className="w-8 h-8 rounded-[var(--r8)] flex items-center justify-center bg-purple-50 text-purple-600">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--t1)] font-heading tabular-nums">
            {isLoading ? '...' : (data?.totalClicks ?? 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-[var(--t3)]">
            Overall CTR: <strong className="text-purple-600">{data?.overallCtr ?? 0}%</strong>
          </p>
        </div>

        {/* Conversions & Bookings */}
        <div className="p-5 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider">Conversions</span>
            <div className="w-8 h-8 rounded-[var(--r8)] flex items-center justify-center bg-emerald-50 text-emerald-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--t1)] font-heading tabular-nums">
            {isLoading ? '...' : (data?.totalConversions ?? 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-[var(--t3)]">
            Sales, consultations &amp; ticket bookings
          </p>
        </div>

        {/* Creator Gross Revenue */}
        <div className="p-5 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider">Direct Earnings</span>
            <div className="w-8 h-8 rounded-[var(--r8)] flex items-center justify-center bg-amber-50 text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--t1)] font-heading tabular-nums">
            {isLoading ? '...' : `${currencySymbol}${(data?.totalRevenue ?? 0).toLocaleString()}`}
          </div>
          <p className="text-[11px] text-[var(--t3)]">
            Authoritative Firestore settlement total
          </p>
        </div>
      </div>

      {/* Interactive Time-Series Charts */}
      <div className="p-5 sm:p-6 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-[var(--r8)] bg-purple-100 text-purple-600">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--t1)] font-heading">
                {chartMetric === 'traffic'
                  ? 'Audience Reach & Interaction Trends'
                  : 'Monetization Velocity & Conversions'}
              </h3>
            </div>
            <p className="text-xs text-[var(--t2)]">
              Daily telemetry trend series for the selected timeframe.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[var(--bg)] p-1 rounded-[var(--r8)] border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setChartMetric('traffic')}
              className={`px-3 py-1 text-xs font-bold rounded-[var(--r6)] transition cursor-pointer ${
                chartMetric === 'traffic'
                  ? 'bg-purple-600 text-white'
                  : 'text-[var(--t2)] hover:text-[var(--t1)]'
              }`}
            >
              Traffic &amp; Clicks
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('monetization')}
              className={`px-3 py-1 text-xs font-bold rounded-[var(--r6)] transition cursor-pointer ${
                chartMetric === 'monetization'
                  ? 'bg-emerald-600 text-white'
                  : 'text-[var(--t2)] hover:text-[var(--t1)]'
              }`}
            >
              Conversions &amp; Revenue
            </button>
          </div>
        </div>

        <div className="w-full h-72 sm:h-80">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-[var(--bg)] rounded-[var(--r12)] animate-pulse">
              <span className="text-xs text-[var(--t3)] font-medium">Loading time series chart...</span>
            </div>
          ) : data?.dailyTrends && data.dailyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartMetric === 'traffic' ? (
                <ComposedChart
                  data={data.dailyTrends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const row = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1 z-50 min-w-[160px]">
                            <div className="font-bold border-b border-slate-800 pb-1 flex justify-between">
                              <span>{label}</span>
                              <span className="text-slate-400 text-[10px]">{row.dateStr}</span>
                            </div>
                            <div className="flex justify-between text-indigo-300">
                              <span>Views:</span>
                              <span className="font-bold">{row.views}</span>
                            </div>
                            <div className="flex justify-between text-purple-300">
                              <span>Clicks:</span>
                              <span className="font-bold">{row.clicks}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }} />
                  <Bar dataKey="views" name="Content & Profile Views" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="clicks" name="Link & Referral Clicks" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                </ComposedChart>
              ) : (
                <ComposedChart
                  data={data.dailyTrends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#94a3b8"
                    fontSize={11}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#10b981"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const row = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-1 z-50 min-w-[160px]">
                            <div className="font-bold border-b border-slate-800 pb-1 flex justify-between">
                              <span>{label}</span>
                              <span className="text-slate-400 text-[10px]">{row.dateStr}</span>
                            </div>
                            <div className="flex justify-between text-blue-300">
                              <span>Conversions:</span>
                              <span className="font-bold">{row.conversions}</span>
                            </div>
                            <div className="flex justify-between text-emerald-300">
                              <span>Day Revenue:</span>
                              <span className="font-bold">{currencySymbol}{row.revenue}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }} />
                  <Bar yAxisId="left" dataKey="conversions" name="Conversions / Bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" name={`Revenue (${currencySymbol})`} stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--bg)] rounded-[var(--r12)] border border-dashed border-[var(--border)] text-center p-6 space-y-2">
              <BarChart3 className="w-8 h-8 text-[var(--t3)]" />
              <p className="text-xs font-bold text-[var(--t1)]">No analytics events recorded for this timeframe yet</p>
              <p className="text-[11px] text-[var(--t3)]">Share your public link to start tracking visitor views and clicks.</p>
            </div>
          )}
        </div>
      </div>

      {/* Module-by-Module Breakdown Navigation */}
      <div className="space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Modules' },
            { id: 'biolink', label: 'Universal Bio Link', enabled: isCreatorModuleEnabled(business, 'universal_bio_link') },
            { id: 'portfolio', label: 'Portfolio Showcase', enabled: isCreatorModuleEnabled(business, 'work_portfolio') },
            { id: 'store', label: 'Digital Store', enabled: isCreatorModuleEnabled(business, 'digital_products') },
            { id: 'consultations', label: '1:1 Consultations', enabled: isCreatorModuleEnabled(business, 'booking_appointments') },
            { id: 'events', label: 'Events & Tickets', enabled: isCreatorModuleEnabled(business, 'events_ticketing') },
            { id: 'quotes', label: 'Custom Quotes', enabled: isCreatorModuleEnabled(business, 'custom_quotes') },
            { id: 'reviews', label: 'Client Reviews', enabled: isCreatorModuleEnabled(business, 'reviews') },
            { id: 'affiliate', label: 'Affiliates & Deals', enabled: isCreatorModuleEnabled(business, 'affiliate_products') },
          ]
            .filter((tab) => tab.id === 'all' || tab.enabled)
            .map((tab) => {
              const isActive = activeModuleTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveModuleTab(tab.id as ActiveModuleTab)}
                  className={`px-3.5 py-1.5 rounded-[var(--r12)] text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                    isActive
                      ? 'bg-purple-600 text-white border-purple-600 shadow-[var(--shadow-xs)]'
                      : 'bg-[var(--card)] border-[var(--border)] text-[var(--t2)] hover:text-[var(--t1)] hover:bg-[var(--bg)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
        </div>

        {/* Detailed Breakdown Grid based on selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Bio Link Block */}
          {(activeModuleTab === 'all' || activeModuleTab === 'biolink') && isCreatorModuleEnabled(business, 'universal_bio_link') && (
            <div className="p-5 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--t1)] font-heading flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-purple-600" />
                  <span>Bio Link Metrics</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[var(--r4)] bg-purple-50 text-purple-700">
                  CTR: {data?.bioLink.ctr ?? 0}%
                </span>
              </div>
              <div className="divide-y divide-[var(--border)] text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Total Impressions:</span>
                  <span className="font-bold text-[var(--t1)]">{data?.bioLink.views ?? 0}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Outbound Link Clicks:</span>
                  <span className="font-bold text-[var(--t1)]">{data?.bioLink.clicks ?? 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Block */}
          {(activeModuleTab === 'all' || activeModuleTab === 'portfolio') && isCreatorModuleEnabled(business, 'work_portfolio') && (
            <div className="p-5 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--t1)] font-heading flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  <span>Portfolio Metrics</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[var(--r4)] bg-indigo-50 text-indigo-700">
                  {data?.portfolio.views ?? 0} Views
                </span>
              </div>
              <div className="divide-y divide-[var(--border)] text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Project Case Study Views:</span>
                  <span className="font-bold text-[var(--t1)]">{data?.portfolio.projectViews ?? 0}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Direct Inquiries:</span>
                  <span className="font-bold text-[var(--t1)]">{data?.portfolio.enquiries ?? 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Digital Store Block */}
          {(activeModuleTab === 'all' || activeModuleTab === 'store') && isCreatorModuleEnabled(business, 'digital_products') && (
            <div className="p-5 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--t1)] font-heading flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Digital Store &amp; Downloads</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[var(--r4)] bg-emerald-50 text-emerald-700">
                  {currencySymbol}{data?.digitalStore.revenue ?? 0}
                </span>
              </div>
              <div className="divide-y divide-[var(--border)] text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Paid Orders:</span>
                  <span className="font-bold text-[var(--t1)]">{data?.digitalStore.salesCount ?? 0}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Total File Deliveries:</span>
                  <span className="font-bold text-[var(--t1)]">{data?.digitalStore.downloadsCount ?? 0}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Storefront Conversion:</span>
                  <span className="font-bold text-emerald-700">{data?.digitalStore.conversionRate ?? 0}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Consultations Block */}
          {(activeModuleTab === 'all' || activeModuleTab === 'consultations') && isCreatorModuleEnabled(business, 'booking_appointments') && (
            <div className="p-5 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--t1)] font-heading flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-blue-600" />
                  <span>1:1 Consultations</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[var(--r4)] bg-blue-50 text-blue-700">
                  {currencySymbol}{data?.consultations.revenue ?? 0}
                </span>
              </div>
              <div className="divide-y divide-[var(--border)] text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Total Scheduled:</span>
                  <span className="font-bold text-[var(--t1)]">{data?.consultations.totalBookings ?? 0}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Completed Sessions:</span>
                  <span className="font-bold text-blue-700">{data?.consultations.completedBookings ?? 0}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Pending Confirmations:</span>
                  <span className="font-bold text-amber-700">{data?.consultations.pendingBookings ?? 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Events Block */}
          {(activeModuleTab === 'all' || activeModuleTab === 'events') && isCreatorModuleEnabled(business, 'events_ticketing') && (
            <div className="p-5 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--t1)] font-heading flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-amber-600" />
                  <span>Events &amp; Workshops</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[var(--r4)] bg-amber-50 text-amber-700">
                  {currencySymbol}{data?.events.revenue ?? 0}
                </span>
              </div>
              <div className="divide-y divide-[var(--border)] text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Tickets Issued:</span>
                  <span className="font-bold text-[var(--t1)]">{data?.events.ticketsSold ?? 0}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Checked-in Attendance:</span>
                  <span className="font-bold text-emerald-700">{data?.events.attendanceCount ?? 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quotes Block */}
          {(activeModuleTab === 'all' || activeModuleTab === 'quotes') && isCreatorModuleEnabled(business, 'custom_quotes') && (
            <div className="p-5 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--t1)] font-heading flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Custom Quotes</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[var(--r4)] bg-rose-50 text-rose-700">
                  {currencySymbol}{data?.quotes.revenue ?? 0}
                </span>
              </div>
              <div className="divide-y divide-[var(--border)] text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Total Intake Requests:</span>
                  <span className="font-bold text-[var(--t1)]">{data?.quotes.enquiriesCount ?? 0}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Quotes Accepted &amp; Paid:</span>
                  <span className="font-bold text-emerald-700">{data?.quotes.quotesPaid ?? 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Reviews Block */}
          {(activeModuleTab === 'all' || activeModuleTab === 'reviews') && isCreatorModuleEnabled(business, 'reviews') && (
            <div className="p-5 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--t1)] font-heading flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Ratings &amp; Feedback</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[var(--r4)] bg-amber-50 text-amber-800">
                  {data?.reviews.averageRating ?? 0} ★
                </span>
              </div>
              <div className="divide-y divide-[var(--border)] text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Total Submitted:</span>
                  <span className="font-bold text-[var(--t1)]">{data?.reviews.total ?? 0}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Published Reviews:</span>
                  <span className="font-bold text-emerald-700">{data?.reviews.published ?? 0}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Pending Moderation:</span>
                  <span className="font-bold text-amber-700">{data?.reviews.pending ?? 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Affiliate Block */}
          {(activeModuleTab === 'all' || activeModuleTab === 'affiliate') && isCreatorModuleEnabled(business, 'affiliate_products') && (
            <div className="p-5 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--t1)] font-heading flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Affiliate Recommendations</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[var(--r4)] bg-teal-50 text-teal-700">
                  CTR: {data?.affiliate.ctr ?? 0}%
                </span>
              </div>
              <div className="divide-y divide-[var(--border)] text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Deals Page Impressions:</span>
                  <span className="font-bold text-[var(--t1)]">{data?.affiliate.impressions ?? 0}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[var(--t2)]">Outbound Referral Clicks:</span>
                  <span className="font-bold text-teal-700">{data?.affiliate.outboundClicks ?? 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Live Activity Stream */}
      <div className="p-5 sm:p-6 rounded-[var(--r16)] bg-[var(--card)] border border-[var(--border)] shadow-[var(--shadow-xs)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[var(--t1)] uppercase tracking-wider font-heading flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>Live Creator Activity Feed</span>
          </h3>
          <span className="text-[11px] text-[var(--t3)] font-medium">Real-time telemetry</span>
        </div>

        {isLoading ? (
          <div className="space-y-2 py-4">
            <div className="h-10 bg-[var(--bg)] rounded-[var(--r8)] animate-pulse" />
            <div className="h-10 bg-[var(--bg)] rounded-[var(--r8)] animate-pulse" />
          </div>
        ) : data?.recentEvents && data.recentEvents.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {data.recentEvents.map((evt) => (
              <div key={evt.id} className="py-3 flex items-center justify-between text-xs hover:bg-[var(--bg)] px-2 rounded-[var(--r8)] transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[var(--r8)] bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--t1)]">{evt.title}</h4>
                    <p className="text-[11px] text-[var(--t3)]">{evt.subtitle}</p>
                  </div>
                </div>
                <div className="text-[10px] text-[var(--t3)] font-medium whitespace-nowrap">
                  {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(evt.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-[var(--bg)] rounded-[var(--r12)] border border-dashed border-[var(--border)] space-y-1">
            <Clock className="w-8 h-8 text-[var(--t3)] mx-auto mb-2" />
            <p className="text-xs font-bold text-[var(--t1)]">No activity recorded for this timeframe yet</p>
            <p className="text-[11px] text-[var(--t3)]">Events will appear live as audience and clients interact with your links.</p>
          </div>
        )}
      </div>
    </div>
  );
};
