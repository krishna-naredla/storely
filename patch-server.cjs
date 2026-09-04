const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldWebhook = `        // Handle specific events like subscription charged or payment captured for Pro upgrade
        if (event === "payment.captured" || event === "subscription.charged") {
          const payload =
            req.body.payload?.payment?.entity ||
            req.body.payload?.subscription?.entity;
          // In a real DB, we would look up the vendor by notes.vendorId and set plan to 'pro'
          console.log(
            \`[Webhook] Processing upgrade for vendor:\`,
            payload?.notes?.vendorId || "Unknown",
          );
        }`;

const newWebhook = `        // Handle specific events like subscription charged or payment captured for Pro upgrade
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
        }`;

if (code.includes('if (event === "payment.captured" || event === "subscription.charged") {')) {
    code = code.replace(oldWebhook, newWebhook);
    fs.writeFileSync('server.ts', code);
    console.log('patched webhook in server.ts');
} else {
    console.log('webhook block not found');
}
