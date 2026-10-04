import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Check, X, Type } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  officerName: string;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  officerName
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [inkColor, setInkColor] = useState<string>('#0f2b5c');
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState(officerName || 'PD Officer');

  useEffect(() => {
    if (officerName) {
      setTypedName(officerName);
    }
  }, [officerName]);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = inkColor;
      }
    }
  }, [isOpen, inkColor]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = inkColor;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const generateTypedSignature = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '36px "Caveat", cursive, sans-serif';
    ctx.fillStyle = inkColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName || 'Authorised Signatory', canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
  };

  const handleSave = () => {
    if (mode === 'type') {
      const generated = generateTypedSignature();
      onSave(generated);
      onClose();
      return;
    }

    if (!canvasRef.current || !hasDrawn) {
      onClose();
      return;
    }
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-sm">PD Authorised Person Signature</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 rounded-md"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setMode('draw')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  mode === 'draw' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Draw Signature
              </button>
              <button
                type="button"
                onClick={() => setMode('type')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  mode === 'type' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Type & Stamp
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Ink:</span>
              <button
                type="button"
                onClick={() => setInkColor('#0f2b5c')}
                className={`w-5 h-5 rounded-full border-2 ${
                  inkColor === '#0f2b5c' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-300'
                } bg-[#0f2b5c]`}
                title="Blue Banker Ink"
              />
              <button
                type="button"
                onClick={() => setInkColor('#111827')}
                className={`w-5 h-5 rounded-full border-2 ${
                  inkColor === '#111827' ? 'border-slate-900 ring-2 ring-slate-300' : 'border-slate-300'
                } bg-[#111827]`}
                title="Black Ink"
              />
            </div>
          </div>

          {mode === 'draw' ? (
            <div className="space-y-2">
              <div className="relative border-2 border-dashed border-slate-300 rounded-lg bg-slate-50/50 touch-none overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={140}
                  className="w-full h-[140px] cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!hasDrawn && (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <PenTool className="w-5 h-5 mb-1 opacity-50" />
                    <span>Sign here with mouse, pen or finger</span>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear Pad
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Signatory Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Enter Officer Full Name"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-blue-600 font-medium"
                  />
                  <Type className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-center">
                <p className="text-[11px] text-slate-400 mb-1 font-medium">Signature Preview</p>
                <p
                  className="text-3xl font-script tracking-wider"
                  style={{ fontFamily: 'Caveat, cursive', color: inkColor }}
                >
                  {typedName || 'Your Signature'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Signature
          </button>
        </div>
      </div>
    </div>
  );
};
