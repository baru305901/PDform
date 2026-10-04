import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

// Server-side Google GenAI initialization with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API endpoint for AI-powered income dictation & summary
app.post('/api/summarize-income', async (req, res) => {
  try {
    const { rawNotes, customerName, businessName } = req.body;

    if (!rawNotes || typeof rawNotes !== 'string' || !rawNotes.trim()) {
      return res.status(400).json({ error: 'Raw notes are required' });
    }

    const systemInstruction = `You are a Senior Credit Officer at an NBFC. Take these raw field notes and convert them into a professional, formal English paragraph assessing the customer's monthly income, cash flow, and disposable surplus. Output ONLY clean English. Do not echo the original text.

CRITICAL RULES:
1. Strict 100% formal, polished banking English. Zero Hindi, Marwadi, or colloquial slang words.
2. Translate local terms:
   - "galla" -> "daily cash counter collection"
   - "udhaar / parchi" -> "informal rolling credit / ledger receivables"
   - "kharcha" -> "operational overheads / recurring expenses"
   - "bachat / kamaai" -> "net disposable income / surplus"
3. Preserve all exact figures, monetary amounts, percentages, candidate counts, and tenures. Calculate monthly projections where daily values are provided.
4. Output ONLY the concise, formal credit assessment paragraph. No conversational intro, no outro, no markdown preamble.`;

    const prompt = `Applicant: ${customerName || 'Borrower'}
Business: ${businessName || 'Trading/Services'}
Raw Field Notes:
"${rawNotes}"

Convert into a formal English Monthly Income & Cash Flow Assessment paragraph:`;

    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let summary = '';
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.2,
          },
        });

        summary = response.text?.trim() || '';
        if (summary) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} call failed:`, err?.message || err);
      }
    }

    if (!summary) {
      const errMsg = lastError?.message || 'Failed to generate summary from Gemini';
      return res.status(500).json({ error: errMsg });
    }

    res.json({ summary });
  } catch (error: any) {
    console.error('Error generating income summary:', error);
    res.status(500).json({
      error: error?.message || 'Internal server error while processing income summary',
    });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
