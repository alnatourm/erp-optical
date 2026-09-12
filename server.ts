import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "OptiVision Enterprise Optical ERP" });
  });

  // AI Assistant endpoint for CRM WhatsApp messages
  app.post("/api/ai/crm-draft", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          draft: "Hello! Thank you for choosing OptiVision. Your new optical glasses are ready for collection at our store!"
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const { customerName, ruleType } = req.body;

      const prompt = `Write a polite 2-sentence WhatsApp customer follow-up message in English and Arabic for an optical store customer named ${customerName || 'Valued Customer'} regarding: ${ruleType || 'Optical glasses checkup'}. Keep it warm and professional.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      res.json({ draft: response.text || "Hello! Thank you for choosing OptiVision." });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to generate AI response" });
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
    console.log(`OptiVision ERP Server running on http://localhost:${PORT}`);
  });
}

startServer();
