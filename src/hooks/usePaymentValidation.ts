import { useMemo } from 'react';
import { BusinessProfile } from '../types';

export interface PaymentFormState {
  upiId: string;
  upiQrImage: string;
  enableOnlinePayment: boolean;
  enableCod: boolean;
  enableBankTransfer: boolean;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  paymentInstructions: string;
  enableRazorpay?: boolean;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
}

export interface PaymentValidationResult {
  errors: Record<string, string>;
  warnings: string[];
  isValid: boolean;
  validateField: (field: keyof PaymentFormState, value: any) => string | null;
  getSanitizedPayload: (targetBusinessId: string) => Partial<BusinessProfile>;
}

// UPI VPA pattern: e.g. username@bank, 9876543210@paytm, store.name@okhdfcbank
const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z0-9.\-_]{2,32}$/;

// Indian Financial System Code (IFSC): 4 letters, 0, 6 alphanumeric chars
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// Indian Bank Account Number: typically 8 to 18 digits
const ACCOUNT_NUMBER_REGEX = /^[0-9]{8,20}$/;

// Razorpay Key format: rzp_test_... or rzp_live_...
const RAZORPAY_KEY_REGEX = /^rzp_(test|live)_[a-zA-Z0-9]{8,32}$/;

/**
 * Unified Payment Settings Validation & Multi-Tenant Scoping Hook
 * Ensures that payment credentials belong strictly to the selected business and are validated correctly.
 */
export function usePaymentValidation(
  formState: PaymentFormState,
  business: BusinessProfile | null
): PaymentValidationResult {
  return useMemo(() => {
    const errors: Record<string, string> = {};
    const warnings: string[] = [];

    // 1. Guard for missing business tenant context
    if (!business || !business.id) {
      errors.business = 'No valid business tenant is currently selected.';
    }

    // 2. Validate UPI Settings
    const trimmedUpi = formState.upiId.trim();
    if (formState.enableOnlinePayment) {
      if (!trimmedUpi) {
        errors.upiId = 'UPI ID is required when Online UPI Payment is enabled.';
      } else if (!UPI_REGEX.test(trimmedUpi)) {
        errors.upiId = 'Invalid UPI ID format. Expected format: username@bank (e.g. yourstore@okaxis, 9876543210@paytm)';
      }
    } else if (trimmedUpi && !UPI_REGEX.test(trimmedUpi)) {
      errors.upiId = 'Invalid UPI ID format. Please correct or clear the field.';
    }

    // 3. Validate Bank Transfer Details
    if (formState.enableBankTransfer) {
      const trimmedHolder = formState.accountHolderName.trim();
      const trimmedBank = formState.bankName.trim();
      const trimmedAccount = formState.accountNumber.trim().replace(/[\s-]/g, '');
      const trimmedIfsc = formState.ifscCode.trim().toUpperCase();

      if (!trimmedHolder) {
        errors.accountHolderName = 'Account holder name is required for bank transfers.';
      }
      if (!trimmedBank) {
        errors.bankName = 'Bank name is required.';
      }
      if (!trimmedAccount) {
        errors.accountNumber = 'Account number is required.';
      } else if (!ACCOUNT_NUMBER_REGEX.test(trimmedAccount)) {
        errors.accountNumber = 'Account number must be between 8 and 20 numeric digits.';
      }

      if (!trimmedIfsc) {
        errors.ifscCode = 'IFSC code is required.';
      } else if (!IFSC_REGEX.test(trimmedIfsc)) {
        errors.ifscCode = 'Invalid IFSC code. Format must be 4 letters, 0, then 6 alphanumeric characters (e.g. SBIN0001234, HDFC0000060).';
      }
    }

    // 4. Validate Vendor-Scoped Razorpay Gateway (if enabled)
    if (formState.enableRazorpay) {
      const trimmedKey = formState.razorpayKeyId?.trim() || '';
      if (!trimmedKey) {
        errors.razorpayKeyId = 'Razorpay Key ID is required when Custom Gateway is active.';
      } else if (!RAZORPAY_KEY_REGEX.test(trimmedKey)) {
        errors.razorpayKeyId = 'Invalid Razorpay Key ID. Must start with "rzp_test_" or "rzp_live_".';
      }
    }

    // 5. At least one payment mode should be enabled so buyers can check out
    const hasActivePaymentMode =
      formState.enableOnlinePayment ||
      formState.enableCod ||
      formState.enableBankTransfer ||
      formState.enableRazorpay;

    if (!hasActivePaymentMode) {
      warnings.push('All payment methods are currently disabled. Customers will not be able to complete checkout.');
    }

    // 6. Dynamic field validator function
    const validateField = (field: keyof PaymentFormState, value: any): string | null => {
      switch (field) {
        case 'upiId': {
          const str = String(value || '').trim();
          if (formState.enableOnlinePayment && !str) {
            return 'UPI ID is required.';
          }
          if (str && !UPI_REGEX.test(str)) {
            return 'Invalid UPI ID format (e.g. name@bank).';
          }
          return null;
        }
        case 'accountNumber': {
          if (!formState.enableBankTransfer) return null;
          const clean = String(value || '').trim().replace(/[\s-]/g, '');
          if (!clean) return 'Account number is required.';
          if (!ACCOUNT_NUMBER_REGEX.test(clean)) return 'Must be 8-20 numeric digits.';
          return null;
        }
        case 'ifscCode': {
          if (!formState.enableBankTransfer) return null;
          const clean = String(value || '').trim().toUpperCase();
          if (!clean) return 'IFSC code is required.';
          if (!IFSC_REGEX.test(clean)) return 'Invalid IFSC code format (e.g. SBIN0001234).';
          return null;
        }
        case 'accountHolderName': {
          if (!formState.enableBankTransfer) return null;
          if (!String(value || '').trim()) return 'Account holder name is required.';
          return null;
        }
        case 'razorpayKeyId': {
          if (!formState.enableRazorpay) return null;
          const clean = String(value || '').trim();
          if (!clean) return 'Razorpay Key ID is required.';
          if (!RAZORPAY_KEY_REGEX.test(clean)) return 'Must start with rzp_test_ or rzp_live_.';
          return null;
        }
        default:
          return null;
      }
    };

    // 7. Sanitized multi-tenant payload generator strictly tied to target business ID
    const getSanitizedPayload = (targetBusinessId: string): Partial<BusinessProfile> => {
      if (!targetBusinessId || (business && business.id !== targetBusinessId)) {
        throw new Error('Tenant mismatch: payment configuration can only be saved to the active business context.');
      }

      const trimmedUpiId = formState.upiId.trim();
      const sanitized: Partial<BusinessProfile> = {
        upiId: trimmedUpiId,
        upiQrImage: formState.upiQrImage.trim() || undefined,
        enableOnlinePayment: Boolean(formState.enableOnlinePayment && trimmedUpiId),
        enableCod: Boolean(formState.enableCod),
        enableBankTransfer: Boolean(formState.enableBankTransfer),
        bankDetails: formState.enableBankTransfer
          ? {
              accountNumber: formState.accountNumber.trim().replace(/[\s-]/g, ''),
              ifscCode: formState.ifscCode.trim().toUpperCase(),
              accountHolderName: formState.accountHolderName.trim(),
              bankName: formState.bankName.trim(),
              branchName: formState.branchName.trim(),
            }
          : undefined,
        paymentInstructions: formState.paymentInstructions.trim() || undefined,
      };

      return sanitized;
    };

    const isValid = Object.keys(errors).length === 0;

    return {
      errors,
      warnings,
      isValid,
      validateField,
      getSanitizedPayload,
    };
  }, [formState, business]);
}
