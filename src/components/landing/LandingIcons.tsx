import React from 'react';

// Official UPI (Unified Payments Interface) Logo Badge
export const UpiLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
  >
    {/* UPI Tricolor Angles */}
    <path d="M52 14L22 86H40L58 42L70 86H88L52 14Z" fill="#097939" />
    <path d="M58 42L52 14L70 42H58Z" fill="#F47920" />
    <path d="M40 86L58 42H46L34 72L40 86Z" fill="#097939" />
    <path d="M12 86H26L36 62L26 40L12 86Z" fill="#F47920" />
  </svg>
);

// Official Google Pay Badge
export const GooglePayLogo: React.FC<{ className?: string; height?: number }> = ({ className = '', height = 20 }) => (
  <span className={`inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-100 ${className}`} style={{ fontSize: `${height * 0.75}px` }}>
    <svg width={height * 1.1} height={height} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M43.6 20.1H42V20H24V28H35.3C33.7 32.7 29.2 36 24 36C17.4 36 12 30.6 12 24C12 17.4 17.4 12 24 12C27.1 12 29.8 13.1 32 15L37.7 9.3C34.1 6 29.3 4 24 4C13 4 4 13 4 24C4 35 13 44 24 44C35 44 43.6 36 43.6 24C43.6 22.7 43.5 21.4 43.6 20.1Z" fill="#FFC107" />
      <path d="M6.3 14.7L12.9 19.5C14.7 15.1 18.9 12 24 12C27.1 12 29.8 13.1 32 15L37.7 9.3C34.1 6 29.3 4 24 4C16.3 4 9.7 8.4 6.3 14.7Z" fill="#FF3D00" />
      <path d="M24 44C29.2 44 33.9 42.1 37.5 38.9L31.2 33.8C29.2 35.2 26.7 36 24 36C18.9 36 14.6 32.8 12.9 28.4L6.3 33.5C9.7 39.7 16.3 44 24 44Z" fill="#4CAF50" />
      <path d="M43.6 24C43.6 22.7 43.4 21.3 43.2 20H24V28H35.3C34.5 30.4 33.1 32.4 31.2 33.8L37.5 38.9C41.2 35.4 43.6 30.2 43.6 24Z" fill="#1976D2" />
    </svg>
    <span className="font-sans font-bold tracking-tight">GPay</span>
  </span>
);

// Official PhonePe Badge (Purple circle with 'पे')
export const PhonePeLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => (
  <span className={`inline-flex items-center gap-1.5 font-bold text-[#5f259f] dark:text-[#a855f7] ${className}`} style={{ fontSize: `${size * 0.65}px` }}>
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="24" fill="#5f259f" />
      <path d="M52 26V35H46C43.8 35 42 36.8 42 39V44H52V52H42V74H33V26H52Z" fill="white" />
      <path d="M52 44H62C67.5 44 72 48.5 72 54C72 59.5 67.5 64 62 64H52V44ZM52 52V56H61C62.1 56 63 55.1 63 54C63 52.9 62.1 52 61 52H52Z" fill="white" />
      <path d="M60 64L71 74H60L51 64H60Z" fill="white" />
    </svg>
    <span className="font-sans font-extrabold tracking-tight">PhonePe</span>
  </span>
);

// Official Paytm Badge (Navy and Cyan)
export const PaytmLogo: React.FC<{ className?: string; height?: number }> = ({ className = '', height = 22 }) => (
  <span className={`inline-flex items-center gap-1 font-bold ${className}`} style={{ fontSize: `${height * 0.7}px` }}>
    <span className="bg-[#002970] text-white px-1.5 py-0.5 rounded font-black tracking-tight text-[11px]">Pay</span>
    <span className="bg-[#00b9f5] text-white px-1.5 py-0.5 rounded font-black tracking-tight text-[11px]">tm</span>
  </span>
);

// Official BHIM Logo
export const BhimLogo: React.FC<{ className?: string; height?: number }> = ({ className = '', height = 20 }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-extrabold text-[11px] ${className}`}>
    <span className="text-[#0077b6] font-black">BHIM</span>
    <span className="text-[#f37021] font-black">UPI</span>
  </span>
);

// Zero Coding Required Badge Icon
export const ZeroCodingIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 28 }) => (
  <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Code bracket background */}
      <rect width="40" height="40" rx="10" fill="currentColor" fillOpacity="0.12" />
      {/* Code brackets < / > */}
      <path d="M12 15L7 20L12 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 15L33 20L28 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Slash / */}
      <path d="M22 13L18 27" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Red/Green No-Code Slash Overlay or Sparkle */}
      <circle cx="31" cy="9" r="6" fill="#10b981" />
      <path d="M29 9L30.5 10.5L33.5 7.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// Official Google Meet Video Icon
export const GoogleMeetIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M30 19.5V13C30 11.3 28.7 10 27 10H7C5.3 10 4 11.3 4 13V35C4 36.7 5.3 38 7 38H27C28.7 38 30 36.7 30 35V28.5L42 36V12L30 19.5Z" fill="#00832D" />
    <path d="M42 12L30 20.5V27.5L42 36V12Z" fill="#0066DA" />
    <path d="M4 35C4 36.7 5.3 38 7 38H18L4 24V35Z" fill="#E53935" />
    <path d="M30 13C30 11.3 28.7 10 27 10H18L30 22V13Z" fill="#FFBA00" />
    <path d="M18 10H7C5.3 10 4 11.3 4 13V24L18 38H27C28.7 38 30 36.7 30 35V27.5L18 10Z" fill="#00AC47" />
  </svg>
);

// WhatsApp Official Round Badge
export const WhatsAppBadge: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 24 }) => (
  <span className={`inline-flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm ${className}`} style={{ width: size, height: size }}>
    <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  </span>
);
