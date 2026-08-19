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
} from 'lucide-react';
import { BusinessProfile, Offer, Order } from '../../types';
import { useStorefrontCart } from '../../context/StorefrontCartContext';
import { createOrder, getOffers } from '../../services/firebaseService';

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
  const [orderType, setOrderType] = useState<'delivery' | 'pickup' | 'dine_in'>('delivery');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPincode, setCustomerPincode] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi_on_delivery' | 'cash_at_counter'>('cod');

  // Coupon / Discount State
  const [couponCode, setCouponCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState<Offer | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [availableOffers, setAvailableOffers] = useState<Offer[]>([]);

  // Checkout submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

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
      discount = Math.round((subtotal * appliedOffer.discountValue) / 100);
    } else {
      discount = Math.min(subtotal, appliedOffer.discountValue);
    }
  }

  const taxRate = business.taxRate || business.taxPercent || 0;
  const tax = taxRate > 0 ? Math.round(((subtotal - discount) * taxRate) / 100) : 0;
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
          const unitPrice =
            cartItem.selectedVariant?.price ??
            (cartItem.catalogItem.salePrice || cartItem.catalogItem.price);
          const addons = cartItem.selectedAddons?.map((a) => ({
            name: a.name,
            price: a.price,
          }));
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
        status: 'pending' as const,
        paymentMethod,
        paymentStatus: 'pending' as const,
        notes: orderNotes.trim() || undefined,
      };

      // Write order to Firestore
      const created = await createOrder(business.id, orderData);
      setPlacedOrder(created);
      clearCart();

      // Format WhatsApp receipt message
      const itemsListText = items
        .map((it, idx) => {
          let line = `${idx + 1}. *${it.catalogItem.name}* x ${it.quantity} = ${business.currencySymbol}${
            (it.selectedVariant?.price ?? it.catalogItem.price) * it.quantity
          }`;
          if (it.selectedVariant) {
            line += ` (${it.selectedVariant.name})`;
          }
          if (it.selectedAddons && it.selectedAddons.length > 0) {
            line += ` [Add-ons: ${it.selectedAddons.map((a) => a.name).join(', ')}]`;
          }
          return line;
        })
        .join('\n');

      const whatsappText = encodeURIComponent(
        `🛍️ *NEW STORE ORDER*\n` +
        `Order ID: *#${created.orderNumber}*\n` +
        `Store: *${business.name}*\n\n` +
        `👤 *Customer:* ${customerName}\n` +
        `📞 *Phone:* ${customerPhone}\n` +
        `📦 *Type:* ${orderType.toUpperCase()}${tableNumber ? ` (Table #${tableNumber})` : ''}\n` +
        (customerAddress ? `📍 *Address:* ${customerAddress}\n` : '') +
        (orderNotes ? `📝 *Notes:* ${orderNotes}\n` : '') +
        `\n🛒 *Items Ordered:*\n${itemsListText}\n\n` +
        `Subtotal: ${business.currencySymbol}${subtotal}\n` +
        (discount > 0 ? `Discount: -${business.currencySymbol}${discount}\n` : '') +
        (deliveryFee > 0 ? `Delivery: +${business.currencySymbol}${deliveryFee}\n` : '') +
        `*Total Amount:* *${business.currencySymbol}${total}*\n` +
        `Payment: ${paymentMethod.toUpperCase().replace(/_/g, ' ')}\n\n` +
        `Please confirm this order. Thank you!`
      );

      const merchantPhone = (business.whatsapp || business.phone).replace(/\D/g, '');
      const waUrl = `https://wa.me/${merchantPhone}?text=${whatsappText}`;
      
      // Auto open WhatsApp in new tab
      window.open(waUrl, '_blank');
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer / Modal Panel */}
      <div className="relative w-full sm:max-w-xl h-[92vh] sm:h-[88vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 z-10">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Your Order Cart
                </h3>
                <p className="text-[11px] text-slate-500">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in cart
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success View when Order Placed */}
          {placedOrder ? (
            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center text-center space-y-4 min-h-[420px]">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
                  Order Received
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2 font-heading">
                  Thank You for Your Order!
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Order #{placedOrder.orderNumber} has been logged and sent to {business.name}.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 w-full text-left text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Order Total:</span>
                  <span className="font-bold text-slate-900">
                    {business.currencySymbol}
                    {placedOrder.total}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Status:</span>
                  <span className="font-semibold text-emerald-700 uppercase">
                    {placedOrder.status}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payment:</span>
                  <span className="font-medium text-slate-800 uppercase">
                    {placedOrder.paymentMethod.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="w-full space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const merchantPhone = (business.whatsapp || business.phone).replace(/\D/g, '');
                    const waUrl = `https://wa.me/${merchantPhone}?text=${encodeURIComponent(
                      `Hi ${business.name}, I am checking the status of my order #${placedOrder.orderNumber}.`
                    )}`;
                    window.open(waUrl, '_blank');
                  }}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPlacedOrder(null);
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            /* Active Cart & Checkout Form */
            <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-6">
              {items.length === 0 ? (
                <div className="min-h-[380px] flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-heading">Your cart is empty</h4>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-xs mx-auto">
                      Explore our catalog and add items to your cart.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Cart Items List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Selected Items
                      </span>
                      <button
                        type="button"
                        onClick={clearCart}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Clear all
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
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
                            className="p-2.5 flex items-start gap-3 first:pt-2 last:pb-2"
                          >
                            <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                              {item.catalogItem.images?.[0] ? (
                                <img
                                  src={item.catalogItem.images[0]}
                                  alt={item.catalogItem.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-700 font-bold text-xs">
                                  {item.catalogItem.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {item.catalogItem.name}
                              </h4>
                              {item.selectedVariant && (
                                <p className="text-[11px] text-emerald-700 font-medium truncate">
                                  {item.selectedVariant.name}
                                </p>
                              )}
                              {item.selectedAddons && item.selectedAddons.length > 0 && (
                                <p className="text-[10px] text-slate-500 truncate">
                                  +{item.selectedAddons.map((a) => a.name).join(', ')}
                                </p>
                              )}
                              <div className="text-xs font-bold text-slate-900 mt-1">
                                {business.currencySymbol}
                                {itemTotal}
                              </div>
                            </div>

                            {/* Quantity buttons */}
                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100"
                              >
                                {item.quantity === 1 ? (
                                  <Trash2 className="w-3 h-3 text-rose-600" />
                                ) : (
                                  <Minus className="w-3 h-3" />
                                )}
                              </button>
                              <span className="w-5 text-center text-xs font-bold text-slate-800">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Mode Switcher */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Fulfillment Mode
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setOrderType('delivery')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                          orderType === 'delivery'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Truck className="w-4 h-4 text-emerald-600" />
                        <span>Delivery</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrderType('pickup')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                          orderType === 'pickup'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Store className="w-4 h-4 text-teal-600" />
                        <span>Pickup</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrderType('dine_in')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                          orderType === 'dine_in'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                        <span>Dine-In</span>
                      </button>
                    </div>
                  </div>

                  {/* Table number input for Dine-In */}
                  {orderType === 'dine_in' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Table Number *
                      </label>
                      <input
                        type="text"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="e.g. Table 4, Corner 2"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        required
                      />
                    </div>
                  )}

                  {/* Customer Information Form */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Contact Information
                    </span>

                    <div className="space-y-2.5">
                      <div>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Your Full Name *"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          required
                        />
                      </div>

                      <div>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="WhatsApp Phone Number (e.g. +91 9876543210) *"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          required
                        />
                      </div>

                      {orderType === 'delivery' && (
                        <>
                          <div>
                            <textarea
                              value={customerAddress}
                              onChange={(e) => setCustomerAddress(e.target.value)}
                              placeholder="Complete Delivery Address & Landmark *"
                              rows={2}
                              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                              required
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={customerPincode}
                              onChange={(e) => setCustomerPincode(e.target.value)}
                              placeholder="Pincode / Postal Code"
                              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <input
                          type="text"
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          placeholder="Special instructions or dietary notes (Optional)"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Coupon & Discount Code */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      Promo Code
                    </span>

                    {appliedOffer ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <div>
                            <span className="font-bold text-emerald-900 font-mono uppercase">
                              {appliedOffer.code || appliedOffer.title}
                            </span>
                            <span className="text-emerald-700 text-[11px] block">
                              {appliedOffer.discountType === 'percentage'
                                ? `${appliedOffer.discountValue}% OFF`
                                : `Flat ${business.currencySymbol}${appliedOffer.discountValue} OFF`}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Enter coupon code"
                          className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono uppercase"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                    )}

                    {couponError && (
                      <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
                    )}

                    {/* Quick clickable active offers */}
                    {!appliedOffer && availableOffers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {availableOffers.map((off) => (
                          <button
                            key={off.id}
                            type="button"
                            onClick={() => handleApplyCoupon(off.code || off.title)}
                            className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-100 transition"
                          >
                            🏷️ {off.code || off.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Payment Option
                    </span>
                    <div className="space-y-1.5">
                      <label
                        onClick={() => setPaymentMethod('cod')}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          paymentMethod === 'cod'
                            ? 'bg-emerald-50/70 border-emerald-500 text-slate-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <span>💵 Cash on Delivery / Handover</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] ${
                            paymentMethod === 'cod'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {paymentMethod === 'cod' && '✓'}
                        </div>
                      </label>

                      <label
                        onClick={() => setPaymentMethod('upi_on_delivery')}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          paymentMethod === 'upi_on_delivery'
                            ? 'bg-emerald-50/70 border-emerald-500 text-slate-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <span>📱 UPI / QR on Delivery</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] ${
                            paymentMethod === 'upi_on_delivery'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {paymentMethod === 'upi_on_delivery' && '✓'}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Price Calculation Bill Breakdown */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>
                        {business.currencySymbol}
                        {subtotal}
                      </span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Discount ({appliedOffer?.title || 'Offer'})</span>
                        <span>
                          -{business.currencySymbol}
                          {discount}
                        </span>
                      </div>
                    )}

                    {deliveryFee > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Delivery Fee</span>
                        <span>
                          +{business.currencySymbol}
                          {deliveryFee}
                        </span>
                      </div>
                    )}

                    {tax > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Taxes ({taxRate}%)</span>
                        <span>
                          +{business.currencySymbol}
                          {tax}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200 font-heading">
                      <span>Total Amount</span>
                      <span className="text-emerald-700">
                        {business.currencySymbol}
                        {total}
                      </span>
                    </div>
                  </div>

                  {orderError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{orderError}</span>
                    </div>
                  )}

                  {/* Checkout CTA */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handlePlaceOrder}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending to WhatsApp & Saving...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        <span>Place Order on WhatsApp ({business.currencySymbol}{total})</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
};
