import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MessageCircle,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { BusinessProfile, Order, OrderStatus } from '../../types';
import { getOrders, updateOrderStatus } from '../../services/firebaseService';

interface CustomerOrdersModalProps {
  business: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({
  business,
  isOpen,
  onClose,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPhone, setFilterPhone] = useState<string>(() => {
    return localStorage.getItem(`storelly_customer_phone_${business.id}`) || '';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchStoreOrders = async () => {
    try {
      setIsLoading(true);
      const allOrders = await getOrders(business.id);
      
      // Also get locally stored order IDs placed by this user/device
      const localOrderIds: string[] = JSON.parse(
        localStorage.getItem(`storelly_my_order_ids_${business.id}`) || '[]'
      );

      // Filter orders relevant to this customer (either matching phone or in local device storage)
      const filtered = allOrders.filter((o) => {
        if (localOrderIds.includes(o.id)) return true;
        if (filterPhone && o.customerPhone && o.customerPhone.includes(filterPhone)) return true;
        return false;
      });

      // If no strict filter match yet, show recent orders for this business so user can see them
      setOrders(filtered.length > 0 ? filtered : allOrders.slice(0, 10));
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStoreOrders();
    }
  }, [isOpen, business.id, filterPhone]);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      setActionLoadingId(orderId);
      await updateOrderStatus(business.id, orderId, 'cancelled');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o))
      );
    } catch (err) {
      console.error('Failed to cancel order:', err);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Confirmed</span>
          </span>
        );
      case 'pending-verification':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending UPI Verification</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
            <Package className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>Processing</span>
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Ready / Out for Delivery</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Delivered / Completed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending</span>
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black font-heading tracking-tight">My Orders & Tracking</h2>
              <p className="text-xs text-emerald-100">View live status, time, date, UTR, and manage orders</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-auto flex-1">
            <input
              type="text"
              value={filterPhone}
              onChange={(e) => {
                setFilterPhone(e.target.value);
                localStorage.setItem(`storelly_customer_phone_${business.id}`, e.target.value);
              }}
              placeholder="Filter by your WhatsApp / Phone number..."
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
          <button
            type="button"
            onClick={fetchStoreOrders}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Orders</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3 shadow-xs">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-heading">No Orders Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                You haven't placed any orders yet, or your phone number filter didn't match. Place an order from the storefront to track it here live!
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Recent';
              const canCancel = order.status === 'pending' || order.status === 'pending-verification' || order.status === 'confirmed';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4 hover:shadow-md transition"
                >
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 font-heading">
                          Order #{order.orderNumber || order.id.slice(0, 6).toUpperCase()}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{orderDate}</span>
                        </span>
                        <span>•</span>
                        <span className="uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {order.orderType}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-500">Total Amount</div>
                      <div className="text-base font-black text-emerald-700 font-heading">
                        {business.currencySymbol}{order.total}
                      </div>
                    </div>
                  </div>

                  {/* Customer & Payment Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="font-bold text-slate-700">Customer:</span> {order.customerName} ({order.customerPhone})
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">Payment:</span>{' '}
                      <span className="capitalize">{order.paymentMethod.replace(/_/g, ' ')}</span>
                      {order.paymentStatus === 'paid' && (
                        <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">PAID</span>
                      )}
                    </div>
                    {order.customerAddress && (
                      <div className="sm:col-span-2">
                        <span className="font-bold text-slate-700">Delivery Address:</span> {order.customerAddress}
                      </div>
                    )}
                    {order.notes && (
                      <div className="sm:col-span-2 font-mono text-[11px] text-emerald-900 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                        {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Items Summary */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Ordered Items</div>
                    <div className="space-y-1.5">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                              {item.quantity}x
                            </span>
                            <span className="font-medium text-slate-800">{item.name}</span>
                            {item.variantName && <span className="text-[10px] text-slate-500">({item.variantName})</span>}
                          </div>
                          <span className="font-bold text-slate-900">
                            {business.currencySymbol}{item.price * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions (WhatsApp support & Cancel) */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    {business.whatsapp || business.phone ? (
                      <a
                        href={`https://wa.me/${(business.whatsapp || business.phone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${business.name}, I want to check the status of my order #${order.orderNumber || order.id.slice(0, 6)}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Chat with Store on WhatsApp</span>
                      </a>
                    ) : <div />}

                    {canCancel && (
                      <button
                        type="button"
                        disabled={actionLoadingId === order.id}
                        onClick={() => handleCancelOrder(order.id)}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{actionLoadingId === order.id ? 'Cancelling...' : 'Cancel Order'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500">
          Orders are synchronized securely with {business.name}.
        </div>
      </div>
    </div>
  );
};
