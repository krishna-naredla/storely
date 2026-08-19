import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

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
          const image = vendor.banner || vendor.logo || generateFallbackOgImage(vendor.name);
          const url = `${req.protocol}://${req.get('host')}/store/${slug}`;

          const ogTags = `
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <title>${title}</title>
            <meta name="description" content="${description}" />
            <meta property="og:title" content="${vendor.name} | Storelly" />
            <meta property="og:description" content="${description}" />
            <meta property="og:image" content="${image}" />
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
