import { useLanguage } from '../../context/LanguageContext';
import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  MessageCircle,
  Phone,
  ShoppingBag,
  CalendarCheck,
  IndianRupee,
  DollarSign,
  UserCheck,
  Download,
  Ticket,
  FileText,
  Star,
  Package,
  Filter,
} from 'lucide-react';
import { BusinessProfile, Customer } from '../../types';
import { getCustomers } from '../../services/firebaseService';
import { exportToCSV } from '../../utils/export';
import { isCreatorProfile } from '../../utils/profileHelper';

interface CustomerManagerProps {
  business: BusinessProfile;
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({ business }) => {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');

  const isCreator = isCreatorProfile(business);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const fetched = await getCustomers(business.id);
      setCustomers(fetched);
    } catch (err) {
      console.error('Error loading customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business.id]);

  const handleWhatsApp = (cust: Customer) => {
    const phone = cust.whatsapp || cust.phone;
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hello ${cust.name}! Greetings from *${business.name}*! How can we assist you today?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleExportCSV = () => {
    const dataToExport = filteredCustomers.map((c) => ({
      Name: c.name,
      Phone: c.phone,
      WhatsApp: c.whatsapp || '',
      Email: c.email || '',
      TotalOrders: c.totalOrders || 0,
      TotalBookings: c.totalBookings || 0,
      TotalSpent: c.totalSpent || 0,
      SourceModule: c.sourceModule || (c.sourceModules && c.sourceModules.join(', ')) || 'General',
      Address: c.address || '',
      LastInteraction: c.lastInteractionAt ? new Date(c.lastInteractionAt).toISOString() : '',
    }));
    exportToCSV(`Storelly_CRM_${business.slug || business.id}`, dataToExport);
  };

  const getSourceBadge = (source?: string, sourceModules?: string[]) => {
    const sources = sourceModules && sourceModules.length > 0 ? sourceModules : [source || 'storefront'];
    
    return (
      <div className="flex flex-wrap items-center gap-1 mt-1">
        {sources.map((s, idx) => {
          switch (s) {
            case 'digital_store':
              return (
                <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                  <Package className="w-3 h-3" /> Digital Store
                </span>
              );
            case 'consultation':
              return (
                <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  <CalendarCheck className="w-3 h-3" /> 1:1 Session
                </span>
              );
            case 'event':
              return (
                <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                  <Ticket className="w-3 h-3" /> Event Ticket
                </span>
              );
            case 'quote':
              return (
                <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                  <FileText className="w-3 h-3" /> Custom Quote
                </span>
              );
            case 'review':
              return (
                <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200">
                  <Star className="w-3 h-3" /> Testimonial
                </span>
              );
            default:
              return (
                <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShoppingBag className="w-3 h-3" /> Store Order
                </span>
              );
          }
        })}
      </div>
    );
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesQuery =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesQuery) return false;

    if (selectedModuleFilter === 'all') return true;

    const sources = [
      c.sourceModule,
      ...(c.sourceModules || [])
    ].filter(Boolean);

    return sources.includes(selectedModuleFilter);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            {isCreator ? 'Audience & Client Directory (CRM)' : 'Customer Directory (CRM)'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isCreator
              ? 'Aggregated client records from digital sales, consultations, event tickets, quotes, and reviews.'
              : 'Real customer records aggregated automatically from orders, bookings, and inquiries.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
            isCreator ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            Total {isCreator ? 'Clients' : 'Customers'}: {customers.length}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${isCreator ? 'clients' : 'customers'} by name, phone, or email...`}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>

        {/* Source module filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {[
            { id: 'all', label: 'All Contacts' },
            ...(isCreator
              ? [
                  { id: 'digital_store', label: 'Digital Store' },
                  { id: 'consultation', label: '1:1 Consultations' },
                  { id: 'event', label: 'Event Tickets' },
                  { id: 'quote', label: 'Custom Quotes' },
                  { id: 'review', label: 'Reviewers' },
                ]
              : [
                  { id: 'storefront', label: 'Store Orders' },
                  { id: 'consultation', label: 'Bookings' },
                  { id: 'quote', label: 'Custom Quotes' },
                ]),
          ].map((filt) => (
            <button
              key={filt.id}
              type="button"
              onClick={() => setSelectedModuleFilter(filt.id)}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs shrink-0 transition cursor-pointer ${
                selectedModuleFilter === filt.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customers List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredCustomers.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-2xl font-extrabold text-sm flex items-center justify-center shrink-0 ${
                  isCreator ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100/70 text-emerald-800'
                }`}>
                  {cust.name ? cust.name.slice(0, 2).toUpperCase() : 'CU'}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900">{cust.name}</h3>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>{cust.phone}</span>
                    {cust.email && (
                      <>
                        <span>•</span>
                        <span>{cust.email}</span>
                      </>
                    )}
                  </div>
                  {getSourceBadge(cust.sourceModule, cust.sourceModules)}
                  {cust.address && (
                    <p className="text-[10px] text-slate-400 truncate max-w-sm mt-0.5">{cust.address}</p>
                  )}
                </div>
              </div>

              {/* Stats & WhatsApp Chat */}
              <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="flex items-center gap-4 text-xs">
                  {cust.totalOrders > 0 && (
                    <div className="text-center">
                      <div className="font-extrabold text-slate-900">{cust.totalOrders}</div>
                      <div className="text-[10px] text-slate-400">{isCreator ? 'Sales' : 'Orders'}</div>
                    </div>
                  )}

                  {cust.totalBookings > 0 && (
                    <div className="text-center">
                      <div className="font-extrabold text-slate-900">{cust.totalBookings}</div>
                      <div className="text-[10px] text-slate-400">Bookings</div>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="font-extrabold text-emerald-700">
                      {business.currencySymbol}{cust.totalSpent || 0}
                    </div>
                    <div className="text-[10px] text-slate-400">Total Spent</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleWhatsApp(cust)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Contacts Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isCreator
              ? 'Client records will be automatically logged here as clients purchase digital products, book 1:1 sessions, buy event tickets, or request quotes.'
              : 'Customers will be automatically recorded here as soon as they place orders or submit bookings on your storefront.'}
          </p>
        </div>
      )}
    </div>
  );
};
