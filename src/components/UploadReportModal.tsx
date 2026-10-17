import React, { useState, useRef } from 'react';
import { parseUploadedReport } from '../services/pdfReportParser';
import { PDReportData } from '../types';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  FileSpreadsheet,
  ArrowRight,
  Database,
  Edit,
  RotateCcw
} from 'lucide-react';

interface UploadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadReport: (data: PDReportData, autoSaveToDb?: boolean) => Promise<void> | void;
}

export const UploadReportModal: React.FC<UploadReportModalProps> = ({
  isOpen,
  onClose,
  onLoadReport,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<PDReportData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setStatusMessage(null);
    setErrorMessage(null);
    setExtractedData(null);
  };

  const handleFile = async (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    setExtractedData(null);
    setIsProcessing(true);
    setStatusMessage('Reading file...');

    try {
      const parsed = await parseUploadedReport(file, (msg) => {
        setStatusMessage(msg);
      });
      setExtractedData(parsed);
      setStatusMessage('✓ Extraction Complete. Review highlights below before loading.');
    } catch (err: any) {
      console.error('Extraction error:', err);
      setErrorMessage(
        err?.message || 'Failed to extract data from the uploaded file. Please verify file format.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleApply = async (autoSave: boolean) => {
    if (!extractedData) return;
    try {
      await onLoadReport(extractedData, autoSave);
      handleReset();
      onClose();
    } catch (err: any) {
      setErrorMessage(`Error applying report: ${err?.message || err}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-wide">
                Upload Report / PDF & Edit
              </h3>
              <p className="text-xs text-slate-400">
                Extract PDF, JSON, or text reports into form inputs with AI
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Dropzone */}
          {!extractedData && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-500/10'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-950/50 hover:bg-slate-950/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.json,.txt,application/pdf,application/json,text/plain"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-indigo-400 mb-3">
                <FileText className="w-7 h-7" />
              </div>

              <h4 className="text-sm font-semibold text-white mb-1">
                Click to browse or drag & drop document
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Supports official <strong>PDF reports</strong>, <strong>JSON backups</strong>, or text notes.
              </p>

              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">PDF (.pdf)</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">JSON (.json)</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Text (.txt)</span>
              </div>
            </div>
          )}

          {/* Processing / Progress State */}
          {isProcessing && (
            <div className="p-5 rounded-xl bg-slate-950 border border-indigo-500/30 flex items-center gap-3.5">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400 shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-semibold text-white">AI Extracting Document Fields...</div>
                <div className="text-[11px] text-indigo-300/80">{statusMessage}</div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-red-300">Extraction Error</div>
                <div className="text-[11px] text-red-200/80 mt-0.5">{errorMessage}</div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-2 px-2.5 py-1 bg-red-900/60 hover:bg-red-800/80 text-white rounded text-[11px] font-medium transition"
                >
                  Try Another File
                </button>
              </div>
            </div>
          )}

          {/* Extracted Highlights Preview */}
          {extractedData && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Document Extracted Successfully</span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Upload Different File</span>
                </button>
              </div>

              {/* Data Card Grid */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Applicant Name</span>
                    <span className="font-semibold text-white text-sm">
                      {extractedData.customerName || 'Not specified'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">SKOP Number</span>
                    <span className="font-semibold text-amber-300 font-mono">
                      {extractedData.shopNo || 'Not specified'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Visit Date</span>
                    <span className="font-medium text-slate-300">
                      {extractedData.visitDate || '-'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Location</span>
                    <span className="font-medium text-slate-300 truncate block">
                      {extractedData.visitLocation || '-'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Mobile Verified</span>
                    <span className="font-medium text-slate-300 font-mono">
                      {extractedData.contactNumbers || '-'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Recommendation</span>
                    <span
                      className={`font-semibold inline-block px-1.5 py-0.5 rounded text-[11px] ${
                        extractedData.recommendation === 'Recommended'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-950 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {extractedData.recommendation}
                    </span>
                  </div>
                </div>

                {extractedData.monthlyIncomeDetails && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">
                      Extracted Monthly Income Details
                    </span>
                    <p className="text-[11px] text-slate-300 line-clamp-2">
                      {extractedData.monthlyIncomeDetails}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-400">
                  <span>
                    Family members detected:{' '}
                    <strong className="text-white">
                      {extractedData.familyMembers.filter((m) => m.name).length}
                    </strong>
                  </span>
                  {extractedData.cibilAppScore && (
                    <span>
                      CIBIL Score: <strong className="text-amber-300 font-mono">{extractedData.cibilAppScore}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        {extractedData && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => handleApply(false)}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Load & Edit in Form</span>
            </button>

            <button
              type="button"
              onClick={() => handleApply(true)}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md hover:shadow-emerald-500/25 transition flex items-center justify-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Load & Save to Database</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
