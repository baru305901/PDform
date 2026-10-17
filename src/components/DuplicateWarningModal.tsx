import React from 'react';
import { AlertTriangle, X, ShieldAlert, ArrowRight, UserCheck, Calendar, Hash, Phone } from 'lucide-react';

export interface DuplicateAlertInfo {
  field: 'skop' | 'mobile';
  value: string;
  conflictingCustomer: string;
  conflictingReportId: string;
  conflictingDate?: string;
  message?: string;
}

interface DuplicateWarningModalProps {
  isOpen: boolean;
  alertInfo: DuplicateAlertInfo | null;
  onClose: () => void;
  onOpenSavedReports?: () => void;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  isOpen,
  alertInfo,
  onClose,
  onOpenSavedReports
}) => {
  if (!isOpen || !alertInfo) return null;

  const isSkop = alertInfo.field === 'skop';
  const title = isSkop ? 'Duplicate SKOP Number' : 'Duplicate Verified Mobile Number';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-red-500/80 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-100 ring-4 ring-red-500/20">
        {/* Danger Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 border-b border-red-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block">
                Validation Warning · Save Blocked
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
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isSkop ? (
                <Hash className="w-4 h-4 text-amber-400" />
              ) : (
                <Phone className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-xs text-slate-300 font-medium">
                Attempted {isSkop ? 'SKOP Number' : 'Verified Mobile'}:
              </span>
            </div>
            <span className="text-sm font-bold font-mono text-white bg-red-900/60 px-2.5 py-0.5 rounded border border-red-500/50">
              {alertInfo.value}
            </span>
          </div>

          {/* Existing Customer Match Details */}
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Already Exists in Database</span>
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
                  Report ID in Firestore
                </span>
                <span className="font-mono text-slate-300">
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

          {/* Underwriting Policy Note */}
          <div className="text-xs text-slate-400 leading-relaxed bg-slate-800/40 p-3 rounded-lg border border-slate-700/60">
            <strong className="text-slate-200">SK Finance Policy Notice:</strong> To ensure strict data integrity and prevent cross-borrower mixing, each personal discussion report must have a distinct SKOP Number and verified contact number. This report cannot be saved or updated until the duplicate is corrected.
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          {onOpenSavedReports && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSavedReports();
              }}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
            >
              View In Saved Reports
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-md hover:shadow-red-500/25 transition flex items-center justify-center gap-1.5"
          >
            <span>Review & Edit Field</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
