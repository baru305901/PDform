import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  X,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  AlertCircle,
  HelpCircle,
  Send,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldCheck,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import {
  getGoogleSheetsWebhookUrl,
  setGoogleSheetsWebhookUrl,
  getGoogleSheetsAutoSync,
  setGoogleSheetsAutoSync,
  getLastSyncInfo,
  syncReportToGoogleSheets,
  SAMPLE_APPS_SCRIPT_CODE,
  LastSyncInfo
} from '../services/googleSheets';
import { PDReportData } from '../types';
import { OfficerSession } from './BranchOfficerModal';

interface GoogleSheetsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: PDReportData;
  activeOfficerSession?: OfficerSession | null;
  currentReportId?: string | null;
  onSyncSuccess?: (message: string) => void;
  onSyncError?: (error: string) => void;
}

export const GoogleSheetsSettingsModal: React.FC<GoogleSheetsSettingsModalProps> = ({
  isOpen,
  onClose,
  reportData,
  activeOfficerSession,
  currentReportId,
  onSyncSuccess,
  onSyncError
}) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [autoSync, setAutoSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });
  const [copiedCode, setCopiedCode] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [lastSync, setLastSync] = useState<LastSyncInfo | null>(null);

  useEffect(() => {
    if (isOpen) {
      setWebhookUrl(getGoogleSheetsWebhookUrl());
      setAutoSync(getGoogleSheetsAutoSync());
      setLastSync(getLastSyncInfo());
      setSyncStatus({ type: 'idle' });
      setCopiedCode(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    const clean = webhookUrl.trim();
    setGoogleSheetsWebhookUrl(clean);
    setGoogleSheetsAutoSync(autoSync);
    setSyncStatus({
      type: 'success',
      message: '✓ Webhook URL and preferences saved successfully!'
    });
    setTimeout(() => {
      setSyncStatus({ type: 'idle' });
    }, 3000);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLE_APPS_SCRIPT_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // Fallback
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleTriggerSync = async () => {
    const cleanUrl = webhookUrl.trim();
    if (!cleanUrl) {
      setSyncStatus({
        type: 'error',
        message: 'Please paste your Google Apps Script Web App URL first.'
      });
      return;
    }

    // Save URL first
    setGoogleSheetsWebhookUrl(cleanUrl);
    setGoogleSheetsAutoSync(autoSync);

    setIsSyncing(true);
    setSyncStatus({ type: 'idle' });

    try {
      const result = await syncReportToGoogleSheets(
        reportData,
        cleanUrl,
        activeOfficerSession,
        currentReportId
      );
      setSyncStatus({
        type: 'success',
        message: result.message
      });
      setLastSync(getLastSyncInfo());
      onSyncSuccess?.(result.message);
    } catch (err: any) {
      const msg = err?.message || 'Failed to sync to Google Sheet';
      setSyncStatus({
        type: 'error',
        message: msg
      });
      setLastSync(getLastSyncInfo());
      onSyncError?.(msg);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-100 ring-1 ring-white/10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Sync to Google Sheets</span>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Apps Script Webhook
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Append complete PD report data directly to your Google Spreadsheet
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status Alert Banner */}
          {syncStatus.type !== 'idle' && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                syncStatus.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                  : 'bg-red-950/70 border-red-500/40 text-red-200'
              }`}
            >
              {syncStatus.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className="font-medium">{syncStatus.message}</span>
            </div>
          )}

          {/* Webhook URL Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span>Google Apps Script Web App URL</span>
                <span className="text-emerald-400 font-bold">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showInstructions ? 'Hide Setup Guide' : 'How to get this URL?'}</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => {
                  setWebhookUrl(e.target.value);
                  setSyncStatus({ type: 'idle' });
                }}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
              />
              {webhookUrl && (
                <button
                  type="button"
                  onClick={() => setWebhookUrl('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                  title="Clear URL"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Paste the Web App deployment URL from your Google Sheet&apos;s Apps Script project (must end in <code className="text-emerald-300 font-mono">/exec</code>).
            </p>
          </div>

          {/* Auto-Sync Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-xl">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Auto-Sync to Google Sheet on Save</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-semibold border border-emerald-500/30">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Whenever you click &quot;Save Report&quot; or update in the database, automatically append the latest data to your sheet.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextVal = !autoSync;
                setAutoSync(nextVal);
                setGoogleSheetsAutoSync(nextVal);
              }}
              className="text-slate-300 hover:text-white transition p-1"
              title={autoSync ? 'Click to disable auto-sync' : 'Click to enable auto-sync'}
            >
              {autoSync ? (
                <ToggleRight className="w-8 h-8 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-500" />
              )}
            </button>
          </div>

          {/* Current Report Summary Preview */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Ready to Sync Current Report:</span>
              <span className="text-emerald-400 font-medium">32 Columns Mapped</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-slate-300">
              <div>
                <span className="text-slate-500 text-[10px] block">Customer</span>
                <strong className="text-white truncate block">{reportData.customerName || 'Unnamed'}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">SKOP Number</span>
                <strong className="text-amber-300 font-mono block">{reportData.shopNo || 'None'}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Officer / Branch</span>
                <span className="text-slate-200 block truncate">
                  {reportData.officerName || activeOfficerSession?.officerName || 'Officer'} (
                  {reportData.branchName || activeOfficerSession?.branchName || 'Beawar'})
                </span>
              </div>
            </div>
          </div>

          {/* Step-by-Step Instructions & Apps Script Code (Collapsible) */}
          {showInstructions && (
            <div className="space-y-3 p-4 bg-slate-950/90 border border-slate-800 rounded-xl text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  2-Minute Setup in Google Sheets
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition shadow-xs"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied Code!' : 'Copy Apps Script Code'}</span>
                </button>
              </div>

              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                <li>Create or open a Google Sheet in your Google Drive.</li>
                <li>In Google Sheets menu, click <strong className="text-white">Extensions &gt; Apps Script</strong>.</li>
                <li>Delete everything inside <code className="text-amber-300 font-mono">Code.gs</code> and paste the copied code below.</li>
                <li>Click the <strong className="text-white">Deploy &gt; New deployment</strong> button (top right).</li>
                <li>Select type: <strong className="text-white">Web app</strong>.</li>
                <li>Set <strong className="text-emerald-300">Execute as: Me</strong> and <strong className="text-emerald-300">Who has access: Anyone</strong> (required).</li>
                <li>Click <strong className="text-white">Deploy</strong>, authorize permissions, and copy the generated <strong className="text-emerald-300">Web app URL</strong>.</li>
                <li>Paste that URL into the input field above and click &quot;Sync Current Report Now&quot;!</li>
              </ol>

              {/* Code Box */}
              <div className="relative pt-2">
                <div className="text-[10px] text-slate-500 font-mono uppercase pb-1 flex justify-between items-center">
                  <span>Code.gs Snippet:</span>
                  <span className="text-slate-400">Handles auto-headers &amp; concurrency locking</span>
                </div>
                <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-emerald-300 font-mono overflow-x-auto max-h-44 scrollbar-thin">
                  {SAMPLE_APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>
          )}

          {/* Last Sync Info */}
          {lastSync && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800/60">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Last Sync Attempt:</span>
                <span className="text-slate-300">
                  {new Date(lastSync.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({lastSync.skopNumber || 'No SKOP'})
                </span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                  lastSync.status === 'success'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-950 text-red-300 border border-red-500/30'
                }`}
              >
                {lastSync.status === 'success' ? '✓ Synced' : 'Sync Error'}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSaveSettings}
            className="text-xs text-slate-300 hover:text-white font-medium order-2 sm:order-1 transition"
          >
            Save URL Only
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-900/40 disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Syncing to Sheet...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Sync Current Report Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
