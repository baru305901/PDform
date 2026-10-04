import React, { useRef } from 'react';
import {
  Printer,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Sparkles,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  PenTool,
  Type
} from 'lucide-react';
import { PDReportData } from '../types';

interface HeaderBarProps {
  onLoadSample: (sampleType: 'kulwant' | 'rajesh' | 'blank') => void;
  onClear: () => void;
  onExportExcel: () => void;
  onExportWord: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  zoom: number;
  setZoom: (z: number) => void;
  onFitToWidth?: () => void;
  fontMode: 'script' | 'formal';
  setFontMode: (m: 'script' | 'formal') => void;
  viewMode: 'continuous' | 'p1' | 'p2' | 'p3' | 'split';
  setViewMode: (v: 'continuous' | 'p1' | 'p2' | 'p3' | 'split') => void;
  reportData: PDReportData;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onLoadSample,
  onClear,
  onExportExcel,
  onExportWord,
  onExportJson,
  onImportJson,
  zoom,
  setZoom,
  onFitToWidth,
  fontMode,
  setFontMode,
  viewMode,
  setViewMode,
  reportData
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePrint = () => {
    // If currently on single page tab, switch to continuous so all 3 pages print accurately
    if (viewMode !== 'continuous') {
      setViewMode('continuous');
      setTimeout(() => {
        window.print();
      }, 150);
    } else {
      window.print();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
      e.target.value = '';
    }
  };

