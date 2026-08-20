import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  MessageCircle,
  Printer,
  Calendar,
  User,
  Phone,
  MapPin,
  X,
  Loader2,
  Send,
} from 'lucide-react';
import { BusinessProfile, Order, OrderStatus } from '../../types';
import { getOrders, updateOrderStatus, subscribeToOrders, deleteOrder } from '../../services/firebaseService';
import { SwipeToDelete } from '../common/SwipeToDelete';

interface OrderManagerProps {
  business: BusinessProfile;
}

export const OrderManager: React.FC<OrderManagerProps> = ({ business }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected Order for Details View
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToOrders(business.id, (realTimeOrders) => {
      setOrders(realTimeOrders);
      // Update selected order if it's currently open
      setSelectedOrder(prev => prev ? (realTimeOrders.find(o => o.id === prev.id) || prev) : null);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [business.id]);

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    // If attempting to confirm an online payment order, check if UTR exists in notes or order
    if (newStatus === 'confirmed' && order.paymentMethod === 'online') {
      const hasUtr = order.notes && (order.notes.toLowerCase().includes('utr') || order.notes.length >= 8);
      if (!hasUtr) {
        alert('Cannot confirm this online order yet! A valid UPI UTR (Transaction Reference) must be verified first.');
        return;
      }
    }

    try {
      setIsUpdatingStatus(true);
      await updateOrderStatus(business.id, order.id, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendWhatsAppUpdate = (order: Order) => {
    const phone = order.customerWhatsApp || order.customerPhone;
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hello ${order.customerName}!\n\n` +
      `Update regarding your order *${order.orderNumber}* with *${business.name}*:\n` +
      `Status: *${order.status.toUpperCase()}*\n` +
      `Total: ${business.currencySymbol}${order.total}\n\n` +
      `Thank you for supporting our business! Feel free to reply to this message if you have any questions.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareOrderToMerchant = (order: Order) => {
    const itemsList = order.items.map(i => `- ${i.name} x ${i.quantity} (${business.currencySymbol}${i.price * i.quantity})`).join('\n');
    const text = encodeURIComponent(
      `📦 *New Order Summary* (#${order.orderNumber})\n\n` +
      `👤 *Customer*: ${order.customerName}\n` +
      `📞 *Phone*: ${order.customerPhone}\n` +
      (order.customerAddress ? `📍 *Address*: ${order.customerAddress}\n` : '') +
      (order.tableNumber ? `🍽️ *Table*: ${order.tableNumber}\n` : '') +
      `\n*Items Ordered*:\n${itemsList}\n\n` +
      `💰 *Total Amount*: ${business.currencySymbol}${order.total}\n` +
      `⚡ *Status*: ${order.status.toUpperCase()}\n` +
      `💳 *Payment*: ${order.paymentMethod || 'COD'}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const filteredOrders = orders.filter((order) => {
    const matchesQuery =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'confirmed':
      case 'processing':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'ready':
      case 'shipped':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            Customer Orders
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage incoming orders, update fulfilment status, and notify customers via WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button removed for real-time */}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, customer name, phone..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="all">All Statuses ({orders.length})</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing / Kitchen</option>
            <option value="ready">Ready / Shipped</option>
            <option value="delivered">Delivered / Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table / List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {filteredOrders.map((order) => (
            <SwipeToDelete key={order.id} onDelete={() => deleteOrder(business.id, order.id)} deleteLabel="Remove">
              <div
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition bg-white"
              >
              {/* Order Info & Customer */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-extrabold text-sm text-slate-900">
                    {order.orderNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {order.orderType === 'delivery'
                      ? 'Home Delivery'
                      : order.orderType === 'dine_in'
                      ? `Dine-In ${order.tableNumber ? `(Table ${order.tableNumber})` : ''}`
                      : 'Takeaway / Pickup'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap pt-0.5">
                  <span className="font-bold text-slate-800">{order.customerName}</span>
                  <span>•</span>
                  <span>{order.customerPhone}</span>
                  <span>•</span>
                  <span className="text-slate-400">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 line-clamp-1">
                  Items: {order.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}
                </div>
              </div>

              {/* Total & Action Buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <div className="font-extrabold text-base text-slate-900">
                    {business.currencySymbol}{order.total}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {order.paymentMethod === 'cod'
                      ? 'Cash On Delivery'
                      : order.paymentMethod === 'upi_on_delivery'
                      ? 'UPI On Delivery'
                      : 'Paid Online'}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppUpdate(order)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-xl transition"
                    title="Send WhatsApp Update"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>
                </div>
              </div>
            </div>
          </SwipeToDelete>
        ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Orders Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When customers place orders on your public storefront, they will show up here instantly with full details.
          </p>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    Order {selectedOrder.orderNumber}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Status Update Control */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Update Fulfilment Status
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {(['pending', 'pending-verification', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled'] as OrderStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleStatusChange(selectedOrder, st)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize transition ${
                          selectedOrder.status === st
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {st.replace('-', ' ')}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-1.5">
                  <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block text-slate-500">
                    Customer Information
                  </span>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {selectedOrder.customerName}
                  </div>
                  <div className="text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {selectedOrder.customerPhone}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-1.5">
                  <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block text-slate-500">
                    Delivery / Fulfilment
                  </span>
                  <div className="font-semibold text-slate-900 capitalize">
                    {selectedOrder.orderType.replace('_', ' ')}
                  </div>
                  {selectedOrder.customerAddress && (
                    <div className="text-slate-600 text-[11px] leading-relaxed flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{selectedOrder.customerAddress}</span>
                    </div>
                  )}
                  {selectedOrder.tableNumber && (
                    <div className="text-emerald-700 font-bold">
                      Table: {selectedOrder.tableNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Order Items ({selectedOrder.items.length})
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {item.variantName && (
                          <div className="text-[11px] text-emerald-700">Option: {item.variantName}</div>
                        )}
                        {item.addons && item.addons.length > 0 && (
                          <div className="text-[11px] text-slate-500">
                            Add-ons: {item.addons.map((a) => a.name).join(', ')}
                          </div>
                        )}
                        <div className="text-slate-400 text-[11px]">
                          {business.currencySymbol}{item.price} x {item.quantity}
                        </div>
                      </div>

                      <div className="font-bold text-slate-900">
                        {business.currencySymbol}{item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Calculations */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{business.currencySymbol}{selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.deliveryFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Charge</span>
                    <span>{business.currencySymbol}{selectedOrder.deliveryFee}</span>
                  </div>
                )}
                {selectedOrder.tax > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax</span>
                    <span>{business.currencySymbol}{selectedOrder.tax}</span>
                  </div>
                )}
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>-{business.currencySymbol}{selectedOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span>{business.currencySymbol}{selectedOrder.total}</span>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50 flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShareOrderToMerchant(selectedOrder)}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  title="Share order details to WhatsApp"
                >
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Share Order</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendWhatsAppUpdate(selectedOrder)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Customer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
