const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('addDoc(collection(serverDb, "orders")')) {
  // Add addDoc to imports if missing
  if (!code.includes('addDoc')) {
    code = code.replace(
      'from "firebase/firestore";',
      ', addDoc } from "firebase/firestore";'
    );
  }

  // Update free endpoint
  code = code.replace(
    '// Free product => Provide secure download access',
    `// Free product => Provide secure download access
      await addDoc(collection(serverDb, "orders"), {
        businessId: item.businessId,
        orderNumber: "DIG-" + Date.now(),
        customerName: "Guest User",
        orderType: "digital",
        items: [{ itemId: item.id, name: item.name, price: 0, quantity: 1 }],
        subtotal: 0, deliveryFee: 0, discount: 0, tax: 0, total: 0,
        status: "delivered",
        paymentMethod: "online",
        paymentStatus: "paid",
        createdAt: Date.now(),
        updatedAt: Date.now()
      });`
  );

  // Update paid endpoint
  code = code.replace(
    '// Return secure download access',
    `// Record digital purchase
        await addDoc(collection(serverDb, "orders"), {
          businessId: item.businessId,
          orderNumber: "DIG-" + Date.now(),
          customerName: "Guest User",
          orderType: "digital",
          items: [{ itemId: item.id, name: item.name, price: item.price, quantity: 1 }],
          subtotal: item.price, deliveryFee: 0, discount: 0, tax: 0, total: item.price,
          status: "delivered",
          paymentMethod: "online",
          paymentStatus: "paid",
          paymentId: razorpay_payment_id,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });

        // Return secure download access`
  );

  fs.writeFileSync(file, code);
}
