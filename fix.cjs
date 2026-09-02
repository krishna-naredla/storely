const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const webhookCode = `// 9. Razorpay Webhook for Subscription/Vendor Upgrades
app.post("/api/webhooks/razorpay", express.json({ type: 'application/json' }), (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "default_secret"; // Normally fetched from config
    
    if (signature) {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
        
      if (expectedSignature !== signature) {
        console.warn("Invalid Razorpay Webhook Signature");
        return res.status(400).send("Invalid signature");
      }
    }
    
    const event = req.body.event;
    console.log(\`[Webhook] Received Razorpay event: \${event}\`);
    
    // Handle specific events like subscription charged or payment captured for Pro upgrade
    if (event === "payment.captured" || event === "subscription.charged") {
      const payload = req.body.payload?.payment?.entity || req.body.payload?.subscription?.entity;
      // In a real DB, we would look up the vendor by notes.vendorId and set plan to 'pro'
      console.log(\`[Webhook] Processing upgrade for vendor:\`, payload?.notes?.vendorId || "Unknown");
    }
    
    res.json({ status: 'ok' });
  } catch (err: any) {
    console.error("Webhook error:", err);
    res.status(500).send("Webhook handler failed");
  }
});`;

// Remove the appended code
code = code.replace(webhookCode, '');
// Find where app.post ends and insert it inside startServer()
code = code.replace(`// Vite middleware for development`, webhookCode + `\n\n  // Vite middleware for development`);
fs.writeFileSync('server.ts', code);
console.log("Fixed server.ts");