  return (
    <header className="no-print sticky top-0 z-50 bg-slate-900 border-b border-slate-700/80 shadow-2xl px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Document Identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex flex-col items-center justify-center text-white font-black text-xs tracking-tighter shadow-md ring-1 ring-white/20">
              <span>SK</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-white text-xs font-bold tracking-wider uppercase leading-tight">
                  SK Finance Limited
                </h1>
                <span className="text-[10px] bg-slate-800 text-amber-300 font-semibold px-1.5 py-0.5 rounded border border-amber-500/30">
                  PD VISIT REPORT
                </span>
              </div>
              <p className="text-slate-400 text-[11px] truncate max-w-[260px]">
                {reportData.customerName ? `Client: ${reportData.customerName}` : 'Strict A4 Paper Form Generator'}
                {reportData.shopNo ? ` · Shop: ${reportData.shopNo}` : ''}
              </p>
            </div>
          </div>

          {/* Quick preset selector on mobile */}
          <div className="flex md:hidden items-center gap-1.5">
            {onFitToWidth && (
              <button
                type="button"
                onClick={onFitToWidth}
                className="text-xs bg-slate-800 text-sky-300 hover:text-white px-2 py-1 rounded font-medium border border-sky-500/30 transition active:scale-95"
                title="Fit sheet to phone screen width"
              >
                {zoom < 0.95 ? '100%' : 'Fit'}
              </button>
            )}
            <button
              onClick={() => onLoadSample('kulwant')}
              className="text-xs bg-slate-800 text-amber-300 px-2 py-1 rounded font-medium border border-amber-500/30"
            >
              Sample
            </button>
            <button
              onClick={handlePrint}
              className="text-xs bg-indigo-600 text-white px-2.5 py-1 rounded font-bold"
            >
              PDF
            </button>
          </div>
        </div>

        {/* View Mode & Zoom Navigation */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={() => setViewMode('continuous')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
              viewMode === 'continuous' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="View all 3 pages continuously"
          >
            All 3 Pages
          </button>
          <button
            type="button"
            onClick={() => setViewMode('p1')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition ${
              viewMode === 'p1' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Page 1
          </button>
          <button
            type="button"
            onClick={() => setViewMode('p2')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition ${
              viewMode === 'p2' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Page 2
          </button>
          <button
            type="button"
            onClick={() => setViewMode('p3')}
            className={`px-2 py-1 text-xs font-medium rounded-md transition ${
              viewMode === 'p3' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Page 3
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
              viewMode === 'split' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
            title="Form editor on left, live A4 sheet on right"
          >
            Split Editor
          </button>
        </div>

        {/* Action Controls & Export Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Preset Samples */}
          <div className="relative inline-block text-left group">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-semibold shadow-xs transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Load Sample</span>
            </button>
            <div className="absolute left-0 sm:right-0 mt-1 w-56 origin-top-right rounded-lg bg-slate-800 border border-slate-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 p-1">
              <button
                type="button"
                onClick={() => onLoadSample('kulwant')}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-amber-300 rounded-md transition"
              >
                <div className="font-semibold">Kulwant Singh (Beawar)</div>
                <div className="text-[10px] text-slate-400">Driving School, GP Patta, 9 Members</div>
              </button>
              <button
                type="button"
                onClick={() => onLoadSample('rajesh')}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-amber-300 rounded-md transition border-t border-slate-700/60"
              >
                <div className="font-semibold">Rajesh Sharma (Jaipur)</div>
                <div className="text-[10px] text-slate-400">Provision Store, Urban, Perfect CIBIL</div>
              </button>
              <button
                type="button"
                onClick={() => onLoadSample('blank')}
                className="w-full text-left px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-700 hover:text-white rounded-md transition border-t border-slate-700/60"
              >
                Blank Form Template
              </button>
            </div>
          </div>

          {/* Clear Button */}
          <button
            onClick={onClear}
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 text-xs font-semibold shadow-xs transition active:scale-95"
            title="Clear all fields"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {/* Font Stylist Toggle */}
          <button
            onClick={() => setFontMode(fontMode === 'script' ? 'formal' : 'script')}
            type="button"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold shadow-xs transition active:scale-95 ${
              fontMode === 'script'
                ? 'bg-blue-950/80 border-blue-500/60 text-blue-300'
                : 'bg-slate-800 border-slate-600 text-slate-300'
            }`}
            title="Toggle between field pen handwriting style and formal digital type"
          >
            {fontMode === 'script' ? (
              <>
                <PenTool className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">Pen Script</span>
              </>
            ) : (
              <>
                <Type className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Formal Type</span>
              </>
            )}
          </button>

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-slate-800 border border-slate-700 rounded-md p-0.5">
            <button
              onClick={() => setZoom(Math.max(0.65, zoom - 0.1))}
              className="p-1 text-slate-400 hover:text-white transition rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-slate-300 font-mono px-1 select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(1.3, zoom + 0.1))}
              className="p-1 text-slate-400 hover:text-white transition rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="p-1 text-slate-400 hover:text-white transition rounded ml-0.5 border-l border-slate-700"
              title="Reset 100%"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            {onFitToWidth && (
              <button
                type="button"
                onClick={onFitToWidth}
                className="px-1.5 py-0.5 text-[10px] text-sky-400 hover:text-white font-medium transition rounded ml-0.5 border-l border-slate-700"
                title="Fit sheet to screen width"
              >
                Fit
              </button>
            )}
          </div>

          <div className="h-5 w-px bg-slate-700 mx-0.5 hidden sm:block"></div>

          {/* Export to Excel */}
          <button
            onClick={onExportExcel}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
            title="Download formatted Excel (.xlsx) file"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Export to Word */}
          <button
            onClick={onExportWord}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
            title="Download formatted Microsoft Word (.doc) document"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Word (.doc)</span>
          </button>

          {/* Print / Save as PDF */}
          <button
            onClick={handlePrint}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md hover:shadow-indigo-500/25 transition active:scale-95 ring-1 ring-white/20"
            title="Direct print to standard A4 (210×297mm) or Save as PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Print to A4 / PDF</span>
          </button>

          {/* Backup / JSON dropdown */}
          <div className="relative inline-block text-left group">
            <button
              type="button"
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs transition"
              title="Backup & Restore Data"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <div className="absolute right-0 mt-1 w-44 origin-top-right rounded-lg bg-slate-800 border border-slate-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 p-1">
              <button
                type="button"
                onClick={onExportJson}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 rounded-md transition flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Save Draft (.json)</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 rounded-md transition flex items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open Draft (.json)</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
