import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import crypto from "crypto";
import bodyParser from "body-parser";
import Razorpay from "razorpay";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, getFirestore, doc, getDoc, collection, query, where, getDocs, limit, updateDoc, setDoc, runTransaction } from "firebase/firestore";
import { initializeApp as initAdminApp, getApps as getAdminApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import appletConfig from "./firebase-applet-config.json";

// Initialize Firebase Client for canonical server-side data verification
const firebaseApp = !getApps().length
  ? initializeApp({
      apiKey: appletConfig.apiKey,
      authDomain: appletConfig.authDomain,
      projectId: appletConfig.projectId,
      storageBucket: appletConfig.storageBucket,
      appId: appletConfig.appId,
    })
  : getApp();

// Initialize Firebase Admin for token verification
if (!getAdminApps().length) {
  initAdminApp({
    projectId: appletConfig.projectId,
  });
}

const targetDbId =
  appletConfig.firestoreDatabaseId && appletConfig.firestoreDatabaseId.trim()
    ? appletConfig.firestoreDatabaseId.trim()
    : undefined;

const serverDb =
  targetDbId && targetDbId !== "(default)"
    ? initializeFirestore(firebaseApp, {}, targetDbId)
    : getFirestore(firebaseApp);

// Initialize Razorpay
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

const razorpay = (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) 
  ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET }) 
  : null;

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dxbkgx6tl";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "618932888682632";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Helper for constant-time comparison to prevent timing attacks on signatures
function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// In-Memory Rate Limiter Factory
interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

const createRateLimiter = (options: RateLimitOptions) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requests.entries()) {
      if (now > data.resetTime) {
        requests.delete(key);
      }
    }
  }, options.windowMs);

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const record = requests.get(key);

    if (!record || now > record.resetTime) {
      requests.set(key, { count: 1, resetTime: now + options.windowMs });
      return next();
    }

    if (record.count >= options.maxRequests) {
      res.setHeader("Retry-After", Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json({
        error: options.message || "Too many requests. Please try again later.",
      });
    }

    record.count += 1;
    next();
  };
};

const aiLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 20, message: "AI rate limit exceeded. Please wait a minute." });
const paymentLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 30, message: "Payment rate limit exceeded." });
const downloadLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 40, message: "Download rate limit exceeded." });
const uploadSignLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 30, message: "Upload signing rate limit exceeded." });

