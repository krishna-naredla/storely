import { useLanguage } from '../../context/LanguageContext';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  Download,
  FileCheck,
  Video,
  FileText,
} from 'lucide-react';
import { BusinessProfile, Order, OrderStatus } from '../../types';
import { getOrders, updateOrderStatus, subscribeToOrders, deleteOrder } from '../../services/firebaseService';
import { auth } from '../../config/firebase';
import { SwipeToDelete } from '../common/SwipeToDelete';
import { exportToCSV } from '../../utils/export';
import { isCreatorProfile } from '../../utils/profileHelper';

interface OrderManagerProps {
  business: BusinessProfile;
}

export const OrderManager: React.FC<any> = ({ business }) => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected Order for Details View
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!business?.id || !auth?.currentUser) {
      setOrders([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribeToOrders(business.id, (realTimeOrders) => {
      setOrders(realTimeOrders);
      // Update selected order if it's currently open
      setSelectedOrder(prev => prev ? (realTimeOrders.find(o => o.id === prev.id) || prev) : null);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [business?.id]);

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

  const handleExportCSV = () => {
    const dataToExport = filteredOrders.map(o => ({
      OrderNumber: o.orderNumber,
      Customer: o.customerName,
      Phone: o.customerPhone,
      Type: o.orderType,
      Status: o.status,
      Total: o.total,
      Payment: o.paymentMethod,
      CreatedAt: o.createdAt,
      Items: o.items.map(i => `${i.name} x${i.quantity}`).join('; ')
    }));
    exportToCSV(`Storelly_Orders_${business.slug}`, dataToExport);
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

  const isCreator = isCreatorProfile(business);

  const getStatusBadge = (order: Order) => {
    if (order.orderType === 'digital' && order.paymentStatus === 'paid') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }

    switch (order.status) {
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'pending-verification':
        return 'bg-orange-50 text-orange-800 border-orange-200';
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
          <h2 className="text-xl sm:text-2xl font-black text-[var(--t1)] font-heading">
            {isCreator ? 'Digital Sales & Bookings' : 'Customer Orders'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--t2)] mt-0.5">
            {isCreator 
              ? 'Manage your digital product sales and consultation bookings.'
              : 'Manage incoming orders, update fulfilment status, and notify customers via WhatsApp.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-[var(--card)] hover:bg-[var(--bg)] text-[var(--t1)] border border-[var(--border)] font-bold text-xs rounded-[var(--r8)] transition flex items-center gap-1.5 shadow-[var(--shadow-xs)] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[var(--t2)]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[var(--card)] p-3 rounded-[var(--r12)] border border-[var(--border)] shadow-[var(--shadow-xs)]">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--t3)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, customer name, phone..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-[var(--border)] rounded-[var(--r8)] focus:outline-[var(--g400)] bg-[var(--bg)] text-[var(--t1)]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-[var(--border)] rounded-[var(--r8)] focus:outline-[var(--g400)] bg-[var(--card)] text-[var(--t1)] font-medium"
          >
            <option value="all">All Statuses ({orders.length})</option>
            <option value="pending">{t("orders.pending")}</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing / Kitchen</option>
            <option value="ready">Ready / Shipped</option>
            <option value="delivered">Delivered / Completed</option>
            <option value="cancelled">{t("orders.cancelled")}</option>
          </select>
        </div>
      </div>

      {/* Orders Table / List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-[var(--card)] rounded-[var(--r16)] border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="bg-[var(--card)] rounded-[var(--r16)] border border-[var(--border)] shadow-[var(--shadow-xs)] divide-y divide-[var(--border)] overflow-hidden">
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.35) }}
            >
              <SwipeToDelete onDelete={() => deleteOrder(business.id, order.id)} deleteLabel="Remove">
                <div
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--bg)] transition bg-[var(--card)]"
                >
                {/* Order Info & Customer */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-extrabold text-sm text-[var(--t1)]">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-[var(--r8)] text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                        order
                      )}`}
                    >
                      {order.status}
                    </span>
                    <span className="text-[11px] font-semibold text-[var(--t2)] bg-[var(--bg)] border border-[var(--border)] px-2 py-0.5 rounded-[var(--r4)]">
                      {order.orderType === 'digital'
                        ? 'Digital Download'
                        : order.orderType === 'consultation'
                        ? 'Consultation Slot'
                        : order.orderType === 'delivery'
                        ? 'Home Delivery'
                        : order.orderType === 'dine_in'
                        ? `Dine-In ${order.tableNumber ? `(Table ${order.tableNumber})` : ''}`
                        : 'Takeaway / Pickup'}
                    </span>
                  </div>

                  <div className="text-xs text-[var(--t2)] flex items-center gap-2 flex-wrap pt-0.5">
                    <span className="font-bold text-[var(--t1)]">{order.customerName}</span>
                    <span>•</span>
                    <span>{order.customerPhone}</span>
                    <span>•</span>
                    <span className="text-[var(--t3)]">
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-[11px] text-[var(--t3)] line-clamp-1">
                    Items: {order.items.map((i) => `${i.name} x${i.quantity}`).join(', ')}
                  </div>
                </div>

                {/* Total & Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
                  <div className="text-left sm:text-right">
                    <div className="font-extrabold text-base text-[var(--t1)]">
                      {business.currencySymbol}{order.total}
                    </div>
                  <div className="text-[10px] text-[var(--t3)]">
                    {order.paymentMethod === 'cod'
                      ? 'Cash On Delivery'
                      : order.paymentMethod === 'upi_on_delivery'
                      ? 'UPI On Delivery'
                      : order.paymentMethod === 'online' || order.isPaid
                      ? 'Paid Online'
                      : 'Pending Payment'}
                  </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppUpdate(order)}
                      className="p-2 text-[var(--g600)] hover:bg-[var(--g100)] border border-[var(--g200)] rounded-[var(--r8)] transition cursor-pointer"
                      title="Send WhatsApp Update"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-2 bg-[var(--g900)] hover:bg-[var(--g800)] text-white text-xs font-bold rounded-[var(--r8)] transition flex items-center gap-1 cursor-pointer shadow-[var(--shadow-xs)]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </div>
            </SwipeToDelete>
          </motion.div>
        ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-[var(--card)] rounded-[var(--r16)] border border-dashed border-[var(--border)] space-y-3">
          <div className="w-12 h-12 rounded-[var(--r12)] bg-[var(--g100)] text-[var(--g600)] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--t1)] font-heading">No Orders Found</h3>
          <p className="text-xs text-[var(--t2)] max-w-sm mx-auto">
            When customers place orders on your public storefront, they will show up here instantly with full details.
          </p>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:static print:bg-white">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .printable-order-modal, .printable-order-modal * {
                visibility: visible;
              }
              .printable-order-modal {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                max-width: 100% !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .print-hide {
                display: none !important;
              }
            }
          `}</style>
          <div className="relative w-full max-w-xl max-h-[90vh] bg-[var(--card)] rounded-[var(--r16)] shadow-[var(--shadow-xl)] border border-[var(--border)] flex flex-col overflow-hidden printable-order-modal print:max-h-none print:overflow-visible">
            {/* Header */}
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[var(--t1)] font-heading">
                    Order {selectedOrder.orderNumber}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-[var(--r8)] text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                      selectedOrder
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--t3)]">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-[var(--t3)] hover:text-[var(--t1)] rounded-[var(--r8)] print-hide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Store & Receipt Title for Print */}
              <div className="hidden print:block text-center border-b pb-4 mb-2">
                <h2 className="text-lg font-extrabold text-[var(--t1)] font-heading">{business.name}</h2>
                {business.tagline && <p className="text-xs text-[var(--t2)]">{business.tagline}</p>}
                <p className="text-[11px] text-[var(--t3)]">Phone: {business.phone} {business.address ? `• ${business.address}` : ''}</p>
                <div className="mt-2 text-xs font-bold uppercase tracking-widest text-[var(--t2)]">Official Order Invoice</div>
              </div>

              {/* Status Update Control */}
              {!isCreator && selectedOrder.orderType !== 'digital' && (
                <div className="p-4 bg-[var(--bg)] rounded-[var(--r12)] border border-[var(--border)] space-y-2 print-hide">
                  <label className="block text-xs font-bold text-[var(--t1)] uppercase tracking-wider font-heading">
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
                          className={`py-1.5 px-2 rounded-[var(--r8)] text-xs font-bold capitalize transition ${
                            selectedOrder.status === st
                              ? 'bg-[var(--g600)] text-white shadow-[var(--shadow-xs)]'
                              : 'bg-[var(--card)] text-[var(--t2)] hover:bg-[var(--bg)] border border-[var(--border)]'
                          }`}
                        >
                          {st.replace('-', ' ')}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Customer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-[var(--r12)] border border-[var(--border)] bg-[var(--bg)] space-y-1.5">
                  <span className="font-bold uppercase text-[10px] tracking-wider block text-[var(--t3)]">
                    Customer Information
                  </span>
                  <div className="font-bold text-[var(--t1)] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[var(--t3)]" />
                    {selectedOrder.customerName}
                  </div>
                  <div className="text-[var(--t2)] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[var(--t3)]" />
                    {selectedOrder.customerPhone}
                  </div>
                </div>

                <div className="p-3.5 rounded-[var(--r12)] border border-[var(--border)] bg-[var(--bg)] space-y-1.5">
                  <span className="font-bold uppercase text-[10px] tracking-wider block text-[var(--t3)]">
                    Delivery / Fulfilment
                  </span>
                  <div className="font-semibold text-[var(--t1)] capitalize">
                    {selectedOrder.orderType.replace('_', ' ')}
                  </div>
                  {selectedOrder.customerAddress && (
                    <div className="text-[var(--t2)] text-[11px] leading-relaxed flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[var(--t3)] shrink-0 mt-0.5" />
                      <span>{selectedOrder.customerAddress}</span>
                    </div>
                  )}
                  {selectedOrder.tableNumber && (
                    <div className="text-[var(--g700)] font-bold">
                      Table: {selectedOrder.tableNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-[var(--t1)] uppercase tracking-wider mb-2 font-heading">
                  Order Items ({selectedOrder.items.length})
                </h4>
                <div className="border border-[var(--border)] rounded-[var(--r12)] overflow-hidden divide-y divide-[var(--border)]">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs bg-[var(--card)]">
                      <div>
                        <div className="font-bold text-[var(--t1)]">{item.name}</div>
                        {item.variantName && (
                          <div className="text-[11px] text-[var(--g700)]">Option: {item.variantName}</div>
                        )}
                        {item.addons && item.addons.length > 0 && (
                          <div className="text-[11px] text-[var(--t2)]">
                            Add-ons: {item.addons.map((a) => a.name).join(', ')}
                          </div>
                        )}
                        <div className="text-[var(--t3)] text-[11px]">
                          {business.currencySymbol}{item.price} x {item.quantity}
                        </div>
                      </div>

                      <div className="font-bold text-[var(--t1)]">
                        {business.currencySymbol}{item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Calculations */}
              <div className="p-4 bg-[var(--bg)] rounded-[var(--r12)] border border-[var(--border)] space-y-1.5 text-xs">
                <div className="flex justify-between text-[var(--t2)]">
                  <span>Subtotal</span>
                  <span>{business.currencySymbol}{selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.deliveryFee > 0 && (
                  <div className="flex justify-between text-[var(--t2)]">
                    <span>Delivery Charge</span>
                    <span>{business.currencySymbol}{selectedOrder.deliveryFee}</span>
                  </div>
                )}
                {selectedOrder.tax > 0 && (
                  <div className="flex justify-between text-[var(--t2)]">
                    <span>Tax</span>
                    <span>{business.currencySymbol}{selectedOrder.tax}</span>
                  </div>
                )}
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-[var(--g600)] font-semibold">
                    <span>Discount</span>
                    <span>-{business.currencySymbol}{selectedOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm text-[var(--t1)] pt-2 border-t border-[var(--border)]">
                  <span>Total Amount</span>
                  <span>{business.currencySymbol}{selectedOrder.total}</span>
                </div>
              </div>

              {/* Print Receipt Footer Notes */}
              <div className="hidden print:block text-center text-[10px] text-[var(--t3)] pt-4 border-t">
                Thank you for shopping with {business.name}! For queries, contact {business.phone}.
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--bg)] flex-wrap gap-2 print-hide">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 bg-[var(--card)] hover:bg-[var(--bg)] text-[var(--t1)] border border-[var(--border)] font-bold text-xs rounded-[var(--r8)] transition flex items-center gap-1.5 cursor-pointer shadow-[var(--shadow-xs)]"
                title="Print simplified receipt invoice"
              >
                <Printer className="w-4 h-4 text-[var(--t2)]" />
                <span>Print Receipt</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShareOrderToMerchant(selectedOrder)}
                  className="px-3 py-2 bg-[var(--g100)] hover:bg-[var(--g200)] text-[var(--g800)] border border-[var(--g200)] font-bold text-xs rounded-[var(--r8)] transition flex items-center gap-1.5 cursor-pointer"
                  title="Share order details to WhatsApp"
                >
                  <Send className="w-4 h-4 text-[var(--g600)]" />
                  <span>Share Order</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendWhatsAppUpdate(selectedOrder)}
                  className="px-4 py-2 bg-[var(--g600)] hover:bg-[var(--g700)] text-white font-bold text-xs rounded-[var(--r8)] shadow-[var(--shadow-xs)] transition flex items-center gap-1.5 cursor-pointer"
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
