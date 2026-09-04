import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { db } from "../config/firebase";
import {
  PlatformRazorpayConfig,
  PlatformPricingPlan,
  PlatformPaymentTransaction,
} from "../types/admin";
import { BusinessProfile } from "../types";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const DEFAULT_RAZORPAY_CONFIG: PlatformRazorpayConfig = {
  keyId: "rzp_test_StorellyDemo369",
  keySecret: "",
  isEnabled: true,
  isTestMode: true,
  merchantName: "Storelly Business OS",
  merchantThemeColor: "#155330",
  autoUpgradePlan: true,
  currency: "INR",
};

// Dynamically load Razorpay SDK
export async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;

  return new Promise((resolve) => {
    const existingScript = document.getElementById("razorpay-checkout-js");
    if (existingScript) {
      existingScript.onload = () => resolve(true);
      existingScript.onerror = () => resolve(false);
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.warn("Could not load live Razorpay checkout script from CDN");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

// Fetch Razorpay configuration from global system_settings in Firestore
export async function getRazorpayConfig(): Promise<PlatformRazorpayConfig> {
  try {
    const snap = await getDoc(doc(db, "system_settings", "payment_config"));
    if (snap.exists()) {
      const data = snap.data() as PlatformRazorpayConfig;
      localStorage.setItem("storelly_razorpay_config", JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn("Error fetching Razorpay config from Firestore:", err);
  }

  try {
    const cached = localStorage.getItem("storelly_razorpay_config");
    if (cached) {
      const parsed = JSON.parse(cached) as PlatformRazorpayConfig;
      if (parsed?.keyId) return parsed;
    }
  } catch {}

  localStorage.setItem(
    "storelly_razorpay_config",
    JSON.stringify(DEFAULT_RAZORPAY_CONFIG),
  );
  return DEFAULT_RAZORPAY_CONFIG;
}

// Save Razorpay configuration to global system_settings
export async function saveRazorpayConfig(
  config: PlatformRazorpayConfig,
): Promise<void> {
  const payload: PlatformRazorpayConfig = {
    ...config,
    updatedAt: Date.now(),
  };

  try {
    await setDoc(doc(db, "system_settings", "payment_config"), payload);
    // Also mirror to platform_settings for backward compatibility
    await setDoc(doc(db, "platform_settings", "payment_config"), payload);
  } catch (err) {
    console.warn("Error writing Razorpay config to Firestore:", err);
  }

  localStorage.setItem("storelly_razorpay_config", JSON.stringify(payload));
  window.dispatchEvent(
    new CustomEvent("storelly_razorpay_config_changed", { detail: payload }),
  );
}

export interface RazorpayCheckoutOptions {
  plan: PlatformPricingPlan;
  business?: Partial<BusinessProfile> | null;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  onSuccess?: (transaction: PlatformPaymentTransaction) => void;
  onFailure?: (error: any) => void;
}

// Production-ready checkout trigger
export async function initiateRazorpaySubscription(
  options: RazorpayCheckoutOptions,
): Promise<void> {
  const { plan, business, customer, onSuccess, onFailure } = options;
  const config = await getRazorpayConfig();

  if (!config.isEnabled) {
    alert("Razorpay payments are currently disabled by the Super Admin.");
    if (onFailure) onFailure(new Error("Gateway disabled"));
    return;
  }

  const scriptLoaded = await loadRazorpayScript();

  if (!scriptLoaded || !window.Razorpay) {
    if (onFailure)
      onFailure(new Error("Payment gateway unavailable, please try again"));
    return; // Fast fail if script didn't load, no mock confirm allowed
  }

  // 1. Create order on the server
  let orderId = "";
  try {
    const orderRes = await fetch("/api/digital/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: plan.id,
        amount: plan.monthlyPrice,
        currency: config.currency || "INR",
        customerName: customer?.name || business?.name || "Merchant",
        customerPhone: customer?.phone || business?.phone || "",
      }),
    });

    if (!orderRes.ok) {
      throw new Error("Failed to create secure order");
    }

    const orderData = await orderRes.json();
    orderId = orderData.id;
  } catch (err) {
    if (onFailure)
      onFailure(new Error("Failed to initialize secure checkout session."));
    return;
  }

  // Handler upon verified payment
  const handlePaymentSuccess = async (response: {
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }) => {
    try {
      // 2. Verify signature on the server BEFORE writing to Firestore
      const verifyRes = await fetch("/api/subscription/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          amount: plan.monthlyPrice,
        }),
      });

      if (!verifyRes.ok) {
        throw new Error("Payment signature verification failed.");
      }

      // 3. Write to Firestore after successful verification
      const txId = "tx_" + Date.now();
      const transaction: PlatformPaymentTransaction = {
        id: txId,
        businessId: business?.id || "guest_vendor",
        businessName: business?.name || customer?.name || "Storelly Merchant",
        planId: plan.id,
        amount: plan.monthlyPrice,
        currency: plan.currency || "INR",
        status: "success",
        gateway: "razorpay",
        createdAt: Date.now(),
        receiptUrl: `https://storelly.com/receipts/${txId}`,
      };

      try {
        await setDoc(doc(db, "payment_transactions", txId), {
          ...transaction,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
        });
      } catch (err) {
        console.warn("Error recording payment transaction:", err);
      }

      try {
        const existingRaw = localStorage.getItem(
          "storelly_payment_transactions",
        );
        const existing: PlatformPaymentTransaction[] = existingRaw
          ? JSON.parse(existingRaw)
          : [];
        existing.unshift(transaction);
        localStorage.setItem(
          "storelly_payment_transactions",
          JSON.stringify(existing),
        );
      } catch {}

      if (config.autoUpgradePlan && business?.id) {
        try {
          const planSlug = plan.name.toLowerCase().includes("pro")
            ? "pro"
            : plan.id.replace("plan_", "");
          await setDoc(
            doc(db, "businesses", business.id),
            {
              subscriptionPlan: planSlug,
              subscriptionStatus: "active",
              subscriptionExpiry: Date.now() + 30 * 24 * 60 * 60 * 1000,
              updatedAt: Date.now(),
            },
            { merge: true },
          );
        } catch (err) {
          console.warn("Error updating business subscription:", err);
        }
      }

      window.dispatchEvent(
        new CustomEvent("storelly_subscription_upgraded", {
          detail: { plan, transaction, businessId: business?.id },
        }),
      );
      window.dispatchEvent(
        new CustomEvent("storelly_payment_completed", { detail: transaction }),
      );

      if (onSuccess) {
        onSuccess(transaction);
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      if (onFailure) onFailure(err);
    }
  };

  const amountInPaise = Math.max(1, Math.round(plan.monthlyPrice * 100));

  const rzpOptions = {
    key:
      config.keyId ||
      (import.meta as any).env?.VITE_RAZORPAY_KEY_ID ||
      "rzp_test_StorellyDemo369",
    amount: amountInPaise,
    currency: config.currency || "INR",
    order_id: orderId, // Critical for signature verification
    name: config.merchantName || "Storelly Business OS",
    description: `${plan.name} Tier Upgrade (${plan.billingCycle || "Monthly"})`,
    image: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    handler: function (response: any) {
      handlePaymentSuccess(response);
    },
    prefill: {
      name: customer?.name || business?.name || "Store Merchant",
      email: customer?.email || business?.email || "vendor@storelly.com",
      contact:
        customer?.phone ||
        business?.phone ||
        business?.whatsapp ||
        "9876543210",
    },
    notes: {
      plan_id: plan.id,
      plan_name: plan.name,
      business_id: business?.id || "n/a",
    },
    theme: {
      color: config.merchantThemeColor || "#155330",
    },
    modal: {
      ondismiss: function () {
        if (onFailure) onFailure(new Error("Checkout dismissed by user"));
      },
    },
  };

  try {
    const rzpInstance = new window.Razorpay(rzpOptions);
    rzpInstance.open();
  } catch (e) {
    if (onFailure)
      onFailure(new Error("Payment gateway unavailable, please try again"));
  }
}

