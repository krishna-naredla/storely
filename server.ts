import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Digital Product Flow - FREE
  app.post("/api/digital/free", async (req, res) => {
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ error: "Missing itemId" });
    
    // In a real app, verify item exists and is free in Firestore
    // For now, return a success with a mock signed URL
    res.json({ 
      success: true, 
      downloadUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg" // Placeholder
    });
  });

  // Digital Product Flow - PAID (Create Razorpay Order)
  app.post("/api/digital/create-order", async (req, res) => {
    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ error: "Missing itemId" });

    // Mock Razorpay Order Creation
    res.json({
      id: "order_" + Math.random().toString(36).substring(7),
      amount: 49900, // example 499 INR
      currency: "INR"
    });
  });

  // Digital Product Flow - VERIFY PAYMENT
  app.post("/api/digital/verify-payment", async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, itemId } = req.body;
    
    // In real app, verify signature using crypto.createHmac
    res.json({
      success: true,
      downloadUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg" // Placeholder
    });
  });

  // Gemini Proxy
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
