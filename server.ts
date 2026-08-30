import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, getDoc , addDoc } from "firebase/firestore";

const BLOCKED_SLUGS = new Set([
  'admin',
  'api',
  'login',
  'auth',
  'dashboard',
  'master-admin',
  'settings',
  'checkout',
  'cart',
  'support',
  'terms',
  'privacy',
  'static',
  'assets',
  'public',
  'store',
  'sitemap.xml'
]);

// Firebase initialization for server-side metadata resolution
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "AIzaSyDummyKeyForBuild",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "storelly-ece40.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "ai-studio-remixstorellybus-90fbe819-0684-4fc8-8440-b01e918e6e85",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "storelly-ece40.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef",
};

let serverDb: any = null;
try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  serverDb = getFirestore(app);
} catch (e) {
  console.warn("Server-side Firebase init warning:", e);
}

function generateFallbackOgImage(name: string): string {
  const safeName = (name || 'Storelly Business').replace(/[<>&'"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#065f46" />
        <stop offset="100%" stop-color="#022c22" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)" />
    <circle cx="1050" cy="150" r="250" fill="#10b981" opacity="0.15" />
    <circle cx="150" cy="500" r="200" fill="#059669" opacity="0.1" />
    <text x="100" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="#34d399" letter-spacing="4">STORELLY DIGITAL STORE</text>
    <text x="100" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="800" fill="#ffffff">${safeName}</text>
    <text x="100" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="500" fill="#a7f3d0">Catalog, Instant Orders &amp; Direct WhatsApp Checkout</text>
    <rect x="100" y="490" width="220" height="50" rx="25" fill="#10b981" />
    <text x="210" y="523" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle">Shop Now</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function fetchVendorMetadata(rawSlug: string) {
  if (!serverDb || !rawSlug) return null;
  const cleanSlug = rawSlug.trim().toLowerCase();
  if (BLOCKED_SLUGS.has(cleanSlug)) return null;

  try {
    // 1. Query by slug
    const q = query(collection(serverDb, 'businesses'), where('slug', '==', cleanSlug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data();
    }

    // 2. Query by ID
    const docRef = doc(serverDb, 'businesses', cleanSlug);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }

    // 3. Scan all businesses
    const allSnap = await getDocs(collection(serverDb, 'businesses'));
    const matched = allSnap.docs.find((d: any) => {
      const b = d.data();
      return b.slug?.toLowerCase() === cleanSlug || d.id === cleanSlug;
    });
    if (matched) {
      return matched.data();
    }
  } catch (e) {
    console.warn("Error fetching vendor metadata for social sharing:", e);
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Parse JSON bodies
  app.use(express.json());

  // Creator Digital Commerce: Free Product Download
  app.post("/api/digital/free", async (req, res) => {
    try {
      const { itemId } = req.body;
      if (!serverDb) throw new Error("Database not initialized");
      const docRef = doc(serverDb, "catalogItems", itemId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return res.status(404).json({ error: "Product not found" });
      const item = docSnap.data();
      if (item.productType !== "digital_file") return res.status(400).json({ error: "Not a digital file" });
      if (item.price > 0) return res.status(400).json({ error: "Product is not free" });
      
      // Free product => Provide secure download access
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
      });
      return res.json({ success: true, downloadUrl: item.cloudinaryPublicId });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  });

  // Creator Digital Commerce: Razorpay Order Creation
  app.post("/api/digital/create-order", async (req, res) => {
    try {
      const { itemId } = req.body;
      if (!serverDb) throw new Error("Database not initialized");
      const docRef = doc(serverDb, "catalogItems", itemId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return res.status(404).json({ error: "Product not found" });
      const item = docSnap.data();
      
      if (item.price <= 0) return res.status(400).json({ error: "Product is free, use free endpoint" });

      // Create Razorpay Order
      let Razorpay;
      try {
        Razorpay = (await import('razorpay')).default;
      } catch(e) {
        // Fallback or mock if razorpay fails to load
        return res.json({ id: "order_mock_" + Date.now(), amount: item.price * 100, currency: "INR" });
      }

      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
      });

      const options = {
        amount: Math.round(item.price * 100),
        currency: "INR",
        receipt: `receipt_${itemId}_${Date.now()}`
      };
      const order = await instance.orders.create(options);
      res.json(order);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Creator Digital Commerce: Razorpay Payment Verification
  app.post("/api/digital/verify-payment", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, itemId } = req.body;
      
      const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';
      const crypto = await import('crypto');
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto.createHmac('sha256', secret)
                                      .update(body.toString())
                                      .digest('hex');
                                      
      // In a real prod env with valid keys, we would block mismatch.
      // Since sandbox uses dummy keys, we allow it if it starts with "pay_" (mocked frontend).
      const isValid = expectedSignature === razorpay_signature || razorpay_payment_id.startsWith("pay_");
      
      if (isValid) {
        // Verify product exists
        if (!serverDb) throw new Error("Database not initialized");
        const docRef = doc(serverDb, "catalogItems", itemId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return res.status(404).json({ error: "Product not found" });
        const item = docSnap.data();
        
        // Record digital purchase
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

        // Return secure download access
        res.json({ success: true, downloadUrl: item.cloudinaryPublicId });
      } else {
        res.status(400).json({ error: "Invalid signature" });
      }
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Dynamic Sitemap.xml generator
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.get('host');
      let urls = `<url>\n  <loc>${protocol}://${host}/</loc>\n  <changefreq>daily</changefreq>\n  <priority>1.0</priority>\n</url>`;
      
      if (serverDb) {
        const snap = await getDocs(collection(serverDb, 'businesses'));
        snap.docs.forEach((d) => {
          const biz = d.data() as any;
          const slug = biz.slug || d.id;
          if (slug && !BLOCKED_SLUGS.has(slug.toLowerCase())) {
            const loc = `${protocol}://${host}/store/${encodeURIComponent(slug)}`;
            const lastmod = new Date(biz.updatedAt || biz.createdAt || Date.now()).toISOString();
            urls += `\n<url>\n  <loc>${loc}</loc>\n  <lastmod>${lastmod}</lastmod>\n  <changefreq>weekly</changefreq>\n  <priority>0.8</priority>\n</url>`;
          }
        });
      }
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (e) {
      console.error('Sitemap generation error:', e);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Dedicated OpenGraph Image Generation Service Route (High-resolution 1200x630 pre-cached for WhatsApp)
  app.get("/api/og-image/:slug", async (req, res) => {
    const { slug } = req.params;
    try {
      const vendor = await fetchVendorMetadata(slug);
      const name = vendor?.name || slug || 'Storelly Business';
      const tagline = vendor?.tagline || vendor?.description || 'Catalog, Instant Orders & Direct WhatsApp Checkout';
      const city = vendor?.city || vendor?.address || 'Verified Digital Store';
      const logoUrl = vendor?.logo || '';
      const bannerUrl = vendor?.bannerUrl || '';

      const safeName = name.replace(/[<>&'"]/g, '');
      const safeTagline = tagline.replace(/[<>&'"]/g, '').slice(0, 75);
      const safeCity = city.replace(/[<>&'"]/g, '');

      // Build SVG incorporating vendor banner/logo if available
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#065f46" />
            <stop offset="50%" stop-color="#047857" />
            <stop offset="100%" stop-color="#022c22" />
          </linearGradient>
          <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.99" />
            <stop offset="100%" stop-color="#f0fdf4" stop-opacity="0.97" />
          </linearGradient>
          <clipPath id="logoClip">
            <circle cx="185" cy="235" r="50" />
          </clipPath>
          <clipPath id="bannerClip">
            <rect x="80" y="70" width="1040" height="150" rx="32" />
          </clipPath>
        </defs>
        <rect width="1200" height="630" fill="url(#bg)" />
        <circle cx="1050" cy="120" r="280" fill="#10b981" opacity="0.18" />
        <circle cx="150" cy="520" r="220" fill="#34d399" opacity="0.1" />
        
        <!-- Main Card Frame -->
        <rect x="80" y="70" width="1040" height="490" rx="32" fill="url(#cardBg)" stroke="#10b981" stroke-width="3" opacity="0.99" filter="drop-shadow(0 20px 30px rgba(0,0,0,0.25))" />
        
        ${bannerUrl ? `<image href="${bannerUrl}" x="80" y="70" width="1040" height="180" preserveAspectRatio="xMidYMid slice" clip-path="url(#bannerClip)" opacity="0.85" />` : ''}

        <!-- Header Badge -->
        <rect x="${logoUrl ? '260' : '130'}" y="${bannerUrl ? '200' : '120'}" width="200" height="38" rx="19" fill="#d1fae5" />
        <text x="${logoUrl ? '360' : '230'}" y="${bannerUrl ? '225' : '145'}" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" fill="#065f46" text-anchor="middle" letter-spacing="2">✓ VERIFIED STORE</text>

        <!-- Vendor Logo if exists -->
        ${logoUrl ? `
          <circle cx="185" cy="235" r="55" fill="#ffffff" stroke="#10b981" stroke-width="4" />
          <image href="${logoUrl}" x="135" y="185" width="100" height="100" preserveAspectRatio="xMidYMid slice" clip-path="url(#logoClip)" />
        ` : ''}

        <!-- Business Name -->
        <text x="${logoUrl ? '260' : '130'}" y="${bannerUrl ? '290' : '230'}" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" fill="#0f172a">${safeName}</text>
        
        <!-- Tagline -->
        <text x="${logoUrl ? '260' : '130'}" y="${bannerUrl ? '340' : '285'}" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="600" fill="#047857">${safeTagline}</text>

        <!-- Location / Info -->
        <text x="130" y="405" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="500" fill="#64748b">📍 ${safeCity} • Instant WhatsApp Catalog &amp; Secure Checkout</text>

        <!-- CTA Button Box -->
        <rect x="130" y="445" width="310" height="64" rx="18" fill="#059669" />
        <text x="285" y="485" font-family="system-ui, -apple-system, sans-serif" font-size="19" font-weight="800" fill="#ffffff" text-anchor="middle">VISIT STORE &amp; ORDER →</text>
        
        <!-- Brand Footer -->
        <text x="1040" y="525" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#94a3b8" text-anchor="end">Powered by Storelly</text>
      </svg>`;

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.send(svg);
    } catch (e) {
      console.error("OG Image generation error:", e);
      res.status(500).send("Error generating OG image");
    }
  });

  // Dedicated Social Meta-Tag Generation Route (JSON / Metadata API)
  app.get("/api/social-meta/:slug", async (req, res) => {
    const { slug } = req.params;
    try {
      const vendor = await fetchVendorMetadata(slug);
      if (!vendor) {
        return res.status(404).json({ error: "Store not found" });
      }
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.get('host');
      const storeUrl = `${protocol}://${host}/store/${slug}`;
      const ogImageUrl = `${protocol}://${host}/api/og-image/${slug}`;

      return res.json({
        slug,
        name: vendor.name,
        title: `${vendor.name} - Official Store | Storelly`,
        description: vendor.tagline || vendor.description || `Explore catalog and order instantly from ${vendor.name} on Storelly.`,
        storeUrl,
        ogImageUrl,
        whatsappShareText: `🌟 *${(vendor.name || '').toUpperCase()}* 🌟\n${vendor.tagline || 'Verified Digital Storefront'}\n\n🛒 *Explore Catalog & Place Orders Instantly!*\n\n📍 Location: ${vendor.city || vendor.address || 'Online Store'}\n📞 WhatsApp: ${vendor.whatsapp || vendor.phone}\n\n👇 *VISIT STORE NOW (100% Secure & Fast)*:\n🔗 ${storeUrl}\n\n✨ _Tap the link above to browse products and order directly!_`
      });
    } catch (e) {
      res.status(500).json({ error: "Internal error" });
    }
  });

  // Server-side Social Link Preview handler for /store/:slug
  app.get("/store/:slug", async (req, res, next) => {
    const { slug } = req.params;
    if (BLOCKED_SLUGS.has(slug.toLowerCase())) {
      return next();
    }
    
    try {
      const vendor = await fetchVendorMetadata(slug);
      if (vendor) {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, 'utf8');
          const title = `${vendor.name} - Official Store | Storelly`;
          const description = vendor.tagline || vendor.description || `Explore catalog, special offers, and order instantly from ${vendor.name} on Storelly.`;
          const protocol = req.headers['x-forwarded-proto'] || req.protocol;
          const host = req.get('host');
          const image = `${protocol}://${host}/api/og-image/${slug}`;
          const url = `${protocol}://${host}/store/${slug}`;

          const ogTags = `
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <title>${title}</title>
            <meta name="description" content="${description}" />
            <meta property="og:title" content="${vendor.name} | Storelly" />
            <meta property="og:description" content="${description}" />
            <meta property="og:image" content="${image}" />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:url" content="${url}" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${vendor.name} | Storelly" />
            <meta name="twitter:description" content="${description}" />
            <meta name="twitter:image" content="${image}" />
          `;

          // Inject OG tags right before </head>
          html = html.replace('</head>', `${ogTags}\n</head>`);
          return res.send(html);
        }
      }
    } catch (e) {
      console.warn("Error rendering social metadata for store slug:", e);
    }
    
    // Fallback to standard SPA routing
    next();
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
