import React from 'react';
import {
  AlertTriangle,
  X,
  ShieldAlert,
  ArrowRight,
  Hash,
  Phone,
  RefreshCw,
  Sparkles,
  CloudDownload,
  FolderOpen
} from 'lucide-react';
import { SavedReportRecord } from '../types';

export interface DuplicateAlertInfo {
  field: 'skop' | 'mobile';
  value: string;
  conflictingCustomer: string;
  conflictingReportId: string;
  conflictingDate?: string;
  message?: string;
  conflictingRecord?: SavedReportRecord;
}

interface DuplicateWarningModalProps {
  isOpen: boolean;
  alertInfo: DuplicateAlertInfo | null;
  onClose: () => void;
  onOpenSavedReports?: () => void;
  onUpdateExisting?: (reportId: string) => void;
  onAutoFixSkop?: () => void;
  onLoadExisting?: (reportId: string) => void;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  isOpen,
  alertInfo,
  onClose,
  onOpenSavedReports,
  onUpdateExisting,
  onAutoFixSkop,
  onLoadExisting
}) => {
  if (!isOpen || !alertInfo) return null;

  const isSkop = alertInfo.field === 'skop';
  const title = isSkop ? 'Duplicate SKOP Number Detected' : 'Duplicate Verified Mobile Number Detected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden text-slate-100 ring-4 ring-amber-500/20">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                Validation Notice · Action Required
              </span>
              <h3 className="font-bold text-base text-white">{title}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Conflicting Value Card */}
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isSkop ? (
                <Hash className="w-4 h-4 text-amber-400" />
              ) : (
                <Phone className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-xs text-slate-300 font-medium">
                Entered {isSkop ? 'SKOP Number' : 'Verified Mobile'}:
              </span>
            </div>
            <span className="text-sm font-bold font-mono text-amber-200 bg-amber-900/60 px-2.5 py-0.5 rounded border border-amber-500/50">
              {alertInfo.value}
            </span>
          </div>

          {/* Existing Customer Match Details */}
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-400">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Existing Cloud Record Found</span>
              </div>
              <span className="text-slate-500 font-normal">Firestore Database</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-800/80">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Registered Customer
                </span>
                <span className="font-semibold text-white text-sm">
                  {alertInfo.conflictingCustomer || 'Existing Customer'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  Existing Report ID
                </span>
                <span className="font-mono text-slate-300 text-xs">
                  {alertInfo.conflictingReportId}
                </span>
              </div>

              {alertInfo.conflictingDate && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Report Date
                  </span>
                  <span className="text-slate-300 font-medium">
                    {alertInfo.conflictingDate}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Resolution Options */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Choose How to Proceed:
            </span>

            <div className="grid grid-cols-1 gap-2">
              {/* Option 1: Update Existing Report */}
              {onUpdateExisting && (
                <button
                  type="button"
                  onClick={() => onUpdateExisting(alertInfo.conflictingReportId)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/40 hover:border-blue-400 text-left transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-blue-300 group-hover:text-blue-200">
                        Update Existing Report ({alertInfo.conflictingReportId})
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Save current edits into this customer's existing database record
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition" />
                </button>
              )}

              {/* Option 2: Generate New Unique SKOP */}
              {isSkop && onAutoFixSkop && (
                <button
                  type="button"
                  onClick={onAutoFixSkop}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 hover:border-emerald-400 text-left transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
                        Auto-Assign New SKOP & Save as Separate Report
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Generates a fresh unique 8-digit SKOP number and saves immediately
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition" />
                </button>
              )}

              {/* Option 3: Load Existing Report from Cloud */}
              {onLoadExisting && (
                <button
                  type="button"
                  onClick={() => onLoadExisting(alertInfo.conflictingReportId)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-left transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-700/50 border border-slate-600 flex items-center justify-center text-slate-300 shrink-0 group-hover:scale-105 transition">
                      <CloudDownload className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">
                        Load Existing Cloud Report into Editor
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Discard current changes and pull original saved data for editing
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {onOpenSavedReports ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSavedReports();
              }}
              className="w-full sm:w-auto px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Browse All Saved Reports</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/80 transition"
          >
            Edit SKOP Field Manually
          </button>
        </div>
      </div>
    </div>
  );
};
