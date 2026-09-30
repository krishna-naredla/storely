/**
 * Global Validation Utilities for Storelly
 * Provides strict, user-friendly field validation across onboarding, dashboard forms,
 * customer checkout, booking, and settings.
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a phone number.
 * Accepts digits, optional leading '+', optional spaces/dashes.
 * Rejects non-numeric alphabetic text ('abc', 'hello', etc.)
 * Requires at least 10 numeric digits.
 */
export function validatePhone(phone: string, required: boolean = true): ValidationResult {
  const trimmed = (phone || '').trim();
  if (!trimmed) {
    if (required) {
      return { isValid: false, error: 'Mobile / WhatsApp number is required.' };
    }
    return { isValid: true };
  }

  // Reject alphabets and invalid characters
  if (/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: 'Phone number cannot contain letters or text.' };
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 10) {
    return { isValid: false, error: 'Please enter a valid 10-digit mobile number.' };
  }

  if (digits.length > 15) {
    return { isValid: false, error: 'Phone number is too long (maximum 15 digits).' };
  }

  return { isValid: true };
}

/**
 * Validates an email address.
 */
export function validateEmail(email: string, required: boolean = false): ValidationResult {
  const trimmed = (email || '').trim();
  if (!trimmed) {
    if (required) {
      return { isValid: false, error: 'Email address is required.' };
    }
    return { isValid: true };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@example.com).' };
  }

  return { isValid: true };
}

/**
 * Validates a web URL.
 */
export function validateUrl(url: string, required: boolean = false): ValidationResult {
  const trimmed = (url || '').trim();
  if (!trimmed) {
    if (required) {
      return { isValid: false, error: 'URL link is required.' };
    }
    return { isValid: true };
  }

  try {
    const formatted = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
    new URL(formatted);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Please enter a valid web URL (e.g. https://yourwebsite.com).' };
  }
}

/**
 * Validates a price or monetary amount.
 * Must be a non-negative number.
 */
export function validatePrice(value: number | string, min: number = 0, required: boolean = true): ValidationResult {
  if (value === '' || value === null || value === undefined) {
    if (required) {
      return { isValid: false, error: 'Price is required.' };
    }
    return { isValid: true };
  }

  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) {
    return { isValid: false, error: 'Please enter a valid numeric price amount.' };
  }

  if (num < min) {
    return { isValid: false, error: `Price cannot be less than ₹${min}.` };
  }

  return { isValid: true };
}

/**
 * Validates stock quantity.
 * Must be an integer >= 0.
 */
export function validateStock(value: number | string): ValidationResult {
  if (value === '' || value === null || value === undefined) {
    return { isValid: true };
  }

  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num) || !Number.isInteger(num)) {
    return { isValid: false, error: 'Stock quantity must be a whole integer number.' };
  }

  if (num < 0) {
    return { isValid: false, error: 'Stock quantity cannot be negative.' };
  }

  return { isValid: true };
}

/**
 * Validates a percentage (e.g. tax rate or discount).
 * Must be between 0 and 100.
 */
export function validatePercentage(value: number | string, fieldName: string = 'Percentage'): ValidationResult {
  if (value === '' || value === null || value === undefined) {
    return { isValid: true };
  }

  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number.` };
  }

  if (num < 0 || num > 100) {
    return { isValid: false, error: `${fieldName} must be between 0% and 100%.` };
  }

  return { isValid: true };
}

/**
 * Validates a required text field.
 */
export function validateRequiredText(text: string, fieldLabel: string, minLength: number = 1): ValidationResult {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return { isValid: false, error: `${fieldLabel} is required.` };
  }

  if (trimmed.length < minLength) {
    return { isValid: false, error: `${fieldLabel} must be at least ${minLength} characters.` };
  }

  return { isValid: true };
}
