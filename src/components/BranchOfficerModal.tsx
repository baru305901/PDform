import React, { useState, useEffect } from 'react';
import { Building2, User, Check, ArrowRight, ShieldCheck, Sparkles, X, LogOut } from 'lucide-react';

export interface OfficerSession {
  branchName: string;
  officerName: string;
}

export const COMMON_BRANCHES = [
  'Beawar',
  'Kekri',
  'Bhim',
  'Jaitaran',
  'Ajmer',
  'Jaipur'
];

export const COMMON_OFFICERS = [
  'Manish Kumar',
  'Dinesh Jangid',
  'Sandeep Parik',
  'Avinash',
  'Credit Officer'
];

export const OFFICER_SESSION_STORAGE_KEY = 'sk_finance_active_officer_session';

export function getStoredOfficerSession(): OfficerSession | null {
  try {
    const raw = localStorage.getItem(OFFICER_SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const rawOfficer = parsed.officerName || parsed.officer_name || '';
        const officerName = rawOfficer.replace(/Kuamar/gi, 'Kumar').trim();
        const branchName = (parsed.branchName || parsed.branch_name || '').trim();
        const session = { branchName, officerName };
        // If it was misspelled Kuamar in localStorage, immediately update it to Kumar
        if (rawOfficer.includes('Kuamar')) {
          saveStoredOfficerSession(session);
        }
        return session;
      }
    }
  } catch (e) {
    console.warn('Error reading officer session:', e);
  }
  return null;
}

export function saveStoredOfficerSession(session: OfficerSession): void {
  try {
    const sanitized: OfficerSession = {
      branchName: session.branchName.trim(),
      officerName: session.officerName.replace(/Kuamar/gi, 'Kumar').trim()
    };
    localStorage.setItem(OFFICER_SESSION_STORAGE_KEY, JSON.stringify(sanitized));
  } catch (e) {
    console.warn('Error saving officer session:', e);
  }
}

export function clearStoredOfficerSession(): void {
  try {
    localStorage.removeItem(OFFICER_SESSION_STORAGE_KEY);
  } catch (e) {
    console.warn('Error clearing officer session:', e);
  }
}

interface BranchOfficerModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onConfirm: (session: OfficerSession) => void;
  onLogout?: () => void;
  initialSession?: OfficerSession | null;
  mode?: 'startup' | 'new_sheet' | 'switch';
}

export const BranchOfficerModal: React.FC<BranchOfficerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onLogout,
  initialSession,
  mode = 'startup'
}) => {
  const [branchName, setBranchName] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const existing = initialSession || getStoredOfficerSession();
      if (existing) {
        setBranchName(existing.branchName || '');
        setOfficerName((existing.officerName || '').replace(/Kuamar/gi, 'Kumar'));
      } else {
        setBranchName('Beawar');
        setOfficerName('Manish Kumar');
      }
      setError(null);
    }
  }, [isOpen, initialSession]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanBranch = branchName.trim();
    const cleanOfficer = officerName.trim();

    if (!cleanBranch) {
      setError('Please enter or select a Branch Name');
      return;
    }
    if (!cleanOfficer) {
      setError('Please enter or select an Officer Name');
      return;
    }

    const session: OfficerSession = {
      branchName: cleanBranch,
      officerName: cleanOfficer
    };

    saveStoredOfficerSession(session);
    onConfirm(session);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-100 ring-1 ring-white/10">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Branch & Officer Entry</span>
                <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  No Password Required
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'new_sheet'
                  ? 'Confirm branch & officer details for this new PD report'
                  : mode === 'switch'
                  ? 'Switch active branch or credit officer for subsequent reports'
                  : 'Welcome! Identify your branch and officer for tagged PD visit reports'}
              </p>
            </div>
          </div>

          {onClose && mode !== 'startup' && (
            <button
              onClick={onClose}
              type="button"
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="px-3 py-2 bg-red-950/60 border border-red-500/40 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span>{error}</span>
            </div>
          )}

          {/* Branch Name Field */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                Branch Name
              </span>
              <span className="text-[11px] font-normal text-slate-500">Pick below or type custom</span>
            </label>

            <input
              type="text"
              value={branchName}
              onChange={(e) => {
                setBranchName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Kekri, Bhim, Beawar, Jaitaran..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
              autoFocus={!branchName}
            />

            {/* Quick Pick Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mr-1">Quick Select:</span>
              {COMMON_BRANCHES.map((b) => {
                const isSelected = branchName.trim().toLowerCase() === b.toLowerCase();
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      setBranchName(b);
                      setError(null);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition active:scale-95 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-xs ring-1 ring-blue-400/50'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Officer Name Field */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Officer Name
              </span>
              <span className="text-[11px] font-normal text-slate-500">Pick below or type custom</span>
            </label>

            <input
              type="text"
              value={officerName}
              onChange={(e) => {
                setOfficerName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Manish Kumar, Dinesh Jangid, Sandeep Parik..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
            />

            {/* Quick Pick Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mr-1">Quick Select:</span>
              {COMMON_OFFICERS.map((off) => {
                const isSelected = officerName.trim().toLowerCase() === off.toLowerCase();
                return (
                  <button
                    key={off}
                    type="button"
                    onClick={() => {
                      setOfficerName(off);
                      setError(null);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition active:scale-95 ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-xs ring-1 ring-indigo-400/50'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                  >
                    {off}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Informational reassurance notice */}
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-start gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Every PD report you save will be automatically tagged with <strong className="text-slate-200">{branchName || 'Branch'}</strong> and <strong className="text-slate-200">{officerName || 'Officer'}</strong>. Saved reports can be filtered by officer in the database so work from different team members never gets mixed up.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2.5">
            {onLogout && mode === 'switch' ? (
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2 text-xs font-semibold text-red-300 hover:text-white bg-red-950/40 hover:bg-red-900/60 rounded-xl border border-red-500/40 transition flex items-center gap-1.5"
                title="Log out and reset session to clean slate"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out Session</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {onClose && mode !== 'startup' && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition active:scale-95 inline-flex items-center gap-2 ring-1 ring-white/20"
              >
                <span>{mode === 'new_sheet' ? 'Start New Sheet' : 'Proceed to PD Report'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
