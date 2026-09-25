import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Tag,
  Check,
  Loader2,
  AlertCircle,
  MessageCircle,
  Truck,
  Store,
  UtensilsCrossed,
  CheckCircle2,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Zap,
} from 'lucide-react';
import { BusinessProfile, Offer, Order } from '../../types';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import { createOrder, getOffers, updateOrderStatus } from '../../services/firebaseService';
import { initiateRazorpayCheckout } from '../../services/razorpayService';

interface StorefrontCartDrawerProps {
  business: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const StorefrontCartDrawer: React.FC<StorefrontCartDrawerProps> = ({
  business,
  isOpen,
  onClose,
}) => {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    totalItemsCount,
    subtotal,
  } = useStorefrontCart();

  // Order Details Form State
  const [orderType, setOrderType] = useState<'delivery' | 'pickup' | 'dine_in' | 'digital'>('delivery');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPincode, setCustomerPincode] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi_on_delivery' | 'online' | 'cash_at_counter'>('online');
  const [upiReferenceId, setUpiReferenceId] = useState('');

  // Coupon / Discount State
  const [couponCode, setCouponCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState<Offer | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [availableOffers, setAvailableOffers] = useState<Offer[]>([]);

  // Checkout submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Pre-fill customer and table details
  useEffect(() => {
    if (isOpen) {
      try {
        const savedPhone = localStorage.getItem(`storelly_customer_phone_${business.id}`);
        if (savedPhone) setCustomerPhone(savedPhone);
        
        const savedEmail = localStorage.getItem(`storelly_customer_email_${business.id}`);
        if (savedEmail) setCustomerEmail(savedEmail);

        const savedName = localStorage.getItem(`storelly_customer_name_${business.id}`);
        if (savedName) setCustomerName(savedName);
        
        const savedTable = localStorage.getItem(`storelly_table_${business.id}`);
        if (savedTable && business.modules.table_delivery) {
          setTableNumber(savedTable);
          setOrderType('dine_in');
        }
      } catch (e) {}
    }
  }, [isOpen, business.id, business.modules.table_delivery]);

  // Fetch available offers
  useEffect(() => {
    if (business.id && isOpen) {
      getOffers(business.id)
        .then((offers) => setAvailableOffers(offers.filter((o) => o.isActive)))
        .catch((err) => console.warn('Could not fetch offers for cart:', err));
    }
  }, [business.id, isOpen]);

  if (!isOpen) return null;

  // Pricing calculations
  const deliveryFee =
    orderType === 'delivery' && (business.deliveryFee || 0) > 0 ? (business.deliveryFee || 0) : 0;

  let discount = 0;
  if (appliedOffer) {
    if (appliedOffer.discountType === 'percentage') {
      discount = Math.round((subtotal * Number(appliedOffer.discountValue || 0)) / 100);
      if (appliedOffer.maxDiscount && discount > appliedOffer.maxDiscount) {
        discount = appliedOffer.maxDiscount;
      }
    } else {
      discount = Math.min(subtotal, Number(appliedOffer.discountValue || 0));
    }
  }
  discount = Math.max(0, Math.min(subtotal, discount));

  const taxRate = Number(business.taxRate || business.taxPercent || 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxRate > 0 ? Math.round((taxableAmount * taxRate) / 100) : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee + tax);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    setCouponError(null);
    if (!code) {
      setAppliedOffer(null);
      return;
    }

    const matched = availableOffers.find(
      (o) => (o.code && o.code.toUpperCase() === code) || o.title.toUpperCase() === code
    );

    if (!matched) {
      setCouponError('Invalid coupon code. Check active offers.');
      return;
    }

    if (matched.minOrderValue && subtotal < matched.minOrderValue) {
      setCouponError(`Minimum order amount of ${business.currencySymbol}${matched.minOrderValue} required.`);
      return;
    }

    setAppliedOffer(matched);
    setCouponCode(matched.code || matched.title);
  };

  const handleRemoveCoupon = () => {
    setAppliedOffer(null);
    setCouponCode('');
    setCouponError(null);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);

    if (items.length === 0) {
      setOrderError('Your cart is empty');
      return;
    }

    if (!customerName.trim()) {
      setOrderError('Please enter your full name');
      return;
    }

    if (!customerPhone.trim()) {
      setOrderError('Please enter your WhatsApp contact number');
      return;
    }

    if (orderType === 'delivery' && !customerAddress.trim()) {
      setOrderError('Please enter your delivery address');
      return;
    }

    if (orderType === 'dine_in' && !tableNumber.trim()) {
      setOrderError('Please specify your table number');
      return;
    }

    try {
      setIsSubmitting(true);

      const orderData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerWhatsApp: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        customerPincode: customerPincode.trim() || undefined,
        orderType,
        tableNumber: tableNumber.trim() || undefined,
        items: items.map((cartItem) => {
          const basePrice =
            typeof cartItem.selectedVariant?.price === 'number'
              ? cartItem.selectedVariant.price
              : (typeof cartItem.catalogItem.salePrice === 'number' && cartItem.catalogItem.salePrice >= 0 && cartItem.catalogItem.salePrice < cartItem.catalogItem.price
                  ? cartItem.catalogItem.salePrice
                  : (cartItem.catalogItem.price ?? 0));
          const addons = cartItem.selectedAddons?.map((a) => ({
            name: a.name,
            price: Number(a.price) || 0,
          })) || [];
          const addonsTotal = addons.reduce((sum, a) => sum + a.price, 0);
          const unitPrice = basePrice + addonsTotal;

          return {
            itemId: cartItem.catalogItem.id,
            name: cartItem.catalogItem.name,
            price: unitPrice,
            quantity: cartItem.quantity,
            variantId: cartItem.selectedVariant?.id,
            variantName: cartItem.selectedVariant?.name,
            addons,
            image: cartItem.catalogItem.images?.[0],
            unit: cartItem.catalogItem.unit,
          };
        }),
        subtotal,
        deliveryFee,
        discount,
        tax,
        total,
        status: paymentMethod === 'online' ? 'pending-verification' as const : 'pending' as const,
        paymentMethod,
        paymentStatus: 'pending' as const,
        notes: orderNotes.trim() || undefined,
      };

      // 1. Create order record first (in pending-verification if online)
      const created = await createOrder(business.id, orderData);

      // 2. If online, trigger Razorpay
      if (paymentMethod === 'online') {
        try {
          await initiateRazorpayCheckout({
            amount: total,
            currency: business.currency || 'INR',
            businessName: business.name,
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim(),
            customerPhone: customerPhone.trim(),
            businessId: business.id,
            localOrderId: created.id,
            themeColor: business.themeColor,
            onSuccess: async (rzpResponse) => {
              // Verify on server
              const verifyRes = await fetch('/api/orders/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...rzpResponse,
                  businessId: business.id,
                  localOrderId: created.id,
                }),
              });

              if (verifyRes.ok) {
                setPlacedOrder({ ...created, paymentStatus: 'paid', status: 'confirmed' });
                clearCart();
                sendWhatsAppReceipt({ ...created, paymentStatus: 'paid' });
              } else {
                setOrderError('Payment verification failed on server. Please contact support.');
              }
              setIsSubmitting(false);
            },
            onFailure: (err) => {
              console.error('Payment failed:', err);
              setOrderError('Payment was not completed. You can try again from your orders.');
              setIsSubmitting(false);
            }
          });
          return; // Wait for Razorpay callback
        } catch (rzpErr: any) {
          setOrderError('Could not initialize payment gateway: ' + rzpErr.message);
          setIsSubmitting(false);
          return;
        }
      }

      // 3. For COD/Cash, finish immediately
      setPlacedOrder(created);
      clearCart();
      sendWhatsAppReceipt(created);

      // Save to local device order history
      saveToLocalHistory(created.id);

    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order. Please try again.');
    } finally {
      if (paymentMethod !== 'online') {
        setIsSubmitting(false);
      }
    }
  };

  const saveToLocalHistory = (orderId: string) => {
    try {
      const existingIds: string[] = JSON.parse(
        localStorage.getItem(`storelly_my_order_ids_${business.id}`) || '[]'
      );
      if (!existingIds.includes(orderId)) {
        existingIds.unshift(orderId);
        localStorage.setItem(`storelly_my_order_ids_${business.id}`, JSON.stringify(existingIds));
      }
      localStorage.setItem(`storelly_customer_phone_${business.id}`, customerPhone.trim());
    } catch (e) {}
  };

  const sendWhatsAppReceipt = (order: Order) => {
    const itemsListText = items
      .map((it, idx) => {
        let line = `${idx + 1}. *${it.catalogItem.name}* x ${it.quantity} = ${business.currencySymbol}${
          (it.selectedVariant?.price ?? it.catalogItem.price) * it.quantity
        }`;
        if (it.selectedVariant) line += ` (${it.selectedVariant.name})`;
        return line;
      })
      .join('\n');

    const whatsappText = encodeURIComponent(
      `🛍️ *NEW STORE ORDER*\n` +
      `Order ID: *#${order.orderNumber}*\n` +
      `Store: *${business.name}*\n\n` +
      `👤 *Customer:* ${customerName}\n` +
      `📦 *Type:* ${orderType.toUpperCase()}\n` +
      `\n🛒 *Items:*\n${itemsListText}\n\n` +
      `*Total:* *${business.currencySymbol}${total}*\n` +
      `💳 *Payment:* ${order.paymentMethod.toUpperCase()} (${order.paymentStatus.toUpperCase()})\n\n` +
      `Please confirm this order. Thank you!`
    );

    const merchantPhone = (business.whatsapp || business.phone).replace(/\D/g, '');
    window.open(`https://wa.me/${merchantPhone}?text=${whatsappText}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Drawer / Modal Panel */}
      <div className="relative w-full sm:max-w-2xl h-[92vh] sm:h-[90vh] bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 z-10">
          {/* Drawer Header */}
          <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[1rem] bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-sm">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 font-heading">
                  Checkout
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in cart
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success / Tracking View when Order Placed */}
          {placedOrder ? (
            <div className="p-8 sm:p-12 overflow-y-auto flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
                <div className="relative w-24 h-24 rounded-[2rem] bg-amber-50 text-amber-700 flex items-center justify-center mx-auto shadow-inner border border-amber-100">
                  <Clock className="w-10 h-10" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-widest border border-amber-200 shadow-sm">
                  ⏳ Verification in Progress
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading leading-tight">
                  Your Order is Logged!
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium">
                  Order <span className="text-slate-900 font-bold">#{placedOrder.orderNumber}</span> has been successfully sent to the merchant.
                </p>
              </div>

              {/* Order Status Timeline */}
              <div className="w-full bg-slate-50 border border-slate-200 p-6 rounded-[2rem] text-left space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracking Details</span>
                  <span className="text-[10px] font-black text-amber-700 bg-amber-100/50 px-3 py-1 rounded-full border border-amber-200">
                    {placedOrder.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm ring-4 ring-emerald-50">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900">Order Dispatched</p>
                      <p className="text-[10px] text-slate-500 font-bold">Sent to merchant for review</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${placedOrder.status !== 'pending' ? 'bg-emerald-600 text-white ring-4 ring-emerald-50' : 'bg-white border-2 border-slate-200 text-slate-300'}`}>
                      {placedOrder.status !== 'pending' ? <Check className="w-4 h-4 stroke-[3]" /> : <div className="w-2 h-2 rounded-full bg-slate-200 animate-pulse" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-black ${placedOrder.status !== 'pending' ? 'text-slate-900' : 'text-slate-300'}`}>Vendor Confirmation</p>
                      <p className="text-[10px] text-slate-400 font-bold">Merchant is checking availability</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bill</span>
                  <span className="text-xl font-black text-emerald-700 font-heading">
                    {business.currencySymbol}{placedOrder.total}
                  </span>
                </div>
              </div>

              <div className="w-full grid grid-cols-1 gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const merchantPhone = (business.whatsapp || business.phone).replace(/\D/g, '');
                    const waUrl = `https://wa.me/${merchantPhone}?text=${encodeURIComponent(
                      `Hi ${business.name}, I placed order #${placedOrder.orderNumber} and would like to confirm its status.`
                    )}`;
                    window.open(waUrl, '_blank');
                  }}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 cursor-pointer group"
                >
                  <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Chat on WhatsApp</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPlacedOrder(null);
                      onClose();
                    }}
                    className="h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-2xl transition-all cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                  {placedOrder.status === 'pending' && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm('Cancel this pending order?')) {
                          await updateOrderStatus(business.id, placedOrder.id, 'cancelled');
                          setPlacedOrder({ ...placedOrder, status: 'cancelled' });
                        }
                      }}
                      className="h-12 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs rounded-2xl border border-rose-100 transition-all cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Active Cart & Checkout Form */
            <div className="overflow-y-auto flex-1 scrollbar-hide">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-6">
                  <div className="w-24 h-24 rounded-[2rem] bg-slate-50 text-slate-200 flex items-center justify-center shadow-inner">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-slate-900 font-heading">Your cart is lonely</h4>
                    <p className="text-sm text-slate-500 font-medium max-w-xs">
                      It looks like you haven't added anything to your order yet.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-8 py-3 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-2xl transition-all shadow-lg shadow-slate-900/20"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="p-6 sm:p-8 space-y-10 pb-32">
                  {/* Cart Items List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Your Selection</h4>
                      <button
                        type="button"
                        onClick={clearCart}
                        className="text-[10px] font-black text-rose-600 hover:underline tracking-widest uppercase"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="space-y-3">
                      {items.map((item) => {
                        const unitPrice =
                          item.selectedVariant?.price ??
                          (item.catalogItem.salePrice || item.catalogItem.price);
                        const addonsPrice = (item.selectedAddons || []).reduce(
                          (sum, a) => sum + a.price,
                          0
                        );
                        const itemTotal = (unitPrice + addonsPrice) * item.quantity;

                        return (
                          <div
                            key={item.id}
                            className="p-4 flex items-center gap-4 bg-slate-50/50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:border-slate-200 hover:shadow-sm"
                          >
                            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                              {item.catalogItem.images?.[0] ? (
                                <img
                                  src={item.catalogItem.images[0]}
                                  alt={item.catalogItem.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-700 font-black text-xs">
                                  {item.catalogItem.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <h4 className="text-sm font-black text-slate-900 truncate">
                                {item.catalogItem.name}
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {item.selectedVariant && (
                                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                    {item.selectedVariant.name}
                                  </span>
                                )}
                                {item.selectedAddons && item.selectedAddons.length > 0 && (
                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                    +{item.selectedAddons.length} Extras
                                  </span>
                                )}
                              </div>
                              <div className="text-sm font-black text-emerald-700">
                                {business.currencySymbol}{itemTotal}
                              </div>
                            </div>

                            {/* Quantity Control */}
                            <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 shadow-sm shrink-0">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                              >
                                {item.quantity === 1 ? (
                                  <Trash2 className="w-3.5 h-3.5" />
                                ) : (
                                  <Minus className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <span className="w-7 text-center text-xs font-black text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fulfillment Mode */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fulfillment</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setOrderType('delivery')}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer ${
                          orderType === 'delivery'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-md ring-4 ring-emerald-500/10'
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        <Truck className={`w-5 h-5 ${orderType === 'delivery' ? 'text-emerald-600' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Delivery</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrderType('pickup')}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer ${
                          orderType === 'pickup'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-md ring-4 ring-emerald-500/10'
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        <Store className={`w-5 h-5 ${orderType === 'pickup' ? 'text-teal-600' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Pickup</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrderType('dine_in')}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer ${
                          orderType === 'dine_in'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-md ring-4 ring-emerald-500/10'
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        <UtensilsCrossed className={`w-5 h-5 ${orderType === 'dine_in' ? 'text-amber-600' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Dine-In</span>
                      </button>
                    </div>
                  </div>

                  {/* Customer Form */}
                  <div className="space-y-6 pt-4 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Details</h4>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Your full name"
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all text-sm font-bold text-slate-900"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            WhatsApp / Mobile Number
                          </label>
                          <input
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="Mobile number"
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all text-sm font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address (Optional)</label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="Email address for receipt"
                          className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all text-sm font-bold text-slate-900"
                        />
                      </div>

                      {orderType === 'dine_in' && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Table Reference</label>
                          <input
                            type="text"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            placeholder="e.g. Table #12, Rooftop"
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all text-sm font-bold text-slate-900"
                          />
                        </div>
                      )}

                      {orderType === 'delivery' && (
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Delivery Address</label>
                            <textarea
                              value={customerAddress}
                              onChange={(e) => setCustomerAddress(e.target.value)}
                              placeholder="House No, Building, Area, Landmark"
                              rows={3}
                              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all text-sm font-bold text-slate-900 resize-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pincode</label>
                            <input
                              type="text"
                              value={customerPincode}
                              onChange={(e) => setCustomerPincode(e.target.value)}
                              placeholder="e.g. 560001"
                              className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all text-sm font-bold text-slate-900"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Order Notes (Optional)</label>
                        <input
                          type="text"
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          placeholder="e.g. Please make it extra spicy"
                          className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all text-sm font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Promo Code */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Promo Code</h4>
                    
                    {appliedOffer ? (
                      <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                          <div>
                            <span className="text-xs font-black text-emerald-950 uppercase tracking-widest block">
                              {appliedOffer.code || appliedOffer.title}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700">
                              {appliedOffer.discountType === 'percentage'
                                ? `${appliedOffer.discountValue}% Discount Applied`
                                : `Flat ${business.currencySymbol}${appliedOffer.discountValue} Applied`}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-[10px] font-black text-rose-600 hover:underline tracking-widest uppercase"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            placeholder="Enter code"
                            className="flex-1 h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-none transition-all text-sm font-black text-slate-900 uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyCoupon()}
                            className="px-6 h-12 bg-slate-900 hover:bg-black text-white font-black text-xs rounded-2xl transition-all shadow-md shadow-slate-900/10"
                          >
                            Apply
                          </button>
                        </div>
                        
                        {couponError && (
                          <p className="text-[10px] font-bold text-rose-600 ml-1">{couponError}</p>
                        )}

                        {availableOffers.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {availableOffers.map((off) => (
                              <button
                                key={off.id}
                                type="button"
                                onClick={() => handleApplyCoupon(off.code || off.title)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
                              >
                                🏷️ {off.code || off.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Payment Options */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment Method</h4>
                    <div className="space-y-2">
                      {business.enableOnlinePayment !== false && (business.upiId || business.upiQrImage) && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('online')}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                            paymentMethod === 'online'
                              ? 'bg-emerald-50 border-emerald-600 shadow-md ring-4 ring-emerald-500/10'
                              : 'bg-white border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                              paymentMethod === 'online' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                              <Zap className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <span className={`text-xs block font-black ${paymentMethod === 'online' ? 'text-emerald-950' : 'text-slate-700'}`}>
                                Instant Online UPI
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">GPay, PhonePe, Paytm, etc.</span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            paymentMethod === 'online' ? 'bg-emerald-600 border-emerald-600' : 'border-slate-200'
                          }`}>
                            {paymentMethod === 'online' && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </div>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          paymentMethod === 'cod'
                            ? 'bg-emerald-50 border-emerald-600 shadow-md ring-4 ring-emerald-500/10'
                            : 'bg-white border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            paymentMethod === 'cod' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <Banknote className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <span className={`text-xs block font-black ${paymentMethod === 'cod' ? 'text-emerald-950' : 'text-slate-700'}`}>
                              Cash on Fulfillment
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">Pay when you receive items</span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          paymentMethod === 'cod' ? 'bg-emerald-600 border-emerald-600' : 'border-slate-200'
                        }`}>
                          {paymentMethod === 'cod' && <Check className="w-3 h-3 text-white stroke-[3]" />}
                        </div>
                      </button>

                      {/* Online UPI Widget */}
                      {paymentMethod === 'online' && (business.upiId || business.upiQrImage) && (
                        <div className="mt-4 p-5 rounded-[2rem] bg-slate-900 text-white space-y-5 animate-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">UPI Payment</span>
                            <span className="text-lg font-black font-heading text-emerald-400">
                              {business.currencySymbol}{total}
                            </span>
                          </div>

                          <div className="flex flex-col items-center space-y-4">
                            <div className="bg-white p-4 rounded-[1.5rem] shadow-xl">
                              {business.upiQrImage ? (
                                <img
                                  src={business.upiQrImage}
                                  alt="UPI QR"
                                  className="w-32 h-32 object-contain"
                                />
                              ) : business.upiId ? (
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                                    `upi://pay?pa=${business.upiId}&pn=${encodeURIComponent(business.name)}&am=${total}&cu=INR&tn=OrderPayment`
                                  )}`}
                                  alt="UPI QR"
                                  className="w-32 h-32"
                                />
                              ) : null}
                            </div>
                            
                            {business.upiId && (
                              <div className="w-full space-y-3">
                                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Store UPI ID</p>
                                  <p className="text-xs font-black font-mono text-emerald-400 select-all">{business.upiId}</p>
                                </div>
                                <a
                                  href={`upi://pay?pa=${business.upiId}&pn=${encodeURIComponent(business.name)}&am=${total}&cu=INR&tn=OrderPayment`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-3 w-full h-12 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-black text-xs transition-all shadow-lg shadow-emerald-900/40"
                                >
                                  <Zap className="w-4 h-4 fill-current" />
                                  Open UPI App to Pay
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reference / UTR ID *</label>
                            <input
                              type="text"
                              value={upiReferenceId}
                              onChange={(e) => setUpiReferenceId(e.target.value)}
                              placeholder="e.g. 423561829301"
                              className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all text-xs font-black font-mono text-white placeholder:text-slate-600"
                            />
                            <p className="text-[9px] text-slate-500 font-bold px-1 italic">
                              * Enter the 12-digit transaction ID from your payment app.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                      <span>Subtotal</span>
                      <span className="text-slate-900">{business.currencySymbol}{subtotal}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between items-center text-xs font-black text-emerald-700">
                        <span>Discount Applied</span>
                        <span>-{business.currencySymbol}{discount}</span>
                      </div>
                    )}
                    {deliveryFee > 0 && (
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                        <span>Delivery Fee</span>
                        <span className="text-slate-900">+{business.currencySymbol}{deliveryFee}</span>
                      </div>
                    )}
                    {tax > 0 && (
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                        <span>Tax & Fees</span>
                        <span className="text-slate-900">+{business.currencySymbol}{tax}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-sm font-black text-slate-900">Total Bill</span>
                      <span className="text-2xl font-black text-emerald-700 font-heading">
                        {business.currencySymbol}{total}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer CTA */}
          {!placedOrder && items.length > 0 && (
            <div className="p-6 sm:p-8 bg-white/80 backdrop-blur-xl border-t border-slate-100">
              {orderError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {orderError}
                </div>
              )}
              
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full h-14 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-950 disabled:bg-slate-300 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-700/20 transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Place Order</span>
                    <div className="h-6 w-px bg-white/20 mx-1" />
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              
              <p className="mt-3 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Directly connects to merchant via WhatsApp
              </p>
            </div>
          )}
      </div>
    </div>
  );
};
