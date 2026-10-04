/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PDReportData, FamilyMember } from './types';
import { sampleKulwantSingh, sampleRajeshSharma, blankReport } from './sampleData';
import { HeaderBar } from './components/HeaderBar';
import { Page1Report } from './components/Page1Report';
import { Page2Report } from './components/Page2Report';
import { Page3Report } from './components/Page3Report';
import { FormEditorSidebar } from './components/FormEditorSidebar';
import { exportToExcel, exportToWord, exportToJson } from './utils/exportUtils';
import { CheckCircle, AlertCircle, Info, ChevronRight } from 'lucide-react';

const STORAGE_KEY = 'sk_finance_pd_report_state_v2';

export default function App() {
  // Load saved state or default to sampleKulwantSingh
  const [reportData, setReportData] = useState<PDReportData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading saved PD report data:', e);
    }
    return sampleKulwantSingh;
  });

  const [zoom, setZoom] = useState<number>(1.0);
  const [fontMode, setFontMode] = useState<'script' | 'formal'>('script');
  const [viewMode, setViewMode] = useState<'continuous' | 'p1' | 'p2' | 'p3' | 'split'>('continuous');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Touch gesture state for pinch-to-zoom
  const pinchRef = React.useRef<{
    initialDist: number;
    initialZoom: number;
    isPinching: boolean;
  }>({
    initialDist: 0,
    initialZoom: 1.0,
    isPinching: false
  });

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      pinchRef.current = {
        initialDist: dist,
        initialZoom: zoom,
        isPinching: true
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchRef.current.isPinching && pinchRef.current.initialDist > 0) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const factor = currentDist / pinchRef.current.initialDist;
      // Allow smooth scale between 50% (0.50) and 250% (2.50)
      const targetZoom = Number(
        Math.min(2.5, Math.max(0.5, pinchRef.current.initialZoom * factor)).toFixed(2)
      );
      setZoom(targetZoom);
    }
  };

  const handleTouchEnd = () => {
    if (pinchRef.current.isPinching) {
      pinchRef.current.isPinching = false;
      pinchRef.current.initialDist = 0;
    }
  };

  // Auto-save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reportData));
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }, [reportData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleFieldChange = <K extends keyof PDReportData>(key: K, value: PDReportData[K]) => {
    setReportData((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleUpdateFamilyMember = (index: number, field: keyof FamilyMember, val: string) => {
    setReportData((prev) => {
      const updated = [...prev.familyMembers];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          [field]: val
        };
      }
      return {
        ...prev,
        familyMembers: updated
      };
    });
  };

  const handleAddFamilyRow = () => {
    setReportData((prev) => ({
      ...prev,
      familyMembers: [
        ...prev.familyMembers,
        {
          id: `${Date.now()}`,
          name: '',
          age: '',
          relation: '',
          business: ''
        }
      ]
    }));
    showToast('New family tree row added');
  };

  const handleRemoveFamilyRow = (index: number) => {
    setReportData((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index)
    }));
  };

  const handleLoadSample = (sampleType: 'kulwant' | 'rajesh' | 'blank') => {
    if (sampleType === 'kulwant') {
      setReportData(sampleKulwantSingh);
      showToast('Loaded Sample: Kulwant Singh (Beawar)');
    } else if (sampleType === 'rajesh') {
      setReportData(sampleRajeshSharma);
      showToast('Loaded Sample: Rajesh Sharma (Jaipur)');
    } else {
      setReportData(blankReport);
      showToast('Loaded Blank Form Template');
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all form fields?')) {
      setReportData(blankReport);
      showToast('All fields cleared');
    }
  };

  const handleExportExcel = () => {
    const res = exportToExcel(reportData);
    showToast(res.message);
  };

  const handleExportWord = () => {
    const res = exportToWord(reportData);
    showToast(res.message);
  };

  const handleExportJson = () => {
    exportToJson(reportData);
    showToast('JSON backup draft downloaded');
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          setReportData(parsed);
          showToast('Draft restored from JSON backup');
        }
      } catch (err) {
        showToast('Invalid JSON file format');
      }
    };
    reader.readAsText(file);
  };

  // Toggle responsive fit-to-screen scale on mobile or desktop
  const handleFitToWidth = () => {
    const viewportWidth = window.innerWidth;
    // 210mm = ~794px at standard 96 DPI
    if (viewportWidth < 820) {
      if (zoom < 0.95) {
        setZoom(1.0);
        showToast('Reset to 100% full view (swipe to pan)');
      } else {
        const calculatedScale = Math.min(1.0, Math.max(0.35, (viewportWidth - 20) / 794));
        setZoom(Number(calculatedScale.toFixed(2)));
        showToast(`Fit to screen: ${Math.round(calculatedScale * 100)}%`);
      }
    } else {
      if (zoom === 1.0) {
        const calculatedScale = Math.min(1.0, Math.max(0.65, (viewportWidth - 48) / 794));
        setZoom(Number(calculatedScale.toFixed(2)));
        showToast(`Fit to screen: ${Math.round(calculatedScale * 100)}%`);
      } else {
        setZoom(1.0);
        showToast('Reset to 100% view');
      }
    }
  };

  // Quick stats calculation
  const totalFamilyCount = reportData.familyMembers.filter(
    (m) => m.name.trim() !== ''
  ).length;

  return (
    <div className={`min-h-screen bg-slate-700 ${fontMode === 'script' ? 'font-script-mode' : ''}`}>
      {/* Top Header Bar */}
      <HeaderBar
        onLoadSample={handleLoadSample}
        onClear={handleClear}
        onExportExcel={handleExportExcel}
        onExportWord={handleExportWord}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        zoom={zoom}
        setZoom={setZoom}
        onFitToWidth={handleFitToWidth}
        fontMode={fontMode}
        setFontMode={setFontMode}
        viewMode={viewMode}
        setViewMode={setViewMode}
        reportData={reportData}
      />

      {/* Floating Scannable Summary Ribbon (Screen Only) */}
      <div className="no-print bg-slate-800/95 border-b border-slate-700/80 px-4 py-1.5 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="font-semibold text-slate-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {reportData.customerName || 'Borrower'} · {reportData.shopNo ? `Shop ${reportData.shopNo}` : 'Unassigned'}
            </span>
            <span className="text-slate-500">|</span>
            <span>Family Members: <strong className="text-slate-200">{totalFamilyCount || '0'}</strong></span>
            <span className="text-slate-500">|</span>
            <span>Applicant CIBIL: <strong className="text-amber-300 font-mono">{reportData.cibilAppScore || 'NA'}</strong></span>
            <span className="text-slate-500">|</span>
            <span>Legal: <strong className="text-slate-200">{reportData.legalStatus}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1 ${
                reportData.recommendation === 'Recommended'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-950/80 text-red-400 border border-red-500/30'
              }`}
            >
              {reportData.recommendation === 'Recommended' ? (
                <CheckCircle className="w-3 h-3 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3 h-3 text-red-400" />
              )}
              {reportData.recommendation}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex w-full max-w-full justify-center overflow-x-hidden min-w-0">
        {/* Split Screen Sidebar Editor */}
        {viewMode === 'split' && (
          <FormEditorSidebar data={reportData} onChange={handleFieldChange} />
        )}

        {/* Paper Document Canvas Outer Scrollable Container */}
        <div
          className="flex-1 min-w-0 w-full max-w-full overflow-x-auto p-2 sm:p-4 mobile-sheet-viewport flex flex-col items-center"
          style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {/* Mobile quick scroll/fit hint bar */}
          <div className="no-print sm:hidden w-full max-w-[210mm] flex items-center justify-between bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 mb-2 text-[11px] text-slate-300 shadow-sm">
            <span>
              Scale: <strong className="text-white font-mono">{Math.round(zoom * 100)}%</strong> · Pinch with 2 fingers to zoom
            </span>
            <button
              type="button"
              onClick={handleFitToWidth}
              className="text-sky-300 hover:text-white font-semibold underline ml-2"
            >
              {zoom < 0.95 ? '100% Size' : 'Fit Screen'}
            </button>
          </div>

          <div
            className="flex flex-col items-center justify-start transition-size duration-75"
            style={{
              width: `${Math.round(794 * zoom)}px`,
              minWidth: `${Math.round(794 * zoom)}px`,
              touchAction: 'pan-x pan-y pinch-zoom'
            }}
          >
            <main
              className="flex flex-col items-center justify-start py-2 sm:py-4 transition-transform duration-75"
              style={{
                transform: zoom !== 1.0 ? `scale(${zoom})` : undefined,
                transformOrigin: 'top center',
                width: '210mm',
                touchAction: 'pan-x pan-y pinch-zoom'
              }}
            >
          {/* Continuous Mode (All 3 Pages) */}
          {(viewMode === 'continuous' || viewMode === 'split') && (
            <div className="space-y-6">
              <Page1Report data={reportData} onChange={handleFieldChange} />
              <Page2Report
                data={reportData}
                onChange={handleFieldChange}
                onUpdateFamilyMember={handleUpdateFamilyMember}
                onAddFamilyRow={handleAddFamilyRow}
                onRemoveFamilyRow={handleRemoveFamilyRow}
              />
              <Page3Report data={reportData} onChange={handleFieldChange} />
            </div>
          )}

          {/* Single Page Tab: Page 1 */}
          {viewMode === 'p1' && (
            <div>
              <Page1Report data={reportData} onChange={handleFieldChange} />
              <div className="no-print mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewMode('p2')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow transition"
                >
                  <span>Proceed to Page 2 (Family Tree)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Single Page Tab: Page 2 */}
          {viewMode === 'p2' && (
            <div>
              <Page2Report
                data={reportData}
                onChange={handleFieldChange}
                onUpdateFamilyMember={handleUpdateFamilyMember}
                onAddFamilyRow={handleAddFamilyRow}
                onRemoveFamilyRow={handleRemoveFamilyRow}
              />
              <div className="no-print mt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setViewMode('p1')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold shadow transition"
                >
                  ← Back to Page 1
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('p3')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow transition"
                >
                  <span>Proceed to Page 3 (CIBIL & Sign)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Single Page Tab: Page 3 */}
          {viewMode === 'p3' && (
            <div>
              <Page3Report data={reportData} onChange={handleFieldChange} />
              <div className="no-print mt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setViewMode('p2')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold shadow transition"
                >
                  ← Back to Page 2
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow transition"
                >
                  Print / Save as PDF
                </button>
              </div>
            </div>
          )}
        </main>
          </div>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-slate-900/95 border border-slate-700 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