// Middleware to verify Firebase ID Token
const verifyAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying ID token:", error);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// Middleware to verify Master Admin authorization
const verifyAdminAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    (req as any).user = decodedToken;

    if (decodedToken.admin || decodedToken.masterAdmin) {
      return next();
    }

    const email = decodedToken.email?.toLowerCase();
    const uid = decodedToken.uid;

    if (email && email === "maninaredla218@gmail.com" && decodedToken.email_verified) {
      return next();
    }

    if (uid) {
      const adminSnap = await getDoc(doc(serverDb, "admins", uid));
      if (adminSnap.exists() && adminSnap.data()?.isActive !== false) {
        return next();
      }
    }
    if (email && decodedToken.email_verified) {
      const emailSnap = await getDoc(doc(serverDb, "admins", email));
      if (emailSnap.exists() && emailSnap.data()?.isActive !== false) {
        return next();
      }
    }

    return res.status(403).json({ error: "Forbidden: Master Admin privileges required." });
  } catch (error) {
    console.error("Error verifying Admin token:", error);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

const TOKEN_SIGNING_SECRET =
  process.env.JWT_SECRET ||
  CLOUDINARY_API_SECRET ||
  "storelly_digital_secret_key_2026";

// Helper to resolve canonical product from Firestore database
async function resolveCanonicalProduct(businessId?: string, itemId?: string) {
  if (!itemId) return null;

  // 1. Direct path in business catalog subcollection
  if (businessId) {
    try {
      const snap = await getDoc(doc(serverDb, "businesses", businessId, "catalog", itemId));
      if (snap.exists()) return snap.data();
    } catch (e) {
      console.warn("[Server DB] Could not fetch catalog item from subcollection:", e);
    }
  }

  // 2. Direct path in top-level catalog
  try {
    const topSnap = await getDoc(doc(serverDb, "catalog", itemId));
    if (topSnap.exists()) return topSnap.data();
  } catch (e) {
    // ignore
  }

  // 3. Fallback scan across businesses if businessId wasn't passed
  if (!businessId) {
    try {
      const bSnap = await getDocs(query(collection(serverDb, "businesses"), limit(20)));
      for (const bDoc of bSnap.docs) {
        const itemSnap = await getDoc(doc(serverDb, "businesses", bDoc.id, "catalog", itemId));
        if (itemSnap.exists()) return itemSnap.data();
      }
    } catch (e) {
      // ignore
    }
  }

  return null;
}

// Helper to resolve canonical order from Firestore database
async function resolveCanonicalOrder(businessId?: string, orderId?: string) {
  if (!orderId) return null;

  if (businessId) {
    try {
      const snap = await getDoc(doc(serverDb, "businesses", businessId, "orders", orderId));
      if (snap.exists()) return snap.data();
    } catch (e) {
      // ignore
    }
  }

  try {
    const snap = await getDoc(doc(serverDb, "orders", orderId));
    if (snap.exists()) return snap.data();
  } catch (e) {
    // ignore
  }

  return null;
}

// Helper to generate a 10-minute signed token for a download
function generateDownloadToken(payload: {
  itemId: string;
  orderId: string;
  fileUrl: string;
  fileName?: string;
  expiresAt: number;
}): string {
  const data = JSON.stringify(payload);
  const base64Data = Buffer.from(data).toString("base64url");
  const signature = crypto
    .createHmac("sha256", TOKEN_SIGNING_SECRET)
    .update(base64Data)
    .digest("base64url");
  return `${base64Data}.${signature}`;
}

// Helper to verify download token
function verifyDownloadToken(token: string): {
  valid: boolean;
  expired: boolean;
  payload?: {
    itemId: string;
    orderId: string;
    fileUrl: string;
    fileName?: string;
    expiresAt: number;
  };
} {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return { valid: false, expired: false };
    const [base64Data, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", TOKEN_SIGNING_SECRET)
      .update(base64Data)
      .digest("base64url");
    if (!timingSafeCompare(signature, expectedSignature))
      return { valid: false, expired: false };

    const payloadString = Buffer.from(base64Data, "base64url").toString(
      "utf8",
    );
    const payload = JSON.parse(payloadString);
    if (Date.now() > payload.expiresAt) return { valid: true, expired: true };

    return { valid: true, expired: false, payload };
  } catch (err) {
    return { valid: false, expired: false };
  }
}

export const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// --- API ROUTES ---

// Helper to update quote payment status in Firestore (Idempotent)
async function createServerNotification(businessId: string, data: {
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
}) {
  try {
    const colRef = collection(serverDb, "businesses", businessId, "notifications");
    const docRef = doc(colRef);
    await setDoc(docRef, {
      ...data,
      id: docRef.id,
      businessId,
      read: false,
      createdAt: Date.now(),
    });
  } catch (err) {
    console.error("[SERVER NOTIFICATION] Failed:", err);
  }
}

async function updateQuotePayment(businessId: string, requestId: string, paymentId: string, signature?: string) {
  try {
    const quoteRef = doc(serverDb, "businesses", businessId, "quote_requests", requestId);
    const snap = await getDoc(quoteRef);
    if (!snap.exists()) {
      console.error(`[PAYMENT] Quote ${requestId} not found for update.`);
      return false;
    }

    const data = snap.data();
    if (data.paymentStatus === "paid") return true;

    const updates: any = {
      status: "accepted",
      paymentStatus: "paid",
      razorpayPaymentId: paymentId,
      paidAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (signature) updates.razorpaySignature = signature;

    await updateDoc(quoteRef, updates);
    console.log(`[PAYMENT] Quote ${requestId} marked as PAID via ${paymentId}`);

    await createServerNotification(businessId, {
      type: "payment",
      title: "Quote Payment Verified",
      message: `Payment received for quote #${data.requestNumber}.`,
      link: "/dashboard/quotes",
      metadata: { requestId, paymentId }
    });

    return true;
  } catch (err) {
    console.error(`[PAYMENT] Failed to update quote ${requestId}:`, err);
    return false;
  }
}

// Helper to update event ticket payment status and create ticket (Atomic)
async function updateEventTicketPayment(businessId: string, eventId: string, buyerDetails: any) {
  try {
    const eventRef = doc(serverDb, "businesses", businessId, "events", eventId);
    
    // We use a transaction to ensure capacity is authoritative and atomic
    const result = await runTransaction(serverDb, async (transaction) => {
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists()) throw new Error("Event not found");
      
      const event = eventSnap.data();
      const currentSold = Number(event.ticketsSold) || 0;
      const capacity = Number(event.capacity) || 0;
      let seatsRemaining = event.seatsRemaining !== undefined ? Number(event.seatsRemaining) : capacity - currentSold;

      if (seatsRemaining <= 0 || currentSold >= capacity) {
        throw new Error("Sold Out");
      }

      // Check if ticket already exists for this payment (Idempotency)
      if (buyerDetails.paymentId) {
        const ticketsSnap = await getDocs(query(
          collection(serverDb, "businesses", businessId, "tickets"),
          where("paymentId", "==", buyerDetails.paymentId)
        ));
        if (!ticketsSnap.empty) return { success: true, alreadyExists: true };
      }

      const nextSold = currentSold + 1;
      const nextSeats = seatsRemaining - 1;
      const nextStatus = nextSeats <= 0 ? "sold_out" : (event.status || "upcoming");

      // 1. Update event
      transaction.update(eventRef, {
        ticketsSold: nextSold,
        seatsRemaining: nextSeats,
        status: nextStatus,
        updatedAt: Date.now()
      });

      // 2. Create ticket
      const ticketRef = doc(collection(serverDb, "businesses", businessId, "tickets"));
      const ticketCode = `TKT-${ticketRef.id.slice(-8).toUpperCase()}`;
      const newTicket = {
        id: ticketRef.id,
        ticketId: ticketCode,
        eventId,
        eventTitle: event.title,
        businessId,
        customerName: buyerDetails.customerName,
        customerPhone: buyerDetails.customerPhone,
        customerEmail: buyerDetails.customerEmail,
        format: event.format,
        eventDate: event.eventDate,
        eventTime: event.eventTime,
        price: Number(event.price) || 0,
        paymentStatus: "paid",
        paymentId: buyerDetails.paymentId,
        razorpayOrderId: buyerDetails.razorpayOrderId,
        checkedIn: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      transaction.set(ticketRef, newTicket);

      return { success: true, ticket: newTicket };
    });

    if (result.success && !result.alreadyExists) {
      console.log(`[PAYMENT] Event ticket created for ${eventId} via ${buyerDetails.paymentId}`);
      await createServerNotification(businessId, {
        type: "event",
        title: "New Event Ticket Sold",
        message: `${buyerDetails.customerName} purchased a ticket for "${result.ticket.eventTitle}".`,
        link: "/dashboard/events",
        metadata: { eventId, ticketId: result.ticket.id }
      });
    }

    return true;
  } catch (err: any) {
    console.error(`[PAYMENT] Failed to create event ticket for ${eventId}:`, err.message);
    return false;
  }
}

// 0. Webhook Raw Body Handling
app.post(
  "/api/webhooks/razorpay",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"] as string;
      if (!RAZORPAY_WEBHOOK_SECRET) {
        console.error("[Webhook] RAZORPAY_WEBHOOK_SECRET is not configured.");
        return res.status(500).send("Webhook secret missing");
      }

      const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
        .update(req.body)
        .digest("hex");

      if (expectedSignature !== signature) {
        console.error("[Webhook] Signature verification failed.");
        return res.status(400).send("Invalid signature");
      }

      // Parse body only AFTER verification
      const body = JSON.parse(req.body.toString());
      const event = body.event;
      console.log(`[Webhook] Event: ${event}`);

      if (event === "payment.captured" || event === "order.paid") {
        const payment = body.payload.payment.entity;
        const rzpOrderId = payment.order_id;
        const notes = payment.notes || {};
        const businessId = notes.businessId;
        const type = notes.type;

        if (businessId) {
          if (type === "quote_payment" && notes.requestId) {
            await updateQuotePayment(businessId, notes.requestId, payment.id);
          } else if (type === "event_ticket" && notes.eventId) {
            await updateEventTicketPayment(businessId, notes.eventId, {
              customerName: notes.customerName,
              customerPhone: notes.customerPhone,
              paymentId: payment.id,
              razorpayOrderId: rzpOrderId
            });
          } else if (type === "digital_product" && notes.itemId) {
            // Digital products usually handled in verify-payment, but webhook ensures fallback
            const localOrderId = notes.localOrderId || rzpOrderId;
            await updateOrderPayment(businessId, localOrderId, payment.id);
          } else {
            // Physical Order
            const localOrderId = notes.localOrderId || rzpOrderId;
            await updateOrderPayment(businessId, localOrderId, payment.id);
          }
        }
      }

      res.json({ status: "ok" });
    } catch (err: any) {
      console.error("[Webhook] Processing failed:", err);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// 1. Cloudinary Signature Routes
const handleCloudinarySigning = async (req: express.Request, res: express.Response) => {
  try {
    const params = req.body?.paramsToSign || req.body || {};
    const timestamp = params.timestamp || Math.round(new Date().getTime() / 1000);

    if (!CLOUDINARY_API_SECRET) {
      console.error("[Cloudinary] Server error: CLOUDINARY_API_SECRET is not configured.");
      return res.status(500).json({ error: "Cloudinary service is not configured for secure signing." });
    }

    // Validate timestamp freshness (within 5 minutes)
    const currentUnix = Math.round(new Date().getTime() / 1000);
    if (Math.abs(currentUnix - Number(timestamp)) > 300) {
      return res.status(400).json({ error: "Timestamp expired or out of bounds." });
    }

    // Sort and serialize parameters as required by Cloudinary signing specification
    const sortedKeys = Object.keys(params).filter(k => k !== 'timestamp' && k !== 'file').sort();
    let toSign = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
    if (toSign) toSign += '&';
    toSign += `timestamp=${timestamp}`;

    const signature = crypto
      .createHash("sha1")
      .update(toSign + CLOUDINARY_API_SECRET)
      .digest("hex");

    return res.json({
      signed: true,
      signature,
      timestamp,
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Apply auth verification to signing routes with rate limiting
app.post("/api/cloudinary/sign", uploadSignLimiter, verifyAuth, handleCloudinarySigning);
app.post("/api/digital/sign-upload", uploadSignLimiter, verifyAuth, handleCloudinarySigning);

// 2. Free Digital Download Route (Canonical Entitlement Verification)
app.post("/api/digital/free", downloadLimiter, async (req, res) => {
  try {
    const { itemId, businessId, customerEmail, customerName } = req.body;
    if (!itemId) {
      return res.status(400).json({ success: false, error: "Product itemId is required." });
    }

    // Resolve product authoritatively from canonical Firestore database
    const canonicalProduct = await resolveCanonicalProduct(businessId, itemId);
    if (!canonicalProduct) {
      return res.status(404).json({ success: false, error: "Product not found in official catalog." });
    }

    const price = Number(canonicalProduct.salePrice ?? canonicalProduct.price ?? 0);
    const isFree = canonicalProduct.isFree === true || price === 0;

    if (!isFree) {
      return res.status(403).json({
        success: false,
        error: "This digital product requires paid purchase.",
      });
    }

    const canonicalFileUrl = canonicalProduct.digitalFileUrl || canonicalProduct.fileUrl;
    if (!canonicalFileUrl) {
      return res.status(400).json({
        success: false,
        error: "No digital asset is configured for this product.",
      });
    }

    const canonicalFileName = canonicalProduct.digitalFileName || canonicalProduct.fileName || canonicalProduct.name || "download";
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    const token = generateDownloadToken({
      itemId,
      orderId: `free_${Date.now()}`,
      fileUrl: canonicalFileUrl,
      fileName: canonicalFileName,
      expiresAt,
    });

    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers.host || `localhost:${PORT}`;
    const downloadUrl = `${protocol}://${host}/api/digital/download?token=${encodeURIComponent(token)}`;

    res.json({
      success: true,
      downloadUrl,
      expiresAt,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to update order payment status in Firestore (Idempotent)
async function updateOrderPayment(businessId: string, orderId: string, paymentId: string, signature?: string) {
  try {
    const orderRef = businessId 
      ? doc(serverDb, "businesses", businessId, "orders", orderId)
      : doc(serverDb, "orders", orderId);
    
    const snap = await getDoc(orderRef);
    if (!snap.exists()) {
      console.error(`[PAYMENT] Order ${orderId} not found for update.`);
      return false;
    }

    const orderData = snap.data();
    if (orderData.paymentStatus === "paid") {
      return true; // Already processed
    }

    const updates: any = {
      paymentStatus: "paid",
      razorpayPaymentId: paymentId,
      updatedAt: Date.now(),
    };

    if (signature) updates.razorpaySignature = signature;
    if (orderData.status === "pending" || orderData.status === "pending-verification") {
      updates.status = "confirmed";
    }

    await updateDoc(orderRef, updates);
    console.log(`[PAYMENT] Order ${orderId} marked as PAID via ${paymentId}`);

    if (businessId) {
      await createServerNotification(businessId, {
        type: "payment",
        title: "Order Payment Verified",
        message: `Payment received for order #${orderData.orderNumber || orderId}.`,
        link: "/dashboard/orders",
        metadata: { orderId, paymentId }
      });
    }

    return true;
  } catch (err) {
    console.error(`[PAYMENT] Failed to update order ${orderId}:`, err);
    return false;
  }
}

// 3. Paid Digital Order Route (Creates Order With Canonical Price)
app.post("/api/digital/create-order", paymentLimiter, async (req, res) => {
  try {
    const {
      itemId,
      businessId,
      customerName,
      customerPhone,
      customerEmail,
      currency = "INR",
    } = req.body;

    if (!itemId) {
      return res.status(400).json({ success: false, error: "Product itemId is required." });
    }

    // Resolve authoritative price from canonical Firestore database
    const canonicalProduct = await resolveCanonicalProduct(businessId, itemId);
    if (!canonicalProduct) {
      return res.status(404).json({ success: false, error: "Product not found in catalog." });
    }

    const orderAmount = Number(canonicalProduct.salePrice ?? canonicalProduct.price ?? 0);
    if (orderAmount <= 0) {
      return res.status(400).json({ success: false, error: "Product is free. Use free checkout flow." });
    }

    if (!razorpay) {
      return res.status(500).json({ 
        success: false, 
        error: "Razorpay is not configured on the server. Online payments are currently unavailable." 
      });
    }

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(orderAmount * 100),
      currency: currency || "INR",
      receipt: `digi_${Date.now()}`,
      notes: {
        itemId: itemId || "",
        businessId: businessId || "",
        customerName: customerName || "",
        type: "digital_product"
      },
    });

    res.json({
      success: true,
      id: rzpOrder.id,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
    });
  } catch (err: any) {
    console.error("[Razorpay] Digital order creation failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3b. Verify Digital Payment & Grant Access Token (FAIL-CLOSED)
app.post("/api/digital/verify-payment", paymentLimiter, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      itemId,
      businessId,
    } = req.body;
    
    // STRICT FAIL-CLOSED: if secret is missing, never treat payment as verified
    if (!RAZORPAY_KEY_SECRET || !razorpay) {
      return res.status(500).json({
        success: false,
        error: "Payment verification service is unavailable. Server secret is not configured.",
      });
    }

    if (!razorpay_signature || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required payment verification details.",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!timingSafeCompare(generatedSignature, razorpay_signature)) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature verification failed.",
      });
    }

    // Update the payment status in DB (Digital orders might be created at verify time if they weren't persisted before)
    // For digital products, we often create the order record only AFTER success if it's a simple buy-now
    // But Storelly uses Order records. Let's see if we can find one.
    await updateOrderPayment(businessId, razorpay_order_id, razorpay_payment_id, razorpay_signature);

    // Resolve authoritative product asset from canonical database
    const canonicalProduct = await resolveCanonicalProduct(businessId, itemId);
    if (!canonicalProduct) {
      return res.status(404).json({
        success: false,
        error: "Payment verified, but requested product was not found in catalog.",
      });
    }

    const canonicalFileUrl = canonicalProduct.digitalFileUrl || canonicalProduct.fileUrl;
    if (!canonicalFileUrl) {
      return res.status(400).json({
        success: false,
        error: "Digital asset not configured for this product.",
      });
    }

    const canonicalFileName = canonicalProduct.digitalFileName || canonicalProduct.fileName || canonicalProduct.name || "download";
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins
    const token = generateDownloadToken({
      itemId: itemId || "item",
      orderId: razorpay_order_id,
      fileUrl: canonicalFileUrl,
      fileName: canonicalFileName,
      expiresAt,
    });

    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers.host || `localhost:${PORT}`;
    const downloadUrl = `${protocol}://${host}/api/digital/download?token=${encodeURIComponent(token)}`;

    res.json({
      success: true,
      downloadUrl,
      token,
      expiresAt,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3c. Create Physical Order (Razorpay) - AUTHORITATIVE
app.post("/api/orders/create-rzp", async (req, res) => {
  try {
    const { businessId, orderId, currency = "INR" } = req.body;
    
    if (!orderId) return res.status(400).json({ error: "Missing orderId" });

    // Resolve authoritative amount from canonical order in database
    const canonicalOrder = await resolveCanonicalOrder(businessId, orderId);
    if (!canonicalOrder) {
      return res.status(404).json({ error: "Order record not found in system." });
    }

    const orderAmount = Number(canonicalOrder.total);
    if (!orderAmount || orderAmount <= 0) {
      return res.status(400).json({ error: "Invalid order amount in official record." });
    }

    if (!razorpay) {
      return res.status(500).json({ error: "Razorpay not configured on server." });
    }

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(orderAmount * 100),
      currency: currency || "INR",
      receipt: orderId,
      notes: {
        businessId: businessId || "",
        customerName: canonicalOrder.customerName || "",
        type: "physical_order",
        localOrderId: orderId
      }
    });

    res.json({
      success: true,
      rzpOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency
    });
  } catch (err: any) {
    console.error("[Razorpay] Physical order creation failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3d. Verify Physical Payment
app.post("/api/orders/verify-payment", paymentLimiter, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, businessId, localOrderId } = req.body;
    
    if (!RAZORPAY_KEY_SECRET) return res.status(500).json({ error: "Secret missing" });
    if (!razorpay_signature || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: "Missing required payment verification parameters." });
    }

    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!timingSafeCompare(generatedSignature, razorpay_signature)) {
      return res.status(400).json({ error: "Signature mismatch" });
    }

    // Update order in Firestore
    const orderIdToUpdate = localOrderId || razorpay_order_id;
    const success = await updateOrderPayment(businessId, orderIdToUpdate, razorpay_payment_id, razorpay_signature);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Failed to update order status in database" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3b-2. Verify Platform Subscription Upgrade Payment (FAIL-CLOSED & Authoritative Mutation)
app.post("/api/subscription/verify-payment", paymentLimiter, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      businessId,
      planId,
      amount,
      currency = "INR",
      businessName,
    } = req.body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    // STRICT FAIL-CLOSED: if secret is missing, never treat subscription as verified
    if (!keySecret) {
      console.error("[PAYMENT ERROR] RAZORPAY_KEY_SECRET is not configured on server.");
      return res.status(500).json({
        success: false,
        error: "Subscription verification service unavailable: server secret not configured.",
      });
    }

    if (!razorpay_signature || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required subscription payment verification parameters.",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!timingSafeCompare(generatedSignature, razorpay_signature)) {
      console.error("[PAYMENT ERROR] Invalid subscription payment signature mismatch.");
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature verification failed.",
      });
    }

    // Authoritative Server-Side Record Creation in payment_transactions
    const txId = "tx_" + Date.now() + "_" + crypto.randomBytes(3).toString("hex");
    const transaction = {
      id: txId,
      businessId: businessId || "unknown_merchant",
      businessName: businessName || "Storelly Merchant",
      planId: planId || "plan_pro",
      amount: Number(amount) || 199,
      currency: currency || "INR",
      status: "success",
      gateway: "razorpay",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      createdAt: Date.now(),
      receiptUrl: `https://storelly.com/receipts/${txId}`,
    };

    try {
      await setDoc(doc(serverDb, "payment_transactions", txId), transaction);
      console.log(`[PAYMENT] Authoritative payment transaction recorded: ${txId}`);
    } catch (txErr) {
      console.error("[PAYMENT] Failed to record payment transaction:", txErr);
    }

    // Authoritative Business Profile Subscription Update in Firestore
    if (businessId && businessId !== "guest_vendor") {
      try {
        const planSlug = (planId || "pro").replace("plan_", "").toLowerCase();
        await updateDoc(doc(serverDb, "businesses", businessId), {
          subscriptionPlan: planSlug,
          subscriptionStatus: "active",
          subscriptionExpiry: Date.now() + 30 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now(),
        });
        console.log(`[SUBSCRIPTION] Business ${businessId} upgraded to ${planSlug} (active)`);
      } catch (bizErr) {
        console.error(`[SUBSCRIPTION] Failed to update business ${businessId}:`, bizErr);
      }
    }

    res.json({
      success: true,
      verified: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      transaction,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3c. Resend / Refresh Digital Download Link (Canonical Entitlement Verification)
app.post("/api/digital/resend-link", async (req, res) => {
  try {
    const { orderId, businessId, itemId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, error: "Order ID is required." });
    }

    // Verify canonical order from database
    const canonicalOrder = await resolveCanonicalOrder(businessId, orderId);
    if (!canonicalOrder) {
      return res.status(404).json({ success: false, error: "Order record not found." });
    }

    const isPaid =
      canonicalOrder.paymentStatus === "paid" ||
      canonicalOrder.status === "delivered" ||
      Number(canonicalOrder.total) === 0;

    if (!isPaid) {
      return res.status(403).json({
        success: false,
        error: "Order has not been verified as paid.",
      });
    }

    const resolvedItemId = itemId || canonicalOrder.items?.[0]?.itemId;
    const canonicalProduct = await resolveCanonicalProduct(businessId, resolvedItemId);
    if (!canonicalProduct) {
      return res.status(404).json({ success: false, error: "Product catalog item not found." });
    }

    const canonicalFileUrl = canonicalProduct.digitalFileUrl || canonicalProduct.fileUrl;
    if (!canonicalFileUrl) {
      return res.status(400).json({ success: false, error: "Digital file asset is not configured." });
    }

    const canonicalFileName = canonicalProduct.digitalFileName || canonicalProduct.fileName || canonicalProduct.name || "download";
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const token = generateDownloadToken({
      itemId: resolvedItemId,
      orderId,
      fileUrl: canonicalFileUrl,
      fileName: canonicalFileName,
      expiresAt,
    });

    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers.host || `localhost:${PORT}`;
    const downloadUrl = `${protocol}://${host}/api/digital/download?token=${encodeURIComponent(token)}`;

    res.json({
      success: true,
      downloadUrl,
      expiresAt,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Secure File Serving Endpoint (Restricted to Authorized Cloudinary / Storage Origins)
app.get("/api/digital/download", async (req, res) => {
  try {
    const token = req.query.token as string;
    if (!token) return res.status(400).send("Missing download token");

    const result = verifyDownloadToken(token);
    
    if (!result.valid) return res.status(403).send("Invalid or corrupted download token.");
    if (result.expired) return res.status(410).send("Download link has expired. Links are valid for 10 minutes.");
    
    const { fileUrl, fileName } = result.payload!;
    if (!fileUrl) return res.status(400).send("Missing file target URL.");

    // Validate origin against allowed storage providers to eliminate arbitrary SSRF proxying
    try {
      const parsedUrl = new URL(fileUrl);
      const isCloudinary = parsedUrl.hostname.endsWith(".cloudinary.com") || parsedUrl.hostname === "res.cloudinary.com";
      const isFirebase = parsedUrl.hostname.includes("firebasestorage.googleapis.com") || parsedUrl.hostname.includes("storage.googleapis.com");
      if (!isCloudinary && !isFirebase) {
        return res.status(403).send("Forbidden: Remote file origin is not authorized for delivery.");
      }
    } catch {
      return res.status(400).send("Malformed target URL in secure token.");
    }
    
    // We fetch the file directly from storage using arraybuffer to hide the original URL
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error("Failed to retrieve file from storage bucket");
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Set headers to force download instead of opening in browser
    const safeFilename = fileName ? encodeURIComponent(fileName) : "digital-product-download";
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
    res.setHeader("Content-Type", contentType);
    res.send(buffer);
    
  } catch (err: any) {
    console.error("Download delivery error:", err);
    res.status(500).send("An error occurred while securely delivering the file.");
  }
});

// 4b. Cloudinary File / Image Cleanup Endpoint (Protected)
app.post("/api/digital/delete-file", uploadSignLimiter, verifyAuth, async (req: any, res: express.Response) => {
  try {
    const { publicId, resourceType = "image" } = req.body;
    if (!publicId || typeof publicId !== "string") {
      return res.status(400).json({ success: false, error: "Missing publicId parameter" });
    }

    // Strict sanitization: alphanumeric, slashes, dashes, underscores only; no path traversal
    if (!/^[a-zA-Z0-9_\-\/]+$/.test(publicId) || publicId.includes("..")) {
      return res.status(400).json({ success: false, error: "Invalid publicId format." });
    }

    if (!CLOUDINARY_API_SECRET) {
      console.log(`[Cloudinary Cleanup] API secret not set on server, dry-run delete for: ${publicId}`);
      return res.json({ success: true, message: "Dry run delete completed" });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

    const rType = resourceType === "auto" ? "image" : resourceType;
    const destroyUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${rType}/destroy`;

    const formData = new URLSearchParams();
    formData.append("public_id", publicId);
    formData.append("api_key", CLOUDINARY_API_KEY);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);

    const destroyRes = await fetch(destroyUrl, {
      method: "POST",
      body: formData,
    });

    const destroyData = await destroyRes.json();
    console.log(`[Cloudinary Cleanup] Resource destroyed (${publicId}):`, destroyData);

    return res.json({ success: true, result: destroyData });
  } catch (err: any) {
    console.warn("[Cloudinary Cleanup] Error deleting file:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Event Ticket WhatsApp Delivery Builder
app.post("/api/events/whatsapp-ticket", (req, res) => {
  try {
    const {
      ticketId,
      eventTitle,
      eventDate,
      eventTime,
      customerName,
      customerPhone,
      price,
      format,
      venueAddress,
      venueCity,
      meetingUrl,
      merchantName = "Creator",
    } = req.body;

    const cleanPhone = (customerPhone || "").replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone
      ? cleanPhone.startsWith("91") || cleanPhone.length > 10
        ? cleanPhone
        : "91" + cleanPhone
      : "";

    let accessInfo = "";
    if (format === "online") {
      accessInfo = meetingUrl
        ? `🔗 *Meeting Link:* ${meetingUrl}\n`
        : `🔗 *Meeting Link:* Will be sent closer to the event.\n`;
    } else {
      accessInfo = `📍 *Venue:* ${venueAddress || "Location provided upon registration"}${venueCity ? `, ${venueCity}` : ""}\n`;
    }

    const waText = encodeURIComponent(
      `🎟️ *Your Event Ticket Confirmation*\n\n` +
        `Hello ${customerName || "Attendee"},\n` +
        `Your seat for *${eventTitle}* has been successfully reserved with ${merchantName}!\n\n` +
        `🎫 *Ticket ID:* \`${ticketId}\`\n` +
        `📅 *Date:* ${eventDate}\n` +
        `⏰ *Time:* ${eventTime}\n` +
        `🏷️ *Format:* ${format === "online" ? "🌐 Online Webinar / Masterclass" : "📍 In-Person Offline"}\n` +
        accessInfo +
        `💵 *Amount:* ${price && price > 0 ? `₹${price} (Paid)` : "Free Entry"}\n\n` +
        `⚡ Please keep this ticket handy upon joining/arrival.\n` +
        `We look forward to seeing you!`,
    );

    const whatsAppUrl = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${waText}`
      : undefined;

    res.json({
      success: true,
      ticketId,
      whatsAppUrl,
      formattedPhone,
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message || "Failed to generate WhatsApp ticket link",
    });
  }
});

// 9. Event Cancellation Notification Builder (Protected: Owner/Admin Only)
app.post("/api/events/cancellation-notice", verifyAuth, async (req: any, res) => {
  try {
    const {
      businessId,
      eventTitle,
      customerName,
      customerPhone,
      reason,
      merchantName = "Creator",
    } = req.body;

    // Verify ownership of target business if businessId provided
    if (businessId) {
      const bizSnap = await getDoc(doc(serverDb, "businesses", businessId));
      if (bizSnap.exists()) {
        const ownerId = bizSnap.data().ownerId;
        const userUid = req.user?.uid;
        if (ownerId !== userUid && !req.user?.admin && !req.user?.masterAdmin) {
          return res.status(403).json({ error: "Forbidden: You do not own this business." });
        }
      }
    }

    const cleanPhone = (customerPhone || "").replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone
      ? cleanPhone.startsWith("91") || cleanPhone.length > 10
        ? cleanPhone
        : "91" + cleanPhone
      : "";

    const waText = encodeURIComponent(
      `⚠️ *Event Cancellation Notice*\n\n` +
        `Hello ${customerName || "Attendee"},\n` +
        `We regret to inform you that the event *${eventTitle}* hosted by ${merchantName} has been cancelled.\n\n` +
        `📝 *Reason:* ${reason || "Unforeseen circumstances"}\n` +
        `💰 *Refund Policy:* If you purchased a paid ticket, a full refund has been initiated to your original payment method.\n\n` +
        `We sincerely apologize for any inconvenience caused.`,
    );

    const whatsAppUrl = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${waText}`
      : undefined;

    res.json({
      success: true,
      whatsAppUrl,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to build cancellation notice" });
  }
});

// 10. Custom Quote Offer WhatsApp Message Builder
app.post("/api/quotes/whatsapp-quote", (req, res) => {
  try {
    const {
      requestNumber,
      customerName,
      customerPhone,
      quotedPrice,
      estimatedDeliveryDays,
      quoteNotes,
      paymentUrl,
      merchantName = "Creator",
    } = req.body;

    const cleanPhone = (customerPhone || "").replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone
      ? cleanPhone.startsWith("91") || cleanPhone.length > 10
        ? cleanPhone
        : "91" + cleanPhone
      : "";

    const waText = encodeURIComponent(
      `🎨 *Price Quote for Custom Request (${requestNumber})*\n\n` +
        `Hello ${customerName},\n` +
        `Thank you for your custom order enquiry with ${merchantName}! Here is our tailored proposal:\n\n` +
        `💰 *Quoted Price:* ₹${quotedPrice}\n` +
        `⏱️ *Estimated Turnaround:* ${estimatedDeliveryDays || 3} business days\n` +
        (quoteNotes ? `📝 *Notes:* ${quoteNotes}\n\n` : `\n`) +
        `💳 *Direct Payment Link:* \n${paymentUrl}\n\n` +
        `Click the link above to securely complete your payment and confirm your custom order.\n` +
        `Feel free to reply if you have any questions!`,
    );

    const whatsAppUrl = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${waText}`
      : undefined;

    res.json({
      success: true,
      whatsAppUrl,
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message || "Failed to prepare custom quote WhatsApp link",
    });
  }
});

// 11. Custom Quote Razorpay Order Creation
app.post("/api/quotes/create-rzp", async (req, res) => {
  try {
    const { businessId, requestId } = req.body;
    if (!businessId || !requestId) return res.status(400).json({ error: "Missing businessId or requestId" });

    const quoteRef = doc(serverDb, "businesses", businessId, "quote_requests", requestId);
    const snap = await getDoc(quoteRef);
    if (!snap.exists()) return res.status(404).json({ error: "Quote request not found" });

    const quoteData = snap.data();
    const amount = Number(quoteData.quotedPrice);
    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid quote amount" });

    if (!razorpay) return res.status(500).json({ error: "Razorpay not configured" });

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `quote_${requestId}`,
      notes: {
        businessId,
        requestId,
        type: "quote_payment"
      }
    });

    res.json({
      success: true,
      rzpOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Custom Quote Payment Verification
app.post("/api/quotes/verify-payment", paymentLimiter, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, businessId, requestId } = req.body;
    if (!RAZORPAY_KEY_SECRET) return res.status(500).json({ error: "Secret missing" });
    if (!razorpay_signature || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: "Missing required quote payment parameters" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!timingSafeCompare(generatedSignature, razorpay_signature)) {
      return res.status(400).json({ error: "Signature mismatch" });
    }

    const success = await updateQuotePayment(businessId, requestId, razorpay_payment_id, razorpay_signature);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Failed to update quote status" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Event Razorpay Order Creation
app.post("/api/events/create-rzp", async (req, res) => {
  try {
    const { businessId, eventId, customerName, customerPhone } = req.body;
    if (!businessId || !eventId) return res.status(400).json({ error: "Missing businessId or eventId" });

    const eventRef = doc(serverDb, "businesses", businessId, "events", eventId);
    const snap = await getDoc(eventRef);
    if (!snap.exists()) return res.status(404).json({ error: "Event not found" });

    const eventData = snap.data();
    const amount = Number(eventData.price);
    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid event price" });

    if (!razorpay) return res.status(500).json({ error: "Razorpay not configured" });

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `evt_${eventId}_${Date.now()}`,
      notes: {
        businessId,
        eventId,
        customerName: customerName || "",
        customerPhone: customerPhone || "",
        type: "event_ticket"
      }
    });

    res.json({
      success: true,
      rzpOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Event Payment Verification
app.post("/api/events/verify-payment", paymentLimiter, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!RAZORPAY_KEY_SECRET) return res.status(500).json({ error: "Secret missing" });
    if (!razorpay_signature || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: "Missing event payment verification parameters" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!timingSafeCompare(generatedSignature, razorpay_signature)) {
      return res.status(400).json({ error: "Signature mismatch" });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Secure Customer Order Tracking Endpoint
app.get("/api/orders/track", async (req, res) => {
  try {
    const { businessId, orderId, phone } = req.query;
    if (!businessId || !orderId || typeof businessId !== "string" || typeof orderId !== "string") {
      return res.status(400).json({ error: "Missing required businessId or orderId query parameters." });
    }

    const orderSnap = await getDoc(doc(serverDb, "businesses", businessId, "orders", orderId));
    if (!orderSnap.exists()) {
      return res.status(404).json({ error: "Order not found." });
    }

    const data = orderSnap.data();

    // Verify phone match if provided
    if (phone && typeof phone === "string") {
      const cleanInput = phone.replace(/[^0-9]/g, "");
      const cleanOrderPhone = (data.customerPhone || "").replace(/[^0-9]/g, "");
      if (cleanInput.length >= 4 && !cleanOrderPhone.endsWith(cleanInput.slice(-4))) {
        return res.status(403).json({ error: "Order verification failed: phone number mismatch." });
      }
    }

    // Return sanitized customer-facing order record
    return res.json({
      success: true,
      order: {
        id: data.id,
        orderNumber: data.orderNumber,
        status: data.status,
        paymentStatus: data.paymentStatus,
        total: data.total,
        subtotal: data.subtotal,
        orderType: data.orderType,
        items: data.items,
        createdAt: data.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retrieve order." });
  }
});

// 15. Gemini API Chat Endpoint (Using modern @google/genai SDK with Rate Limiting & Input Sanitization)
app.post("/api/ai/chat", aiLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid prompt parameter." });
    }

    // Maximum length validation to prevent prompt injection DoS or token exhaustion
    if (prompt.trim().length > 4000) {
      return res.status(400).json({ error: "Prompt exceeds maximum allowed length of 4000 characters." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt.trim(),
    });
    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini AI API error:", err);
    res.status(500).json({ error: "Failed to generate AI response. Please try again." });
  }
});

const startServer = async () => {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
};

startServer();

export default app;
