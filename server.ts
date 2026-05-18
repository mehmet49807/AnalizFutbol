import { GoogleGenAI } from "@google/genai";
import express from "express";
import path from "path";
import { EventEmitter } from "events";

const liveScoreEmitter = new EventEmitter();
let simulatedSecond = 75;

const getLiveMatches = () => {
  return [
    { 
      id: 1, 
      home: 'Galatasaray', 
      away: 'Fenerbahçe', 
      score: `2 - ${simulatedSecond > 80 ? '2' : '1'}`, 
      time: `${simulatedSecond}'`, 
      league: 'Süper Lig', 
      leagueId: 'super-lig',
      isGoal: simulatedSecond === 81
    },
    { 
      id: 2, 
      home: 'Beşiktaş', 
      away: 'Trabzonspor', 
      score: '0 - 0', 
      time: '24\'', 
      league: 'Süper Lig', 
      leagueId: 'super-lig' 
    },
    { 
      id: 3, 
      home: 'Real Madrid', 
      away: 'Barcelona', 
      score: '1 - 2', 
      time: 'HT', 
      league: 'La Liga', 
      leagueId: 'la-liga' 
    },
    { 
      id: 4, 
      home: 'Arsenal', 
      away: 'Chelsea', 
      score: '3 - 1', 
      time: '88\'', 
      league: 'Premier League', 
      leagueId: 'premier-league' 
    },
  ];
};

// Simulation Loop
setInterval(() => {
  simulatedSecond = simulatedSecond >= 90 ? 1 : simulatedSecond + 1;
  liveScoreEmitter.emit('update', getLiveMatches());
}, 5000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy Gemini helper
  let genAIInstance: GoogleGenAI | null = null;
  const getGenAI = () => {
    if (!genAIInstance) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing");
      }
      genAIInstance = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return genAIInstance;
  };

  // API Routes
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  app.post("/api/analyze", async (req, res) => {
    try {
      const { prompt, context } = req.body;
      const model = "gemini-1.5-flash"; // Use stable model alias 
      
      const systemInstruction = `Sen uzman bir futbol analistisin. 
      Kullanıcının futbol sorularını teknik, taktik ve güncel verilerle (eğer sağlanmışsa) yanıtla.
      Yanıtlarını Markdown formatında ver. Futbol terimlerini doğru kullan.
      Analizlerin derinlikli ve objektif olsun.`;

      const ai = getGenAI();
      const result = await ai.getGenerativeModel({ model, systemInstruction }).generateContent(
        `${context ? `Bağlam: ${context}\n\n` : ''}${prompt}`
      );

      res.json({ text: result.response.text() });
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      res.status(500).json({ error: "Analiz sırasında bir hata oluştu." });
    }
  });

  app.post("/api/news", async (req, res) => {
    try {
      const { favorites } = req.body;
      const model = "gemini-1.5-flash";
      
      let prompt = "Dünya futbolundan son 24 saatteki en önemli 5 haberi özetle. Her haber için kısa bir başlık ve 1-2 cümlelik açıklama yap. Türkçe olsun.";
      
      if (favorites && favorites.length > 0) {
        prompt = `Özellikle şu liglere/takımlara odaklanarak: ${favorites.join(', ')}. 
        Dünya futbolundan son 24 saatteki en önemli 5 haberi özetle. 
        Kullanıcının ilgi alanlarına öncelik ver ama genel önemli haberleri de dışlama.
        Her haber için kısa bir başlık ve 1-2 cümlelik açıklama yap. Türkçe olsun.`;
      }

      const ai = getGenAI();
      const result = await ai.getGenerativeModel({ model }).generateContent(prompt);
      res.json({ text: result.response.text() });
    } catch (error) {
      console.error("News fetch error:", error);
      res.status(500).json({ error: "Haberler alınamadı." });
    }
  });

  app.get("/api/live-matches", (req, res) => {
    res.json(getLiveMatches());
  });

  app.get("/api/live-scores-sse", (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Check if flushHeaders exists (it should in modern Node)
    if (res.flushHeaders) res.flushHeaders();

    const sendUpdate = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendUpdate(getLiveMatches());
    liveScoreEmitter.on('update', sendUpdate);

    req.on('close', () => {
      liveScoreEmitter.off('update', sendUpdate);
    });
  });

  app.get("/api/match-details/:id", async (req, res) => {
    const { id } = req.params;
    const { home, away, league } = req.query;

    try {
      const model = "gemini-1.5-flash";
      const prompt = `Futbol analiz uzmanı gibi davran. ${league} ligindeki ${home} vs ${away} maçı için detaylı bir analiz raporu hazırla. 
      Lütfen şu bölümleri içeren profesyonel bir Markdown raporu oluştur:
      1. Skor Tahmini: [Skor]
      2. Maç Sonucu: [Galibiyet/Beraberlik/Mağlubiyet]
      3. Kırmızı Kart: [VAR / YOK] - [Neden]
      4. Korner: [ÜST / ALT] - [Neden] (Baraj 2.5 Korner)
      5. Muhtemel İlk 11'ler
      6. Sakat ve Cezalılar
      7. Teknik Analiz ve Yorumlar

      Yanıtı Türkçe ve heyecan verici bir dille yaz. Tahminlerin (Skor, Maç Sonucu, Kırmızı Kart, Korner) başına mutlaka "🤖 AI TAHMİNİ:" ibaresini ekle. Kırmızı kart tahmini için "VAR" veya "YOK" kelimelerini, korner için "ÜST" veya "ALT" kelimelerini mutlaka büyük harfle kullan.`;

      const ai = getGenAI();
      const result = await ai.getGenerativeModel({ model }).generateContent(prompt);
      res.json({ analysis: result.response.text() });
    } catch (error) {
      console.error("Gemini match analysis error:", error);
      res.status(500).json({ error: "Analiz oluşturulamadı." });
    }
  });

  // Assets and SPA fallback
  if (process.env.NODE_ENV !== "production") {
    // Dynamic import to avoid missing 'vite' error in production
    const { createServer: createViteServer } = await import("vite");
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server startup error:", err);
  process.exit(1);
});

