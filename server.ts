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

    const systemInstruction = `You are an expert Credit Appraisal & Case Underwriting Documentation Specialist for NBFCs and Retail Lending (such as SK Finance).
Your task is to transform raw, informal field notes—written or dictated in WhatsApp-style Hinglish, colloquial Hindi, Marwadi dialect, or mixed regional phrasing—into a clean, formal, professional English Credit Income Assessment paragraph for the "Monthly Income / Family Income" section of a Personal Discussion (PD) Visit Report.

STRICT RULES:
1. 100% formal, polished business English. Zero Hindi or Marwadi words (e.g. translate "galla" to "daily cash counter sales", "parchi / udhaar" to "informal credit receivables / rolling credit", "kharcha" to "operating expenses / overheads", "kamaai / bachat" to "net disposable earnings / surplus").
2. Retain all specific numbers, amounts, rates, volume counts, and margins exactly. Calculate monthly gross and net approximations where daily figures are given.
3. Write in an objective, professional tone suitable for Credit Assessment Memos (CAM sheets).
4. Output ONLY the concise, formatted assessment text ready to be pasted directly into the report box. Do not output conversational preamble, greetings, or meta-comments.`;

    const prompt = `Applicant: ${customerName || 'Borrower'}
Business: ${businessName || 'Trading/Services'}
Raw Field Notes/Dictation:
"${rawNotes}"

Generate the formal Monthly Income / Family Income credit observation text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const summary = response.text?.trim() || '';

    if (!summary) {
      return res.status(500).json({ error: 'Failed to generate summary' });
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
