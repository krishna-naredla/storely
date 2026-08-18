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
} from 'lucide-react';
import { BusinessProfile, Customer } from '../../types';
import { getCustomers } from '../../services/firebaseService';

interface CustomerManagerProps {
  business: BusinessProfile;
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({ business }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredCustomers = customers.filter((c) => {
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            Customer Directory (CRM)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real customer records aggregated automatically from orders, bookings, and inquiries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            Total Customers: {customers.length}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name, phone, or email..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
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
                <div className="w-11 h-11 rounded-2xl bg-emerald-100/70 text-emerald-800 font-extrabold text-sm flex items-center justify-center shrink-0">
                  {cust.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-900">{cust.name}</h3>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>{cust.phone}</span>
                    {cust.email && (
                      <>
                        <span>•</span>
                        <span>{cust.email}</span>
                      </>
                    )}
                  </div>
                  {cust.address && (
                    <p className="text-[10px] text-slate-400 truncate max-w-sm">{cust.address}</p>
                  )}
                </div>
              </div>

              {/* Stats & WhatsApp Chat */}
              <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-center">
                    <div className="font-extrabold text-slate-900">{cust.totalOrders || 0}</div>
                    <div className="text-[10px] text-slate-400">Orders</div>
                  </div>

                  <div className="text-center">
                    <div className="font-extrabold text-emerald-700">
                      {business.currencySymbol}{cust.totalSpent || 0}
                    </div>
                    <div className="text-[10px] text-slate-400">Spent</div>
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
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Customers Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Customers will be automatically recorded here as soon as they place orders or submit bookings on your storefront.
          </p>
        </div>
      )}
    </div>
  );
};
