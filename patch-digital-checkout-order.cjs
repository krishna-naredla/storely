const fs = require('fs');
let code = fs.readFileSync('src/components/storefront/DigitalCheckoutModal.tsx', 'utf8');

const oldRazorpayBlock = `      // 1. Create order on server
      const { res, data: orderData } = await safeJsonFetch('/api/digital/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: price }),
      });

      if (!res.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize payment');
      }

      // Check for Razorpay SDK on window
      const RazorpayClass = (window as any).Razorpay;

      const completeOrderVerification = async (paymentDetails: any) => {
        const { res: verifyRes, data: verifyData } = await safeJsonFetch('/api/digital/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: paymentDetails.razorpay_order_id || orderData.id,
            razorpay_payment_id: paymentDetails.razorpay_payment_id || \`pay_\${Date.now()}\`,
            razorpay_signature: paymentDetails.razorpay_signature || 'mock_sig',
            itemId: item.id,
            fileUrl: item.digitalFileUrl || item.images?.[0] || '',
            fileName: item.fileName || item.name,
            customerName: customerName.trim(),
            customerPhone: cleanPhone,
            customerEmail: customerEmail.trim() || undefined,
            amount: price || 0,
          }),
        });
        if (!verifyRes.ok || !verifyData.success) {
          throw new Error(verifyData.error || 'Payment verification failed');
        }

        // Log order in Firestore as DELIVERED
        const newOrder = await createOrder(business.id, {`;

const newRazorpayBlock = `      // 1. Pre-log order in Firestore as PENDING to prevent lost orders
      const pendingOrder = await createOrder(business.id, {
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerEmail: customerEmail.trim() || undefined,
        orderType: 'digital',
        items: [
          {
            id: item.id,
            name: item.name,
            price: item.price || 0,
            quantity: 1,
            images: item.images || [],
            digitalFileUrl: item.digitalFileUrl,
            fileName: item.fileName,
          },
        ],
        totalAmount: price,
        paymentMethod: 'online',
        paymentStatus: 'pending',
        downloadStatus: 'pending',
      });

      // 2. Create order on server
      const { res, data: orderData } = await safeJsonFetch('/api/digital/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: price, receipt: pendingOrder.id }),
      });

      if (!res.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize payment');
      }

      const RazorpayClass = (window as any).Razorpay;

      const completeOrderVerification = async (paymentDetails: any) => {
        // Secure server-side verification endpoint acting as synchronous webhook
        const { res: verifyRes, data: verifyData } = await safeJsonFetch('/api/digital/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: paymentDetails.razorpay_order_id || orderData.id,
            razorpay_payment_id: paymentDetails.razorpay_payment_id || \`pay_\${Date.now()}\`,
            razorpay_signature: paymentDetails.razorpay_signature || 'mock_sig',
            itemId: item.id,
            fileUrl: item.digitalFileUrl || item.images?.[0] || '',
            fileName: item.fileName || item.name,
            customerName: customerName.trim(),
            customerPhone: cleanPhone,
            customerEmail: customerEmail.trim() || undefined,
            amount: price || 0,
            pendingOrderId: pendingOrder.id
          }),
        });
        if (!verifyRes.ok || !verifyData.success) {
          throw new Error(verifyData.error || 'Payment verification failed');
        }

        // Finalize order status in local state (backend updates DB in production webhook)
        const newOrder = {
          ...pendingOrder,`;

code = code.replace(oldRazorpayBlock, newRazorpayBlock);

// Also remove the old `const newOrder = await createOrder` that happens inside completeOrderVerification
const oldCreateOrderInside = `        const newOrder = await createOrder(business.id, {
          customerName: customerName.trim(),
          customerPhone: cleanPhone,
          customerEmail: customerEmail.trim() || undefined,
          orderType: 'digital',
          items: [
            {
              id: item.id,
              name: item.name,
              price: item.price || 0,
              quantity: 1,
              images: item.images || [],
            },
          ],
          totalAmount: price,
          paymentMethod: 'online',
          paymentStatus: 'paid',
          downloadStatus: 'completed',
          digitalAccessUrl: verifyData.downloadUrl,
        });`;

const newCreateOrderInside = `          paymentStatus: 'paid',
          downloadStatus: 'completed',
          digitalAccessUrl: verifyData.downloadUrl,
        };`;

code = code.replace(oldCreateOrderInside, newCreateOrderInside);

fs.writeFileSync('src/components/storefront/DigitalCheckoutModal.tsx', code);
console.log('patched DigitalCheckoutModal.tsx');
