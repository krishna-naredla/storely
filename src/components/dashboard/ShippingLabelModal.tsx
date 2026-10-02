import React, { useRef, useEffect, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Printer,
  Truck,
  CheckCircle2,
  Copy,
  Check,
  Package,
  Edit2,
  Save,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { BusinessProfile, Order } from '../../types';
import { updateOrder } from '../../services/firebaseService';

interface ShippingLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  business: BusinessProfile;
  onUpdateStatusToShipped?: (orderId: string) => Promise<void>;
}

export const ShippingLabelModal: React.FC<ShippingLabelModalProps> = ({
  isOpen,
  onClose,
  order,
  business,
  onUpdateStatusToShipped,
}) => {
  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  const [copiedTracking, setCopiedTracking] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressSavedSuccess, setAddressSavedSuccess] = useState(false);

  // Editable recipient details so the vendor is never blocked by incomplete customer input
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientCity, setRecipientCity] = useState('');
  const [recipientState, setRecipientState] = useState('');
  const [recipientPincode, setRecipientPincode] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Validation Error States
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    address?: string;
    city?: string;
    pincode?: string;
    general?: string;
  } | null>(null);

  useEffect(() => {
    if (order) {
      const initialName = order.customerName || '';
      const initialPhone = order.customerPhone || '';
      const initialAddress =
        order.customerAddress ||
        (order.orderType === 'pickup' ? 'Store Pickup / Counter Collection' : '');
      const initialCity = order.customerCity || '';
      const initialState = order.customerState || '';
      const initialPincode = order.customerPincode || '';

      setRecipientName(initialName);
      setRecipientPhone(initialPhone);
      setRecipientAddress(initialAddress);
      setRecipientCity(initialCity);
      setRecipientState(initialState);
      setRecipientPincode(initialPincode);

      // Check if critical fields are missing
      const isMissingCritical =
        !initialName.trim() ||
        !initialAddress.trim() ||
        (order.orderType === 'delivery' && initialAddress.trim().length < 5);

      setIsEditingAddress(isMissingCritical);
      setAddressSavedSuccess(false);
      setValidationErrors(null);
    }
  }, [order]);

  // Real authoritative barcode reference (Order Number or ID)
  const barcodeValue = order?.orderNumber || order?.id || 'ORD';

  // Render high-DPI Code128 Barcode via JsBarcode
  useEffect(() => {
    if (!isOpen || !order || !barcodeRef.current) return;

    try {
      JsBarcode(barcodeRef.current, barcodeValue, {
        format: 'CODE128',
        width: 1.8,
        height: 44,
        displayValue: true,
        fontSize: 11,
        font: 'monospace',
        textMargin: 3,
        margin: 2,
        background: '#ffffff',
        lineColor: '#000000',
      });
    } catch (err) {
      console.warn('JsBarcode SVG render note:', err);
    }
  }, [isOpen, order, barcodeValue]);

  if (!isOpen || !order) return null;

  // Determine Payment & COD state from authoritative order data
  const isCod = order.paymentMethod === 'cod' || (!order.paymentStatus || order.paymentStatus !== 'paid');

  // Calculate items quantity count
  const totalItemCount = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Safe tracking/verification URL for QR Code (public customer storefront order reference)
  const publicTrackingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/store/${business.slug}?ref=${encodeURIComponent(order.orderNumber)}`
    : `https://storelly.com/store/${business.slug}`;

  // Robust validation check for required shipping label fields
  const validateShippingDetails = (): boolean => {
    const errors: { name?: string; address?: string; city?: string; pincode?: string; general?: string } = {};

    const cleanName = recipientName.trim();
    const cleanAddress = recipientAddress.trim();

    if (!cleanName || cleanName.length < 2) {
      errors.name = 'Customer / Recipient name is required (min 2 characters).';
    }

    if (!cleanAddress) {
      errors.address = 'Full delivery street address is required.';
    } else if (cleanAddress.length < 5 && order.orderType === 'delivery') {
      errors.address = 'Please provide a complete address (house/flat no., building, street name, landmark).';
    }

    if (Object.keys(errors).length > 0) {
      errors.general = 'Missing required shipping information. Please complete the highlighted fields below before printing.';
      setValidationErrors(errors);
      setIsEditingAddress(true);

      // Focus first error field after drawer opens
      setTimeout(() => {
        if (errors.name && nameInputRef.current) {
          nameInputRef.current.focus();
        } else if (errors.address && addressInputRef.current) {
          addressInputRef.current.focus();
        }
      }, 100);

      return false;
    }

    setValidationErrors(null);
    return true;
  };

  // Check if address is currently incomplete
  const isAddressIncomplete =
    !recipientName.trim() ||
    !recipientAddress.trim() ||
    (order.orderType === 'delivery' && (recipientAddress.trim().length < 5 || !recipientCity.trim() || !recipientPincode.trim()));

  // One-Click Print Handler with strict user-friendly validation
  const handlePrint = () => {
    const isValid = validateShippingDetails();
    if (!isValid) {
      return;
    }

    // If currently editing, apply changes
    setIsEditingAddress(false);
    setTimeout(() => {
      window.print();
    }, 120);
  };

  const handleCopyOrderRef = () => {
    navigator.clipboard.writeText(order.orderNumber);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  // Save address changes directly to Firestore & sync local order reference
  const handleSaveAndApplyAddress = async (shouldPrintAfter = false) => {
    if (!order) return;

    const isValid = validateShippingDetails();
    if (!isValid) {
      return;
    }

    setIsSavingAddress(true);
    try {
      const updatedFields: Partial<Order> = {
        customerName: recipientName.trim(),
        customerPhone: recipientPhone.trim(),
        customerAddress: recipientAddress.trim(),
        customerCity: recipientCity.trim(),
        customerState: recipientState.trim(),
        customerPincode: recipientPincode.trim(),
      };

      await updateOrder(business.id, order.id, updatedFields);

      // Mutate local order reference
      Object.assign(order, updatedFields);

      setAddressSavedSuccess(true);
      setValidationErrors(null);
      setTimeout(() => setAddressSavedSuccess(false), 3000);
      setIsEditingAddress(false);

      if (shouldPrintAfter) {
        setTimeout(() => {
          window.print();
        }, 150);
      }
    } catch (err) {
      console.error('Failed to update order address in Firestore:', err);
      // Still allow vendor to proceed locally with validated inputs
      setIsEditingAddress(false);
      if (shouldPrintAfter) {
        setTimeout(() => {
          window.print();
        }, 150);
      }
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleMarkShipped = async () => {
    if (!onUpdateStatusToShipped || !order) return;
    try {
      setIsUpdatingStatus(true);
      await onUpdateStatusToShipped(order.id);
    } catch (err) {
      console.error('Failed to mark order as shipped:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const displayAddress =
    recipientAddress ||
    (order.orderType === 'pickup'
      ? 'Store Pickup / Counter Collection'
      : 'Standard Delivery Destination');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      {/* Strict 4x6 Print CSS Rules for Thermal & Desktop Printers */}
      <style>{`
        @media print {
          @page {
            size: 4in 6in;
            margin: 0;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            width: 4in !important;
            height: 6in !important;
          }

          /* Hide ALL other page elements */
          body * {
            visibility: hidden;
          }

          /* Show ONLY the shipping label sheet */
          .shipping-label-printable, .shipping-label-printable * {
            visibility: visible !important;
          }

          .shipping-label-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 4in !important;
            height: 6in !important;
            max-width: 4in !important;
            max-height: 6in !important;
            min-width: 4in !important;
            min-height: 6in !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0.15in !important;
            border: 2px solid #000000 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            box-shadow: none !important;
            overflow: hidden !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-hide-action {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[95vh] overflow-hidden">
        {/* Top Control Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 print-hide-action">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                4×6 Thermal Courier Shipping Label
              </h3>
              <p className="text-[11px] text-slate-500">
                Order #{order.orderNumber} • Standard 4" × 6" Portrait (Thermal & Laser Ready)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Print directly to 4x6 thermal shipping printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>One-Click Print (4×6)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Validation Error Banner (When Print is Attempted with Incomplete Data) */}
        {validationErrors?.general && (
          <div className="mx-4 mt-3 p-3.5 bg-rose-50 border-2 border-rose-400 rounded-xl flex items-start gap-2.5 text-xs text-rose-900 shrink-0 print-hide-action animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-black text-rose-950 block text-xs">
                Shipping Address Incomplete
              </strong>
              <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed font-medium">
                {validationErrors.general}
              </p>
            </div>
          </div>
        )}

        {/* Address Incomplete Notice Banner (When Not in Edit Mode) */}
        {isAddressIncomplete && !isEditingAddress && !validationErrors?.general && (
          <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-900 shrink-0 print-hide-action animate-in fade-in duration-150">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold truncate">
                Shipping address is incomplete. Add the missing customer name or delivery street address before printing the official courier label.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingAddress(true)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer shadow-2xs"
            >
              Complete Address
            </button>
          </div>
        )}

        {/* Inline Address Quick Edit Drawer / Bar */}
        {isEditingAddress ? (
          <div className="mx-4 mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 print-hide-action text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Recipient & Delivery Address Details</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Customer name and full street address are required for courier dispatch. Updates preview live on the 4×6 label.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingAddress(false);
                    setValidationErrors(null);
                  }}
                  className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingAddress}
                  onClick={() => handleSaveAndApplyAddress(false)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSavingAddress ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save & Apply</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSavingAddress}
                  onClick={() => handleSaveAndApplyAddress(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Save address to order and print label"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Save & Print</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase">
                  Customer / Recipient Name <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={recipientName}
                  onChange={(e) => {
                    setRecipientName(e.target.value);
                    if (validationErrors?.name) {
                      setValidationErrors((prev) => (prev ? { ...prev, name: undefined } : null));
                    }
                  }}
                  placeholder="e.g. John Doe / Customer Name"
                  className={`w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-semibold outline-none transition ${
                    validationErrors?.name
                      ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-200'
                      : 'border-slate-200 focus:border-emerald-500'
                  }`}
                />
                {validationErrors?.name && (
                  <p className="text-[10px] text-rose-600 font-bold mt-0.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{validationErrors.name}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">
                  Full Delivery Street Address <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={addressInputRef}
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => {
                    setRecipientAddress(e.target.value);
                    if (validationErrors?.address) {
                      setValidationErrors((prev) => (prev ? { ...prev, address: undefined } : null));
                    }
                  }}
                  placeholder="Flat / House No., Building, Street Name, Landmark"
                  className={`w-full px-2.5 py-1.5 bg-white border rounded-lg text-xs font-semibold outline-none transition ${
                    validationErrors?.address
                      ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-200'
                      : 'border-slate-200 focus:border-emerald-500'
                  }`}
                />
                {validationErrors?.address && (
                  <p className="text-[10px] text-rose-600 font-bold mt-0.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{validationErrors.address}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase">City / Town</label>
                <input
                  type="text"
                  value={recipientCity}
                  onChange={(e) => setRecipientCity(e.target.value)}
                  placeholder="City (e.g. Hyderabad)"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase">
                  PIN / Postal Code
                </label>
                <input
                  type="text"
                  value={recipientPincode}
                  onChange={(e) => setRecipientPincode(e.target.value)}
                  placeholder="PIN Code (e.g. 500081)"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-4 mt-3 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs text-slate-600 shrink-0 print-hide-action">
            <span className="truncate">
              Recipient: <strong className="text-slate-900">{recipientName || order.customerName || 'Customer'}</strong> • {displayAddress}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {addressSavedSuccess && (
                <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Saved</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsEditingAddress(true);
                  setValidationErrors(null);
                }}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg font-bold text-[11px] transition flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Edit2 className="w-3 h-3 text-slate-500" />
                <span>Edit Address</span>
              </button>
            </div>
          </div>
        )}

        {/* Warning if Digital or Dine-In Order */}
        {order.orderType !== 'delivery' && (
          <div className="mx-4 mt-2 p-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-900 shrink-0 print-hide-action">
            <Package className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Order Type: <strong className="capitalize">{order.orderType.replace('_', ' ')}</strong>. Shipping label will print recipient info below.
            </span>
          </div>
        )}

        {/* Preview Scroll Area */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex items-center justify-center flex-1">
          {/* THE 4×6 INCH PHYSICAL LABEL CONTAINER */}
          <div
            className="shipping-label-printable w-[384px] h-[576px] bg-white text-black font-sans border-2 border-black p-3.5 shadow-md flex flex-col justify-between select-none relative box-border"
            style={{ width: '4in', height: '6in', minWidth: '4in', minHeight: '6in', maxWidth: '4in', maxHeight: '6in' }}
          >
            {/* 1. HEADER: Vendor / Store Identity & Routing */}
            <div className="pb-2 border-b-2 border-black flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 max-w-[68%]">
                {business.logo ? (
                  <img
                    src={business.logo}
                    alt={business.name}
                    className="w-10 h-10 object-contain rounded border border-black/20 shrink-0 bg-white"
                  />
                ) : (
                  <div className="w-9 h-9 rounded bg-black text-white font-black text-sm flex items-center justify-center shrink-0">
                    {business.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-extrabold text-[13px] leading-tight truncate uppercase tracking-tight text-black">
                    {business.name}
                  </h4>
                  {business.address && (
                    <p className="text-[9px] text-neutral-700 truncate leading-tight mt-0.5">
                      {business.address}
                      {business.city ? `, ${business.city}` : ''}
                      {business.pincode ? ` - ${business.pincode}` : ''}
                    </p>
                  )}
                  {business.phone && (
                    <p className="text-[9px] font-semibold text-black leading-tight">
                      Tel: {business.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Courier Routing Indicator */}
              <div className="text-right shrink-0">
                <div className="border border-black px-1.5 py-0.5 text-center font-black text-[10px] tracking-wider uppercase bg-black text-white">
                  STANDARD
                </div>
                <div className="text-[8px] font-mono font-bold mt-0.5">
                  AIR / SURFACE
                </div>
              </div>
            </div>

            {/* 2. BARCODE SECTION: Real Machine-Readable Code128 */}
            <div className="py-1.5 border-b border-black text-center flex flex-col items-center justify-center">
              <svg ref={barcodeRef} className="max-w-full h-11 mx-auto" />
              <div className="text-[8px] tracking-widest uppercase font-mono font-semibold text-neutral-600">
                IDENTIFIER: {order.orderNumber}
              </div>
            </div>

            {/* 3. SHIP TO / RECIPIENT INFORMATION (Primary Focus) */}
            <div className="py-2 border-b-2 border-black flex-1 flex flex-col justify-start">
              <div className="flex items-center justify-between pb-1 border-b border-black/20">
                <span className="font-black text-[10px] tracking-wider uppercase bg-black text-white px-1.5 py-0.5">
                  SHIP TO:
                </span>
                <span className="font-mono text-[9px] font-bold text-neutral-700">
                  PIN: {recipientPincode || order.customerPincode || 'N/A'}
                </span>
              </div>

              <div className="pt-1.5 space-y-0.5">
                <h3 className="font-extrabold text-[14px] leading-tight text-black uppercase">
                  {recipientName || order.customerName || 'VALUED CUSTOMER'}
                </h3>

                <div className="text-[11px] font-semibold text-black leading-snug">
                  Phone: {recipientPhone || order.customerPhone || 'N/A'}
                  {order.customerWhatsApp && order.customerWhatsApp !== (recipientPhone || order.customerPhone) && (
                    <span className="text-[9px] text-neutral-600 font-normal"> / {order.customerWhatsApp}</span>
                  )}
                </div>

                <p className="text-[11px] leading-snug text-neutral-900 pt-0.5 whitespace-pre-wrap font-medium">
                  {displayAddress}
                </p>

                <div className="text-[11px] font-bold text-black uppercase pt-0.5">
                  {[recipientCity || order.customerCity, recipientState || order.customerState, recipientPincode || order.customerPincode, order.customerCountry]
                    .filter(Boolean)
                    .join(', ')}
                </div>
              </div>
            </div>

            {/* 4. PAYMENT & COD AUTHORITATIVE BANNER */}
            <div className="my-1.5 border-2 border-black p-1.5 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-1.5">
                <div
                  className={`px-2 py-1 font-black text-[12px] uppercase tracking-wider text-center ${
                    isCod
                      ? 'bg-black text-white'
                      : 'bg-emerald-700 text-white'
                  }`}
                >
                  {isCod ? 'C.O.D.' : 'PREPAID'}
                </div>
                <div className="leading-tight">
                  <div className="text-[8px] uppercase tracking-wider text-neutral-600 font-bold">
                    {isCod ? 'Collect Cash on Delivery' : 'Do Not Collect Cash'}
                  </div>
                  <div className="text-[10px] font-extrabold text-black">
                    {isCod ? 'PAYMENT DUE' : 'FULLY PAID ONLINE'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[8px] uppercase tracking-wider text-neutral-600 font-bold">
                  {isCod ? 'AMOUNT TO COLLECT' : 'TOTAL VALUE'}
                </div>
                <div className="text-[14px] font-black text-black">
                  {business.currencySymbol}{order.total}
                </div>
              </div>
            </div>

            {/* 5. SHIPMENT SUMMARY & CONTENTS */}
            <div className="py-1.5 border-b border-black text-[9px] leading-tight space-y-1">
              <div className="flex justify-between items-center font-bold">
                <span className="uppercase text-[9px] text-neutral-700">
                  PACKAGE CONTENTS ({totalItemCount} {totalItemCount === 1 ? 'ITEM' : 'ITEMS'})
                </span>
                <span className="font-mono text-[9px] font-bold">
                  WEIGHT: {order.packageWeight || '0.50 KG (EST)'}
                </span>
              </div>

              {/* Items Line Summary */}
              <div className="space-y-0.5 max-h-14 overflow-hidden">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[9px] text-black">
                    <span className="truncate max-w-[80%] font-medium">
                      {item.quantity} × {item.name}
                      {item.variant ? ` (${item.variant})` : ''}
                    </span>
                    <span className="font-mono font-bold shrink-0">
                      {business.currencySymbol}{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. RETURN ADDRESS & VERIFICATION QR FOOTER */}
            <div className="pt-2 flex items-end justify-between gap-2">
              <div className="max-w-[75%] text-[8px] text-neutral-700 leading-tight space-y-0.5">
                <div className="font-extrabold uppercase text-black text-[9px]">
                  IF UNDELIVERED, RETURN TO:
                </div>
                <div className="font-bold text-black uppercase truncate">
                  {business.name}
                </div>
                <div className="truncate">
                  {business.address || 'Vendor Fulfillment Center'}
                  {business.city ? `, ${business.city}` : ''}
                  {business.pincode ? ` - ${business.pincode}` : ''}
                </div>
                <div>
                  Helpline: {business.phone || business.whatsapp || 'N/A'}
                </div>
              </div>

              {/* Verification & Public Order QR */}
              <div className="text-center shrink-0">
                <div className="p-1 bg-white border border-black inline-block">
                  <QRCodeSVG
                    value={publicTrackingUrl}
                    size={46}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="text-[7px] font-mono font-bold uppercase mt-0.5">
                  SCAN REF
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 print-hide-action">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyOrderRef}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copiedTracking ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy ID</span>
                </>
              )}
            </button>

            {onUpdateStatusToShipped && order.status !== 'shipped' && order.status !== 'delivered' && (
              <button
                type="button"
                onClick={handleMarkShipped}
                disabled={isUpdatingStatus}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isUpdatingStatus ? 'Updating...' : 'Mark as Shipped'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Label (4×6)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
