import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Razorpay from "razorpay";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dxbkgx6tl";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "618932888682632";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const TOKEN_SIGNING_SECRET =
  process.env.JWT_SECRET ||
  CLOUDINARY_API_SECRET ||
  "storelly_digital_secret_key_2026";

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

    if (signature !== expectedSignature) {
      return { valid: false, expired: false };
    }

    const payload = JSON.parse(
      Buffer.from(base64Data, "base64url").toString("utf-8"),
    );
    const isExpired = Date.now() > payload.expiresAt;
    return { valid: true, expired: isExpired, payload };
  } catch {
    return { valid: false, expired: false };
  }
}

// Middleware to verify Razorpay signatures for paid transactions
const verifyRazorpaySignature = (req, res, next) => {
  const { amount, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  if (!amount || amount <= 0) {
    return next(); // Free transaction, no signature required
  }

  const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
  if (!rzpSecret) {
    console.error(
      `[PAYMENT ERROR] Missing RAZORPAY_KEY_SECRET on server for order ${razorpay_order_id || "unknown"}`,
    );
    return res
      .status(500)
      .json({
        error:
          "Payment verification failed: RAZORPAY_KEY_SECRET is not configured on the server.",
      });
  }

  if (!razorpay_signature || !razorpay_order_id || !razorpay_payment_id) {
    console.error(
      `[PAYMENT ERROR] Missing signature details for order ${razorpay_order_id || "unknown"}`,
    );
    return res
      .status(400)
      .json({ error: "Missing Razorpay payment signature details." });
  }

  const expectedSignature = crypto
    .createHmac("sha256", rzpSecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    console.error(
      `[PAYMENT ERROR] Invalid signature mismatch for order ${razorpay_order_id}. Expected: ${expectedSignature}, Received: ${razorpay_signature}`,
    );
    return res
      .status(400)
      .json({ error: "Invalid payment signature verification" });
  }

  console.log(
    `[PAYMENT SUCCESS] Verified order ${razorpay_order_id} for amount ${amount}`,
  );
  next();
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 1. Digital Upload Signing for Cloudinary
  app.post("/api/digital/sign-upload", (req, res) => {
    try {
      if (!CLOUDINARY_API_SECRET)
        return res
          .status(500)
          .json({ error: "CLOUDINARY_API_SECRET not configured on server" });
      const { paramsToSign, resourceType = "auto" } = req.body;
      const timestamp = Math.floor(Date.now() / 1000);

      const mergedParams: Record<string, any> = {
        timestamp,
        ...(paramsToSign || {}),
      };

      // Sort keys alphabetically
      const sortedKeys = Object.keys(mergedParams).sort();
      const stringToSign = sortedKeys
        .map((key) => `${key}=${mergedParams[key]}`)
        .join("&");

      const signature = crypto
        .createHash("sha1")
        .update(stringToSign + CLOUDINARY_API_SECRET)
        .digest("hex");

      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

      res.json({
        success: true,
        signature,
        timestamp,
        apiKey: CLOUDINARY_API_KEY,
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadUrl,
        params: mergedParams,
      });
    } catch (err: any) {
      res
        .status(500)
        .json({ error: err.message || "Failed to generate upload signature" });
    }
  });

  // 2. Cloudinary File Deletion API
  app.post("/api/digital/delete-file", async (req, res) => {
    try {
      if (!CLOUDINARY_API_SECRET)
        return res
          .status(500)
          .json({ error: "CLOUDINARY_API_SECRET not configured on server" });
      const { publicId, resourceType = "auto" } = req.body;
      if (!publicId) {
        return res.status(400).json({ error: "Missing publicId" });
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
      const signature = crypto
        .createHash("sha1")
        .update(stringToSign)
        .digest("hex");

      const formData = new URLSearchParams();
      formData.append("public_id", publicId);
      formData.append("api_key", CLOUDINARY_API_KEY);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);

      const targetType =
        resourceType === "video" || resourceType === "raw"
          ? resourceType
          : "image";
      const destroyUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${targetType}/destroy`;

      const response = await fetch(destroyUrl, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      res.json({ success: true, result });
    } catch (err: any) {
      res
        .status(500)
        .json({
          error: err.message || "Failed to delete file from Cloudinary",
        });
    }
  });

  // 3. Digital Product Flow - FREE CLAIM
  app.post("/api/digital/free", async (req, res) => {
    try {
      const {
        itemId,
        orderId,
        fileUrl,
        fileName,
        customerName,
        customerPhone,
        merchantName = "Storelly",
      } = req.body;
      if (!fileUrl && !itemId) {
        return res.status(400).json({ error: "Missing item details or file" });
      }

      // Generate 10-minute expiry timestamp
      const expiresAt = Date.now() + 10 * 60 * 1000;
      const actualOrderId = orderId || `ord_free_${Date.now()}`;
      const token = generateDownloadToken({
        itemId: itemId || "item_free",
        orderId: actualOrderId,
        fileUrl: fileUrl || "",
        fileName: fileName || "digital_product",
        expiresAt,
      });

      const protocol =
        req.headers["x-forwarded-proto"] || req.protocol || "http";
      const host = req.get("host");
      const secureDownloadUrl = `${protocol}://${host}/api/digital/download?token=${token}`;

      // WhatsApp Delivery payload
      const cleanPhone = (customerPhone || "").replace(/[^0-9]/g, "");
      const waText = encodeURIComponent(
        `🎉 *Your Digital Product is Ready!*\n\n` +
          `Hello ${customerName || "Customer"},\n` +
          `Thank you for claiming *${fileName || "Digital Product"}* from ${merchantName}!\n\n` +
          `📦 *Order ID:* ${actualOrderId}\n` +
          `📥 *Instant Download Link:*\n${secureDownloadUrl}\n\n` +
          `⏳ *Note:* For your security, this temporary download link is valid for 10 minutes.\n\n` +
          `Enjoy your purchase! ✨`,
      );

      const whatsAppUrl = cleanPhone
        ? `https://wa.me/${cleanPhone.startsWith("91") || cleanPhone.length > 10 ? cleanPhone : "91" + cleanPhone}?text=${waText}`
        : undefined;

      res.json({
        success: true,
        orderId: actualOrderId,
        downloadUrl: secureDownloadUrl,
        expiresAt,
        whatsAppUrl,
        rawUrl: fileUrl,
      });
    } catch (err: any) {
      res
        .status(500)
        .json({ error: err.message || "Error processing free download" });
    }
  });

  // 4. Digital Product Flow - CREATE RAZORPAY ORDER
  app.post("/api/digital/create-order", async (req, res) => {
    try {
      const {
        itemId,
        amount,
        customerName,
        customerPhone,
        currency = "INR",
      } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid product amount" });
      }

      const key_id = process.env.RAZORPAY_KEY_ID;
      const key_secret = process.env.RAZORPAY_KEY_SECRET;

      if (!key_id || !key_secret) {
        return res
          .status(500)
          .json({
            error:
              "Razorpay credentials not configured on the server. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables.",
          });
      }

      const rzp = new Razorpay({
        key_id: key_id,
        key_secret: key_secret,
      });

      const amountInSubunits = Math.round(Number(amount) * 100);

      const options = {
        amount: amountInSubunits,
        currency: currency,
        receipt: `receipt_digi_${Date.now()}`,
        notes: {
          itemId,
          customerName: customerName || "",
          customerPhone: customerPhone || "",
        },
      };

      const order = await rzp.orders.create(options);

      res.json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: key_id,
      });
    } catch (err: any) {
      console.error("Razorpay Order Creation Error:", err);
      res
        .status(500)
        .json({ error: err.message || "Failed to create digital order" });
    }
  });

  // 5. Digital Product Flow - VERIFY PAYMENT & DELIVER VIA WHATSAPP WITH 10-MIN SIGNED LINK

  app.post("/api/subscription/verify-payment", async (req, res) => {
    try {
      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        amount,
      } = req.body;

      const rzpSecret = process.env.RAZORPAY_KEY_SECRET;

      if (!rzpSecret) {
        console.error("[PAYMENT ERROR] Missing RAZORPAY_KEY_SECRET on server");
        return res
          .status(500)
          .json({ error: "Server missing Razorpay secret" });
      }

      if (!razorpay_signature || (!razorpay_order_id && !razorpay_payment_id)) {
        return res.status(400).json({ error: "Missing signature details" });
      }

      const expectedSignature = crypto
        .createHmac("sha256", rzpSecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        console.error(
          `[PAYMENT ERROR] Invalid subscription signature. Expected ${expectedSignature}, got ${razorpay_signature}`,
        );
        return res.status(400).json({ error: "Invalid payment signature" });
      }

      res.json({ success: true, verified: true });
    } catch (err: any) {
      console.error("Subscription verify error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post(
    "/api/digital/verify-payment",
    verifyRazorpaySignature,
    async (req, res) => {
      try {
        const {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          itemId,
          fileUrl,
          fileName,
          customerName,
          customerPhone,
          productTitle,
          amount,
          merchantName = "Storelly Store",
        } = req.body;

        // Razorpay signature verification is now handled securely via verifyRazorpaySignature middleware.

        // Generate 10-minute expiry download token
        const expiresAt = Date.now() + 10 * 60 * 1000;
        const orderId = razorpay_order_id || `ord_digi_${Date.now()}`;
        const token = generateDownloadToken({
          itemId: itemId || "item_digital",
          orderId,
          fileUrl: fileUrl || "",
          fileName: fileName || productTitle || "digital_product",
          expiresAt,
        });

        const protocol =
          req.headers["x-forwarded-proto"] || req.protocol || "http";
        const host = req.get("host");
        const secureDownloadUrl = `${protocol}://${host}/api/digital/download?token=${token}`;

        // Construct WhatsApp Delivery Message and URL
        const displayTitle = productTitle || fileName || "Digital Product";
        const cleanPhone = (customerPhone || "").replace(/[^0-9]/g, "");
        const formattedPhone = cleanPhone
          ? cleanPhone.startsWith("91") || cleanPhone.length > 10
            ? cleanPhone
            : "91" + cleanPhone
          : "";

        const waText = encodeURIComponent(
          `✅ *Payment Confirmed! Your Digital Download is Ready*\n\n` +
            `Hello ${customerName || "Customer"},\n` +
            `Your payment for *${displayTitle}* was successfully verified!\n\n` +
            `🧾 *Order ID:* ${orderId}\n` +
            (razorpay_payment_id
              ? `💳 *Payment Ref:* ${razorpay_payment_id}\n`
              : "") +
            (amount ? `💰 *Amount Paid:* ₹${amount}\n` : "") +
            `\n📥 *Instant Signed Download Link:*\n${secureDownloadUrl}\n\n` +
            `⏳ *Security Notice:* This temporary link expires in 10 minutes. You can request a new link anytime directly with your phone number.\n\n` +
            `Thank you for purchasing with ${merchantName}! 🚀`,
        );

        const whatsAppUrl = formattedPhone
          ? `https://wa.me/${formattedPhone}?text=${waText}`
          : undefined;

        res.json({
          success: true,
          orderId,
          paymentId: razorpay_payment_id,
          downloadUrl: secureDownloadUrl,
          expiresAt,
          whatsAppUrl,
          deliveryStatus: "ready",
          rawUrl: fileUrl,
        });
      } catch (err: any) {
        res
          .status(500)
          .json({ error: err.message || "Payment verification failed" });
      }
    },
  );

  // 6. Direct WhatsApp Delivery Trigger Cloud Function
  app.post("/api/digital/whatsapp-deliver", async (req, res) => {
    try {
      const {
        customerPhone,
        customerName = "Customer",
        productTitle = "Digital Asset",
        orderId,
        fileUrl,
        fileName,
        merchantName = "Storelly Merchant",
      } = req.body;

      if (!customerPhone && !fileUrl) {
        return res
          .status(400)
          .json({ error: "Missing customer phone or file info" });
      }

      const expiresAt = Date.now() + 10 * 60 * 1000;
      const actualOrderId = orderId || `ord_wa_${Date.now()}`;
      const token = generateDownloadToken({
        itemId: "item_digital",
        orderId: actualOrderId,
        fileUrl: fileUrl || "",
        fileName: fileName || productTitle,
        expiresAt,
      });

      const protocol =
        req.headers["x-forwarded-proto"] || req.protocol || "http";
      const host = req.get("host");
      const secureDownloadUrl = `${protocol}://${host}/api/digital/download?token=${token}`;

      const cleanPhone = (customerPhone || "").replace(/[^0-9]/g, "");
      const formattedPhone = cleanPhone
        ? cleanPhone.startsWith("91") || cleanPhone.length > 10
          ? cleanPhone
          : "91" + cleanPhone
        : "";

      const waText = encodeURIComponent(
        `📦 *Your Digital Order Delivery*\n\n` +
          `Hello ${customerName},\n` +
          `Here is your verified download link for *${productTitle}* from ${merchantName}:\n\n` +
          `🆔 *Order:* ${actualOrderId}\n` +
          `📥 *Download File:*\n${secureDownloadUrl}\n\n` +
          `⏳ *Expires:* In 10 minutes.\n\n` +
          `Need help? Reply directly to this message!`,
      );

      const whatsAppUrl = formattedPhone
        ? `https://wa.me/${formattedPhone}?text=${waText}`
        : undefined;

      res.json({
        success: true,
        delivered: true,
        downloadUrl: secureDownloadUrl,
        expiresAt,
        whatsAppUrl,
        message:
          "Signed download link generated and prepared for WhatsApp direct delivery",
      });
    } catch (err: any) {
      res
        .status(500)
        .json({
          error: err.message || "Failed to deliver WhatsApp download link",
        });
    }
  });

  // 7. Resend fresh 10-minute download link
  app.post("/api/digital/resend-link", (req, res) => {
    try {
      const {
        orderId,
        itemId,
        fileUrl,
        fileName,
        phone,
        customerName = "Customer",
        productTitle,
        merchantName = "Storelly",
      } = req.body;
      if (!fileUrl && !itemId) {
        return res
          .status(400)
          .json({ error: "Missing order or file information" });
      }

      const expiresAt = Date.now() + 10 * 60 * 1000;
      const actualOrderId = orderId || `ord_resend_${Date.now()}`;
      const token = generateDownloadToken({
        itemId: itemId || "item_digital",
        orderId: actualOrderId,
        fileUrl: fileUrl || "",
        fileName: fileName || productTitle || "digital_product",
        expiresAt,
      });

      const protocol =
        req.headers["x-forwarded-proto"] || req.protocol || "http";
      const host = req.get("host");
      const secureDownloadUrl = `${protocol}://${host}/api/digital/download?token=${token}`;

      const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
      const formattedPhone = cleanPhone
        ? cleanPhone.startsWith("91") || cleanPhone.length > 10
          ? cleanPhone
          : "91" + cleanPhone
        : "";

      const waText = encodeURIComponent(
        `🔄 *Fresh Download Link Generated*\n\n` +
          `Hello ${customerName},\n` +
          `Here is your new 10-minute download link for *${productTitle || fileName || "Digital Asset"}*:\n\n` +
          `🆔 *Order:* ${actualOrderId}\n` +
          `📥 *Download URL:*\n${secureDownloadUrl}\n\n` +
          `⏳ *Security Notice:* Valid for 10 minutes.\n\n` +
          `Thank you for choosing ${merchantName}!`,
      );

      const whatsAppUrl = formattedPhone
        ? `https://wa.me/${formattedPhone}?text=${waText}`
        : undefined;

      res.json({
        success: true,
        downloadUrl: secureDownloadUrl,
        expiresAt,
        whatsAppUrl,
      });
    } catch (err: any) {
      res
        .status(500)
        .json({ error: err.message || "Failed to regenerate download link" });
    }
  });

  // 7. Secure Download Endpoint with 10-minute token verification
  app.get("/api/digital/download", async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.status(400).send(`
          <html>
            <body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0F172A; color: white;">
              <div style="text-align: center; max-width: 480px; padding: 32px; background: #1E293B; border-radius: 24px;">
                <h2 style="color: #F43F5E; margin-top: 0;">Missing Download Token</h2>
                <p style="color: #94A3B8; font-size: 14px;">Invalid or missing access token. Please use the download link provided after your purchase.</p>
              </div>
            </body>
          </html>
        `);
      }

      const check = verifyDownloadToken(token);
      if (!check.valid) {
        return res.status(403).send(`
          <html>
            <body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0F172A; color: white;">
              <div style="text-align: center; max-width: 480px; padding: 32px; background: #1E293B; border-radius: 24px;">
                <h2 style="color: #F43F5E; margin-top: 0;">Invalid Access Token</h2>
                <p style="color: #94A3B8; font-size: 14px;">This download token is invalid or has been tampered with.</p>
              </div>
            </body>
          </html>
        `);
      }

      if (check.expired) {
        return res.status(410).send(`
          <html>
            <body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0F172A; color: white;">
              <div style="text-align: center; max-width: 480px; padding: 32px; background: #1E293B; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                <div style="font-size: 40px; margin-bottom: 12px;">⏳</div>
                <h2 style="color: #F59E0B; margin-top: 0;">Download Link Expired</h2>
                <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">For your digital asset security, download links expire 10 minutes after generation. You can request a fresh link directly from the store using your WhatsApp number.</p>
              </div>
            </body>
          </html>
        `);
      }

      const fileUrl = check.payload?.fileUrl;
      if (!fileUrl) {
        return res.status(404).send("File not found");
      }

      // If it's a data URL (offline fallback), send buffer directly
      if (fileUrl.startsWith("data:")) {
        const matches = fileUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const buffer = Buffer.from(matches[2], "base64");
          res.setHeader("Content-Type", contentType);
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${check.payload?.fileName || "digital-asset"}"`,
          );
          return res.send(buffer);
        }
      }

      // Redirect to the file URL. If it's Cloudinary, append fl_attachment to force download.
      let finalUrl = fileUrl;
      if (fileUrl.startsWith("http")) {
        if (
          fileUrl.includes("res.cloudinary.com") &&
          fileUrl.includes("/upload/")
        ) {
          // Check if it already has fl_attachment
          if (!fileUrl.includes("fl_attachment")) {
            finalUrl = fileUrl.replace("/upload/", "/upload/fl_attachment/");
          }
        }
        return res.redirect(finalUrl);
      }
      return res.redirect(fileUrl);
    } catch (err: any) {
      res
        .status(500)
        .send("Error downloading file: " + (err.message || "Internal error"));
    }
  });

  // 8. Event Ticketing - WhatsApp Confirmation Link
  app.post("/api/events/whatsapp-ticket", (req, res) => {
    try {
      const {
        ticketId,
        eventTitle,
        format,
        eventDate,
        eventTime,
        meetingUrl,
        venueAddress,
        venueCity,
        customerName,
        customerPhone,
        price,
        merchantName = "Storelly Creator",
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
      res
        .status(500)
        .json({
          error: err.message || "Failed to generate WhatsApp ticket link",
        });
    }
  });

  // 9. Event Cancellation Notification Builder
  app.post("/api/events/cancellation-notice", (req, res) => {
    try {
      const {
        eventTitle,
        customerName,
        customerPhone,
        reason,
        merchantName = "Creator",
      } = req.body;

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
      res
        .status(500)
        .json({ error: err.message || "Failed to build cancellation notice" });
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
      res
        .status(500)
        .json({
          error: err.message || "Failed to prepare custom quote WhatsApp link",
        });
    }
  });

  // 11. Gemini Proxy
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { prompt } = req.body;
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      res.json({ text: result.response.text() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Razorpay Webhook for Subscription/Vendor Upgrades
  app.post(
    "/api/webhooks/razorpay",
    express.json({ type: "application/json" }),
    (req, res) => {
      try {
        const signature = req.headers["x-razorpay-signature"];
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
          console.error(
            "[PAYMENT ERROR] Missing RAZORPAY_WEBHOOK_SECRET on server",
          );
          return res
            .status(500)
            .json({
              error:
                "Webhook verification failed: RAZORPAY_WEBHOOK_SECRET is not configured on the server.",
            });
        }

        if (!signature) {
          console.error(
            "[PAYMENT ERROR] Missing Razorpay webhook signature header",
          );
          return res.status(400).send("Missing signature");
        }

        const crypto = require("crypto");
        const expectedSignature = crypto
          .createHmac("sha256", webhookSecret)
          .update(JSON.stringify(req.body))
          .digest("hex");

        if (expectedSignature !== signature) {
          console.error(
            `[PAYMENT ERROR] Invalid webhook signature mismatch. Expected: ${expectedSignature}, Received: ${signature}`,
          );
          return res.status(400).send("Invalid signature");
        }

        const event = req.body.event;
        console.log(`[Webhook] Received Razorpay event: ${event}`);

        // Handle specific events like subscription charged or payment captured for Pro upgrade
        if (event === "payment.captured" || event === "subscription.charged") {
          const payload =
            req.body.payload?.payment?.entity ||
            req.body.payload?.subscription?.entity;
            
          // In a real DB, we would look up the vendor by notes.vendorId and set plan to 'pro'
          console.log(
            `[Webhook] Processing upgrade for vendor:`,
            payload?.notes?.vendorId || "Unknown",
          );
          
          // Secure server-side entitlement processing for digital files
          if (payload?.notes?.orderId) {
             console.log(`[Webhook] Payment confirmed for digital order ${payload.notes.orderId}. Proceeding to grant file access entitlements.`);
             // Here we would use Firebase Admin to securely update the pending order's paymentStatus to 'paid' 
             // and attach the generated download token, completely bypassing client-side interference.
          }
        }

        res.json({ status: "ok" });
      } catch (err: any) {
        console.error("Webhook error:", err);
        res.status(500).send("Webhook handler failed");
      }
    },
  );

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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
