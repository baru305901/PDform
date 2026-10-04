import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Loader2, RotateCcw, ChevronDown, ChevronUp, Key } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface IncomeDictationAssistantProps {
  customerName: string;
  businessName: string;
  onApplySummary: (summary: string) => void;
}

// Extend window for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export const IncomeDictationAssistant: React.FC<IncomeDictationAssistantProps> = ({
  customerName,
  businessName,
  onApplySummary
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [customKey, setCustomKey] = useState(() => localStorage.getItem('user_gemini_api_key') || '');
  const recognitionRef = useRef<any>(null);

  const getEffectiveApiKey = (): string => {
    return (
      customKey.trim() ||
      (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) ||
      localStorage.getItem('user_gemini_api_key') ||
      ''
    );
  };

  // Initialize Web Speech API with continuous=false and interimResults=false to stop duplication
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Prevent repeated overlapping loops
      recognition.interimResults = false; // Only accept final, verified speech
      recognition.lang = 'hi-IN'; // Optimized for Indian Hindi / Hinglish / Marwadi accent

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0]?.transcript?.trim();
        if (transcript) {
          setRawText((prev) => (prev ? prev + ' ' : '') + transcript);
          setStatusMessage(`Captured: "${transcript}"`);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setStatusMessage('Microphone access blocked. Please allow mic in browser settings.');
        } else {
          setStatusMessage(`Mic notice (${event.error}). Ready to speak.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can type in the box directly.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setStatusMessage('Voice dictation paused');
    } else {
      try {
        if (!isOpen) {
          setIsOpen(true);
        }
        recognitionRef.current.start();
        setIsListening(true);
        setStatusMessage('Listening (hi-IN)... Speak your sentence now.');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSaveApiKey = () => {
    if (customKey.trim()) {
      localStorage.setItem('user_gemini_api_key', customKey.trim());
      setStatusMessage('API Key saved to browser storage.');
      setShowKeyInput(false);
    } else {
      localStorage.removeItem('user_gemini_api_key');
      setStatusMessage('Custom API Key cleared.');
      setShowKeyInput(false);
    }
  };

  const handleGenerateSummary = async () => {
    const textToSummarize = rawText.trim();

    if (!textToSummarize) {
      alert('Please speak or type raw field notes before generating summary.');
      return;
    }

    let activeKey = getEffectiveApiKey();

    if (!activeKey) {
      const userEntered = prompt(
        'Please enter your Google Gemini API key to enable standalone client-side summarization:\n(Key will be stored locally in your browser)'
      );
      if (userEntered && userEntered.trim()) {
        activeKey = userEntered.trim();
        setCustomKey(activeKey);
        localStorage.setItem('user_gemini_api_key', activeKey);
      } else {
        alert('A valid Gemini API key is required to generate the AI summary.');
        return;
      }
    }

    setIsLoading(true);
    setStatusMessage('Generating professional English credit summary with Gemini...');

    try {
      const ai = new GoogleGenAI({
        apiKey: activeKey,
      });

      const systemInstruction = `You are a Senior Credit Officer at an NBFC. Take these raw field notes (in Hindi, Marwadi, or Hinglish) and convert them into a professional, formal English paragraph assessing the customer's monthly income, cash flow, and disposable surplus. Output ONLY clean formal English. Preserve all numbers and calculations.`;

      const prompt = `Applicant: ${customerName || 'Borrower'} | Business: ${businessName || 'Trading/Services'} | Raw Field Notes: "${textToSummarize}"`;

      const candidateModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
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
          if (summary) break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${model} attempt failed:`, err?.message || err);
        }
      }

      if (!summary) {
        throw new Error(lastError?.message || 'Failed to receive summary from Gemini API');
      }

      // Populate formal English summary strictly from Gemini into report
      onApplySummary(summary);
      setStatusMessage('✓ English Credit Summary generated & populated!');
      setTimeout(() => {
        setStatusMessage(null);
        setIsOpen(false);
      }, 1500);
    } catch (err: any) {
      console.error('Client-side AI summary error:', err);
      const errMsg = err?.message || 'Failed to generate AI English summary.';
      setStatusMessage(`Error: ${errMsg}`);
      // Show alert error instead of dumping raw text
      alert(`AI English Summary Error: ${errMsg}\n\nPlease verify your Gemini API key and internet connection, then try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSampleNotes = (type: 'galla' | 'fees') => {
    if (type === 'galla') {
      setRawText('Daily galla lagbhag 25,000 se 30,000 cash collection aave hai. Gross monthly turnover 7.5 lakh se 8 lakh. Margin 15-18% bache hai. Shop khud ki hai, 2 helper ki salary 20,000 jati hai.');
    } else {
      setRawText('Driving training fees Rs 3,500 per student. Mahine me 25-30 candidate training lete hain. Monthly gross collection Rs 90,000 - 1,00,000. Fuel maintenance kharcha lagbhag 22,000 katke net income 70,000-75,000 bachti hai.');
    }
    setStatusMessage('Sample raw note loaded. Click "Generate Income Summary".');
  };

  return (
    <div className="no-print">
      {/* Header Bar Integration Toggle */}
      <div className="flex items-center justify-between px-2 py-0.5 bg-slate-800 text-white rounded-t-sm text-[10px] border-b border-slate-700">
        <div className="flex items-center gap-1.5 font-bold tracking-wide text-blue-200">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>AI Income Dictation & Auto-Summary</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="p-1 text-slate-400 hover:text-amber-300 rounded"
            title="Configure / View Gemini API Key"
          >
            <Key className="w-2.5 h-2.5" />
          </button>
          <button
            type="button"
            onClick={toggleListening}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 transition ${
              isListening
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
            title="Toggle Hindi/Hinglish voice dictation"
          >
            {isListening ? <MicOff className="w-2.5 h-2.5" /> : <Mic className="w-2.5 h-2.5 text-blue-400" />}
            <span>{isListening ? 'Listening...' : 'Voice Mic'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-0.5 text-slate-300 hover:text-white rounded"
            title={isOpen ? 'Collapse Assistant' : 'Open Dictation Panel'}
          >
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* API Key Modal / Drawer */}
      {showKeyInput && (
        <div className="bg-slate-950 border-x border-b border-amber-600/40 p-2 text-xs text-slate-200 flex items-center gap-2">
          <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <input
            type="password"
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            placeholder="Gemini API Key (leave blank to use system env)"
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={handleSaveApiKey}
            className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold rounded"
          >
            Save Key
          </button>
        </div>
      )}

      {/* Expanded Dictation Panel */}
      {isOpen && (
        <div className="bg-slate-900 border-x border-b border-slate-700 p-2.5 space-y-2 text-xs text-slate-200 shadow-md animate-in fade-in duration-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              Speak or type notes in Hindi, Marwadi, or Hinglish:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleLoadSampleNotes('galla')}
                className="text-[9px] text-sky-400 hover:underline px-1"
              >
                + Retail Galla
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={() => handleLoadSampleNotes('fees')}
                className="text-[9px] text-sky-400 hover:underline px-1"
              >
                + Fees Service
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g. Daily galla 25k cash, 30 candidates driving fee 3500, petrol kharcha 15000 katke net 70-75k kamaai..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white placeholder:text-slate-500 focus:outline-blue-500"
            />
            {rawText && (
              <button
                type="button"
                onClick={() => setRawText('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-white text-[10px] p-0.5"
                title="Clear input"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate max-w-[280px]">
              {isListening && (
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
              <span className="truncate">{statusMessage || 'Web Speech (hi-IN) & Client Gemini enabled'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleListening}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3 h-3" />
                    <span>Stop Mic</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3 text-red-400" />
                    <span>Dictate</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={isLoading || !rawText.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Summarizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Generate Income Summary</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
