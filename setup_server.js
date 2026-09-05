import fs from 'fs';

const newServerCode = `
import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
  return \`\${base64Data}.\${signature}\`;
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
    if (signature !== expectedSignature)
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

// 1. Cloudinary Signature Route (Unchanged functionality)
app.post("/api/cloudinary/sign", (req, res) => {
  try {
    if (!CLOUDINARY_API_SECRET) {
      console.warn(
        "Missing CLOUDINARY_API_SECRET on server. Uploads may fail.",
      );
      return res.status(500).json({ error: "Server missing API secret" });
    }
    const { folder, public_id } = req.body;
    const timestamp = Math.round(new Date().getTime() / 1000);
    let paramsToSign = \`timestamp=\${timestamp}\`;
    if (folder) paramsToSign = \`folder=\${folder}&\${paramsToSign}\`;
    if (public_id)
      paramsToSign = \`public_id=\${public_id}&\${paramsToSign}\`;

    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign + CLOUDINARY_API_SECRET)
      .digest("hex");

    res.json({
      signature,
      timestamp,
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Free Digital Download Route (Direct Download via Signed URL)
app.post("/api/digital/free", (req, res) => {
  try {
    const { itemId, orderId, fileUrl, fileName, businessId, customerEmail } =
      req.body;
    if (!fileUrl) {
      return res
        .status(400)
        .json({ success: false, error: "Digital file URL is missing." });
    }

    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    const token = generateDownloadToken({
      itemId,
      orderId,
      fileUrl,
      fileName,
      expiresAt,
    });
    
    // Build the secure download URL
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers.host || \`localhost:\${PORT}\`;
    const downloadUrl = \`\${protocol}://\${host}/api/digital/download?token=\${token}\`;

    res.json({
      success: true,
      downloadUrl,
      expiresAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Paid Digital Order Route (Generates Payment Link & Signed Delivery payload)
app.post("/api/digital/create-order", async (req, res) => {
  try {
    const {
      itemId,
      orderId,
      price,
      currency,
      fileUrl,
      fileName,
      merchantId,
      merchantName,
      customerEmail,
    } = req.body;
    
    // In a real application, you would create a Razorpay Order ID here securely.
    // For this example, we mock a payment link generation.
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour for payment
    
    // Assuming payment is successful in the frontend, the client will call the free endpoint to get the token.
    // In production, a webhook listener should dispatch an email with the token securely.
    
    res.json({
      success: true,
      orderId,
      paymentIntentUrl: "https://pages.razorpay.com/pl_placeholder/view", // Replace with real Razorpay logic
      message: "Payment integration placeholder."
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Secure File Serving Endpoint
app.get("/api/digital/download", async (req, res) => {
  try {
    const token = req.query.token as string;
    if (!token) return res.status(400).send("Missing download token");

    const result = verifyDownloadToken(token);
    
    if (!result.valid) return res.status(403).send("Invalid or corrupted download token.");
    if (result.expired) return res.status(410).send("Download link has expired. Links are valid for 10 minutes.");
    
    const { fileUrl, fileName } = result.payload!;
    
    // We fetch the file directly from Cloudinary using arraybuffer to hide the original URL
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error("Failed to retrieve file from storage bucket");
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Set headers to force download instead of opening in browser
    const safeFilename = fileName ? encodeURIComponent(fileName) : "digital-product-download";
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    
    res.setHeader("Content-Disposition", \`attachment; filename="\${safeFilename}"\`);
    res.setHeader("Content-Type", contentType);
    res.send(buffer);
    
  } catch (err: any) {
    console.error("Download delivery error:", err);
    res.status(500).send("An error occurred while securely delivering the file.");
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
        ? \`🔗 *Meeting Link:* \${meetingUrl}\\n\`
        : \`🔗 *Meeting Link:* Will be sent closer to the event.\\n\`;
    } else {
      accessInfo = \`📍 *Venue:* \${venueAddress || "Location provided upon registration"}\${venueCity ? \`, \${venueCity}\` : ""}\\n\`;
    }

    const waText = encodeURIComponent(
      \`🎟️ *Your Event Ticket Confirmation*\\n\\n\` +
        \`Hello \${customerName || "Attendee"},\\n\` +
        \`Your seat for *\${eventTitle}* has been successfully reserved with \${merchantName}!\\n\\n\` +
        \`🎫 *Ticket ID:* \\\`\${ticketId}\\\`\\n\` +
        \`📅 *Date:* \${eventDate}\\n\` +
        \`⏰ *Time:* \${eventTime}\\n\` +
        \`🏷️ *Format:* \${format === "online" ? "🌐 Online Webinar / Masterclass" : "📍 In-Person Offline"}\\n\` +
        accessInfo +
        \`💵 *Amount:* \${price && price > 0 ? \`₹\${price} (Paid)\` : "Free Entry"}\\n\\n\` +
        \`⚡ Please keep this ticket handy upon joining/arrival.\\n\` +
        \`We look forward to seeing you!\`,
    );

    const whatsAppUrl = formattedPhone
      ? \`https://wa.me/\${formattedPhone}?text=\${waText}\`
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
      \`⚠️ *Event Cancellation Notice*\\n\\n\` +
        \`Hello \${customerName || "Attendee"},\\n\` +
        \`We regret to inform you that the event *\${eventTitle}* hosted by \${merchantName} has been cancelled.\\n\\n\` +
        \`📝 *Reason:* \${reason || "Unforeseen circumstances"}\\n\` +
        \`💰 *Refund Policy:* If you purchased a paid ticket, a full refund has been initiated to your original payment method.\\n\\n\` +
        \`We sincerely apologize for any inconvenience caused.\`,
    );

    const whatsAppUrl = formattedPhone
      ? \`https://wa.me/\${formattedPhone}?text=\${waText}\`
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
      \`🎨 *Price Quote for Custom Request (\${requestNumber})*\\n\\n\` +
        \`Hello \${customerName},\\n\` +
        \`Thank you for your custom order enquiry with \${merchantName}! Here is our tailored proposal:\\n\\n\` +
        \`💰 *Quoted Price:* ₹\${quotedPrice}\\n\` +
        \`⏱️ *Estimated Turnaround:* \${estimatedDeliveryDays || 3} business days\\n\` +
        (quoteNotes ? \`📝 *Notes:* \${quoteNotes}\\n\\n\` : \`\\n\`) +
        \`💳 *Direct Payment Link:* \\n\${paymentUrl}\\n\\n\` +
        \`Click the link above to securely complete your payment and confirm your custom order.\\n\` +
        \`Feel free to reply if you have any questions!\`,
    );

    const whatsAppUrl = formattedPhone
      ? \`https://wa.me/\${formattedPhone}?text=\${waText}\`
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

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (expectedSignature !== signature) {
        console.error(
          \`[PAYMENT ERROR] Invalid webhook signature mismatch. Expected: \${expectedSignature}, Received: \${signature}\`,
        );
        return res.status(400).send("Invalid signature");
      }

      const event = req.body.event;
      console.log(\`[Webhook] Received Razorpay event: \${event}\`);

      // Handle specific events like subscription charged or payment captured for Pro upgrade
      if (event === "payment.captured" || event === "subscription.charged") {
        const payload =
          req.body.payload?.payment?.entity ||
          req.body.payload?.subscription?.entity;
        
        // In a real DB, we would look up the vendor by notes.vendorId and set plan to 'pro'
        console.log(
          \`[Webhook] Processing upgrade for vendor:\`,
          payload?.notes?.vendorId || "Unknown",
        );
        
        // Secure server-side entitlement processing for digital files
        if (payload?.notes?.orderId) {
           console.log(\`[Webhook] Payment confirmed for digital order \${payload.notes.orderId}. Proceeding to grant file access entitlements.\`);
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://0.0.0.0:\${PORT}\`);
  });
};

// Check if this module is being run directly (not imported)
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  startServer();
}

export default app;
`;

fs.writeFileSync('server.ts', newServerCode);

console.log("Refactored server.ts");
