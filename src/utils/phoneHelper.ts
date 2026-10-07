/**
 * Phone and WhatsApp Number Sanitize & Validation Utilities
 */

/**
 * Strips all non-digit and non-plus characters on input/typing
 * Prevents alphabet and symbol injection in phone/WhatsApp fields
 */
export function sanitizePhoneNumberInput(val: string): string {
  if (!val) return '';
  // Preserve leading '+' if present, strip all other non-digits
  const hasLeadingPlus = val.trim().startsWith('+');
  const digitsOnly = val.replace(/\D/g, '');
  if (!digitsOnly) return hasLeadingPlus ? '+' : '';
  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
}

/**
 * Format phone number into clean E.164 or Indian 10-digit format
 */
export function formatPhoneNumberForDisplay(val: string): string {
  const clean = sanitizePhoneNumberInput(val);
  if (!clean) return '';
  const digits = clean.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return clean;
}

/**
 * Format phone/WhatsApp for WhatsApp URL wa.me/...
 */
export function getWhatsAppCleanNumber(val: string): string {
  let digits = (val || '').replace(/\D/g, '');
  if (!digits) return '';
  // If 10 digits (standard Indian mobile), prepend 91
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  return digits;
}

/**
 * Validates if string is a valid mobile/WhatsApp number (min 10 digits)
 */
export function isValidPhoneNumber(val: string): boolean {
  const digits = (val || '').replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}