export async function getAllPaymentTransactions(): Promise<
  PlatformPaymentTransaction[]
> {
  try {
    const snap = await getDocs(collection(db, "payment_transactions"));
    const list = snap.docs.map((d) => d.data() as PlatformPaymentTransaction);
    if (list.length > 0) {
      list.sort((a, b) => b.createdAt - a.createdAt);
      localStorage.setItem(
        "storelly_payment_transactions",
        JSON.stringify(list),
      );
      return list;
    }
  } catch (err) {
    console.warn("Error fetching transactions from Firestore:", err);
  }

  try {
    const cached = localStorage.getItem("storelly_payment_transactions");
    if (cached) return JSON.parse(cached);
  } catch {}

  return [
    {
      id: "tx_sample_1",
      businessId: "biz_demo_1",
      businessName: "Royal Silk Sarees",
      planId: "plan_pro",
      amount: 199,
      currency: "INR",
      status: "success",
      gateway: "razorpay",
      createdAt: Date.now() - 86400000 * 2,
      receiptUrl: "https://storelly.com/receipts/tx_sample_1",
    },
    {
      id: "tx_sample_2",
      businessId: "biz_demo_2",
      businessName: "ByteCraft Coding Academy",
      planId: "plan_pro",
      amount: 199,
      currency: "INR",
      status: "success",
      gateway: "razorpay",
      createdAt: Date.now() - 86400000 * 4,
      receiptUrl: "https://storelly.com/receipts/tx_sample_2",
    },
  ];
}
