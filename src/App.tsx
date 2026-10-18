/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PDReportData, FamilyMember, SavedReportRecord } from './types';
import { sampleKulwantSingh, sampleRajeshSharma, blankReport } from './sampleData';
import { HeaderBar } from './components/HeaderBar';
import { Page1Report } from './components/Page1Report';
import { Page2Report } from './components/Page2Report';
import { Page3Report } from './components/Page3Report';
import { FormEditorSidebar } from './components/FormEditorSidebar';
import { SavedReportsModal } from './components/SavedReportsModal';
import { UploadReportModal } from './components/UploadReportModal';
import { DuplicateWarningModal, DuplicateAlertInfo } from './components/DuplicateWarningModal';
import { BranchOfficerModal, OfficerSession, getStoredOfficerSession } from './components/BranchOfficerModal';
import {
  saveReport,
  fetchAllReports,
  testConnection,
  DuplicateReportError,
  subscribeToSavedReports,
  getLocalCache,
  isSkopMatch,
  generateUniqueSkop
} from './services/firebase';
import { exportToExcel, exportToWord, exportToJson } from './utils/exportUtils';
import { CheckCircle, AlertCircle, Info, ChevronRight } from 'lucide-react';

const STORAGE_KEY = 'sk_finance_pd_report_state_v2';
const ACTIVE_REPORT_ID_KEY = 'sk_finance_active_report_id';

export default function App() {
  const [currentReportId, setCurrentReportId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_REPORT_ID_KEY) || null;
    } catch {
      return null;
    }
  });
  const [isReportModified, setIsReportModified] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSavedReportsModalOpen, setIsSavedReportsModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [duplicateAlert, setDuplicateAlert] = useState<DuplicateAlertInfo | null>(null);
  const [savedReportsCount, setSavedReportsCount] = useState<number>(0);
  const [officerSession, setOfficerSession] = useState<OfficerSession | null>(getStoredOfficerSession);
  const [isOfficerModalOpen, setIsOfficerModalOpen] = useState<boolean>(false);
  const [officerModalMode, setOfficerModalMode] = useState<'startup' | 'new_sheet' | 'switch'>('startup');
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

  // Keep active report ID in storage
  useEffect(() => {
    try {
      if (currentReportId) {
        localStorage.setItem(ACTIVE_REPORT_ID_KEY, currentReportId);
      } else {
        localStorage.removeItem(ACTIVE_REPORT_ID_KEY);
      }
    } catch (e) {
      console.error('Error saving active report id:', e);
    }
  }, [currentReportId]);

  // Real-time Firestore subscription & storage listener for exact Saved Reports count
  useEffect(() => {
    testConnection();

    // 1. Initial count immediately from partition local cache (0ms latency)
    const initialRecords = getLocalCache();
    setSavedReportsCount(initialRecords.length);

    // 2. Real-time Firestore snapshot subscription strictly isolated to current officer's partition
    const unsubscribe = subscribeToSavedReports((records) => {
      setSavedReportsCount(records.length);
    }, officerSession);

    // 3. Listen to local storage & cache update events for instant offline updates
    const handleLocalUpdate = (e: any) => {
      const count = e?.detail?.count ?? getLocalCache().length;
      setSavedReportsCount(count);
    };

    window.addEventListener('sk_reports_changed', handleLocalUpdate);
    window.addEventListener('storage', handleLocalUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('sk_reports_changed', handleLocalUpdate);
      window.removeEventListener('storage', handleLocalUpdate);
    };
  }, [officerSession]);

  // Check on boot if officer session exists; if not, open startup prompt
  useEffect(() => {
    const existing = getStoredOfficerSession();
    if (!existing) {
      setOfficerModalMode('startup');
      setIsOfficerModalOpen(true);
    }
  }, []);

  // Browser warn on reload/leave if report has unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isReportModified) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isReportModified]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleFieldChange = <K extends keyof PDReportData>(key: K, value: PDReportData[K]) => {
    setIsReportModified(true);
    setReportData((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleUpdateFamilyMember = (index: number, field: keyof FamilyMember, val: string) => {
    setIsReportModified(true);
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
    setIsReportModified(true);
    setReportData((prev) => ({
      ...prev,
      familyMembers: [
        ...prev.familyMembers,
        {
          id: `${Date.now()}`,
          name: '',
          prefix: '',
          guardianName: '',
          age: '',
          relation: '',
          business: ''
        }
      ]
    }));
    showToast('New family tree row added');
  };

  const handleRemoveFamilyRow = (index: number) => {
    setIsReportModified(true);
    setReportData((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index)
    }));
  };

  const handleSaveReport = async (overrideReportId?: string | any, overrideReportData?: PDReportData) => {
    if (isSaving) return;
    setIsSaving(true);
    // Guard against React SyntheticEvent objects when invoked directly from onClick
    const validOverrideId =
      typeof overrideReportId === 'string' && overrideReportId.trim() ? overrideReportId.trim() : undefined;
    const dataToSave =
      overrideReportData && typeof overrideReportData === 'object' && !('nativeEvent' in (overrideReportData as any))
        ? overrideReportData
        : reportData;
    const targetId = validOverrideId !== undefined ? validOverrideId : (currentReportId || undefined);

    try {
      const savedRecord = await saveReport(
        dataToSave,
        targetId,
        officerSession || undefined
      );
      setCurrentReportId(savedRecord.id);
      setIsReportModified(false);
      setDuplicateAlert(null);
      showToast(
        `✓ Report saved to database! (Tagged: ${savedRecord.officerName || 'Officer'}, ID: ${savedRecord.id})`
      );
    } catch (err: any) {
      if (err instanceof DuplicateReportError || err?.name === 'DuplicateReportError') {
        console.warn('Duplicate report check triggered:', err.message);
        setDuplicateAlert({
          field: err.field,
          value: err.value,
          conflictingCustomer: err.conflictingCustomer,
          conflictingReportId: err.conflictingReportId,
          conflictingDate: err.conflictingDate,
          message: err.message,
          conflictingRecord: err.conflictingRecord
        });
        showToast(`Duplicate ${err.field === 'skop' ? 'SKOP Number' : 'Mobile Number'} detected. Choose how to proceed.`);
      } else {
        console.error('Error saving report to database:', err);
        showToast(`Failed to save report: ${err?.message || err}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoFixSkop = async () => {
    const newSkop = generateUniqueSkop(reportData.shopNo);
    const updatedData = { ...reportData, shopNo: newSkop };
    setReportData(updatedData);
    setDuplicateAlert(null);
    showToast(`✓ Generated fresh unique SKOP: ${newSkop}. Saving report...`);
    await handleSaveReport(undefined, updatedData);
  };

  const handleLoadExisting = async (reportId: string) => {
    const cached = getLocalCache();
    const existing = cached.find((r) => r.id === reportId);
    if (existing && existing.reportData) {
      setReportData(existing.reportData);
      setCurrentReportId(existing.id);
      setIsReportModified(false);
      setDuplicateAlert(null);
      showToast(`✓ Loaded cloud report (ID: ${existing.id}) for ${existing.customerName}`);
    } else {
      const all = await fetchAllReports(officerSession, true);
      const found = all.find((r) => r.id === reportId);
      if (found && found.reportData) {
        setReportData(found.reportData);
        setCurrentReportId(found.id);
        setIsReportModified(false);
        setDuplicateAlert(null);
        showToast(`✓ Loaded cloud report (ID: ${found.id}) for ${found.customerName}`);
      }
    }
  };

  const handleLoadReportFromUpload = async (data: PDReportData, autoSaveToDb: boolean = false) => {
    // Auto-tag with active officer & branch if available
    const taggedData: PDReportData = {
      ...data,
      branchName: data.branchName || officerSession?.branchName || '',
      officerName: data.officerName || officerSession?.officerName || '',
      branch_name: data.branch_name || officerSession?.branchName || '',
      officer_name: data.officer_name || officerSession?.officerName || '',
      pdAuthorisedPerson: data.pdAuthorisedPerson || officerSession?.officerName || ''
    };

    // 1. Populate all form inputs across the report editor
    setReportData(taggedData);
    setIsReportModified(true);

    if (autoSaveToDb) {
      setIsSaving(true);
      try {
        const savedRecord = await saveReport(taggedData, undefined, officerSession || undefined);
        setCurrentReportId(savedRecord.id);
        setIsReportModified(false);
        showToast(`✓ Report for "${taggedData.customerName || 'Applicant'}" uploaded and saved! (ID: ${savedRecord.id})`);
      } catch (err: any) {
        if (err instanceof DuplicateReportError || err?.name === 'DuplicateReportError') {
          console.warn('Duplicate report check triggered during upload:', err.message);
          setDuplicateAlert({
            field: err.field,
            value: err.value,
            conflictingCustomer: err.conflictingCustomer,
            conflictingReportId: err.conflictingReportId,
            conflictingDate: err.conflictingDate,
            message: err.message,
            conflictingRecord: err.conflictingRecord
          });
          showToast(`Report loaded into form, but database save was blocked: Duplicate ${err.field === 'skop' ? 'SKOP' : 'Mobile'} detected.`);
        } else {
          console.error('Error saving uploaded report:', err);
          showToast(`Report loaded into form, but database save failed: ${err?.message || err}`);
        }
      } finally {
        setIsSaving(false);
      }
    } else {
      // User opted to review and edit fields before saving
      setCurrentReportId(null);
      setIsReportModified(true);
      showToast(`✓ Report for "${taggedData.customerName || 'Applicant'}" loaded. Review, edit fields, then click "Save Report".`);
    }

    // Scroll to top of preview sheet so user can review immediately
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenReport = (record: SavedReportRecord) => {
    if (isReportModified) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes in the current report. Do you want to open this saved report anyway?'
      );
      if (!confirmDiscard) return;
    }

    setReportData(record.reportData);
    setCurrentReportId(record.id);
    setIsReportModified(false);
    showToast(`✓ Loaded Report: ${record.customerName || 'Applicant'} (${record.id})`);
  };

  const executeStartNewSheet = (session: OfficerSession) => {
    setReportData({
      ...blankReport,
      shopNo: '',
      customerName: '',
      visitDate: new Date().toLocaleDateString('en-GB'),
      visitLocation: '',
      propertyAddress: '',
      permanentAddress: '',
      contactNumbers: '',
      distNearestBranch: '',
      distSourcingBranch: session.branchName || '',
      branchName: session.branchName || '',
      officerName: session.officerName || '',
      branch_name: session.branchName || '',
      officer_name: session.officerName || '',
      businessNameAddress: '',
      businessVintage: '',
      monthlyIncomeDetails: '',
      considerIncomeDetails: '',
      neighbourRef1: '',
      neighbourRef2: '',
      businessRef1: '',
      businessRef2: '',
      familyMembers: Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        name: '',
        prefix: '',
        guardianName: '',
        age: '',
        relation: '',
        business: ''
      })),
      masterTreeNotes: '',
      guarantorDetail: 'Guarantor Not Add at PD Visit Time',
      cibilAppName: '',
      cibilAppScore: '',
      cibilCoApp1Name: '',
      cibilCoApp1Score: '',
      cibilCoApp2Name: '',
      cibilCoApp2Score: '',
      cibilCoApp3Name: '',
      cibilCoApp3Score: '',
      existingLoans: '',
      runningObligations: '',
      assetVehicleDetails: '',
      legalStatus: 'Perfect',
      propertyTitle: '',
      propertyOwner: '',
      electricityDetails: '',
      marketValue: '',
      endUseLoan: '',
      monthlyEmiPaid: '',
      waiver: '',
      requiredDocs: '',
      deviationFindings: '',
      remarksNotes: '',
      mitigateNotes: '',
      pdAuthorisedPerson: session.officerName || '',
      signatureDataUrl: '',
      signDate: new Date().toLocaleDateString('en-GB')
    });
    setCurrentReportId(null);
    setIsReportModified(false);
    showToast(`✓ Started fresh blank PD sheet for ${session.officerName} (${session.branchName})`);
  };

  const handleNewReport = () => {
    if (isReportModified) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes. Start a new sheet?'
      );
      if (!confirmDiscard) return;
    }

    // Display lightweight Branch & Officer entry modal on New Sheet
    setOfficerModalMode('new_sheet');
    setIsOfficerModalOpen(true);
  };

  const handleConfirmOfficerSession = (session: OfficerSession) => {
    setOfficerSession(session);
    setIsOfficerModalOpen(false);

    if (officerModalMode === 'new_sheet') {
      executeStartNewSheet(session);
    } else if (officerModalMode === 'startup') {
      // Auto-tag current report if it lacks branch/officer
      setReportData((prev) => ({
        ...prev,
        branchName: prev.branchName || session.branchName,
        officerName: prev.officerName || session.officerName,
        branch_name: prev.branch_name || session.branchName,
        officer_name: prev.officer_name || session.officerName,
        pdAuthorisedPerson: prev.pdAuthorisedPerson || session.officerName
      }));
      showToast(`Welcome ${session.officerName} · Branch: ${session.branchName}`);
    } else {
      // mode === 'switch'
      setReportData((prev) => ({
        ...prev,
        branchName: session.branchName,
        officerName: session.officerName,
        branch_name: session.branchName,
        officer_name: session.officerName,
        pdAuthorisedPerson: prev.pdAuthorisedPerson || session.officerName
      }));
      showToast(`Switched active officer to ${session.officerName} (${session.branchName})`);
    }
  };

  const handleLoadSample = (sampleType: 'kulwant' | 'rajesh' | 'blank') => {
    if (isReportModified) {
      const confirm = window.confirm('You have unsaved changes. Discard and load sample report?');
      if (!confirm) return;
    }
    setDuplicateAlert(null);
    setIsReportModified(false);

    const cached = getLocalCache();
    if (sampleType === 'kulwant') {
      const existing = cached.find((r) => isSkopMatch(r.shopNo, sampleKulwantSingh.shopNo));
      setCurrentReportId(existing ? existing.id : null);
      setReportData(sampleKulwantSingh);
      showToast('Loaded Sample: Kulwant Singh (Beawar)');
    } else if (sampleType === 'rajesh') {
      const existing = cached.find((r) => isSkopMatch(r.shopNo, sampleRajeshSharma.shopNo));
      setCurrentReportId(existing ? existing.id : null);
      setReportData(sampleRajeshSharma);
      showToast('Loaded Sample: Rajesh Sharma (Jaipur)');
    } else {
      setCurrentReportId(null);
      setReportData(blankReport);
      showToast('Loaded Blank Form Template');
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all form fields?')) {
      setReportData(blankReport);
      setCurrentReportId(null);
      setIsReportModified(false);
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
        onNewReport={handleNewReport}
        onSaveReport={() => handleSaveReport()}
        onOpenSavedReports={() => setIsSavedReportsModalOpen(true)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        isSavingReport={isSaving}
        isReportModified={isReportModified}
        currentReportId={currentReportId}
        savedReportsCount={savedReportsCount}
        activeOfficerSession={officerSession}
        onOpenOfficerModal={() => {
          setOfficerModalMode('switch');
          setIsOfficerModalOpen(true);
        }}
      />

      {/* Floating Scannable Summary Ribbon (Screen Only) */}
      <div className="no-print bg-slate-800/95 border-b border-slate-700/80 px-4 py-1.5 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 text-[11px] flex-wrap">
            <span className="font-semibold text-slate-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {reportData.customerName || 'Borrower'} · {reportData.shopNo ? `Shop ${reportData.shopNo}` : 'Unassigned'}
            </span>
            {currentReportId ? (
              <span className="text-[10px] bg-slate-700/80 text-emerald-300 font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                <span>DB ID: {currentReportId}</span>
                {isReportModified && <span className="text-amber-300 font-bold">• (Unsaved)</span>}
              </span>
            ) : (
              <span className="text-[10px] bg-slate-700/60 text-slate-400 font-mono px-1.5 py-0.5 rounded border border-slate-600">
                {isReportModified ? 'Draft • Unsaved' : 'Draft'}
              </span>
            )}
            <span className="text-slate-500">|</span>
            {/* Active Branch & Officer Pill (Clickable) */}
            <button
              type="button"
              onClick={() => {
                setOfficerModalMode('switch');
                setIsOfficerModalOpen(true);
              }}
              className="text-[10px] bg-slate-700/80 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded border border-slate-600 hover:border-indigo-400/50 flex items-center gap-1.5 transition cursor-pointer"
              title="Click to switch Branch or Officer"
            >
              <span className="text-blue-400 font-semibold">📍 {officerSession?.branchName || 'Beawar'}</span>
              <span className="text-slate-500">|</span>
              <span className="text-indigo-300 font-semibold">👤 {officerSession?.officerName || 'Credit Officer'}</span>
              <span className="text-[9px] text-slate-400 underline ml-0.5">Switch</span>
            </button>
            <span className="text-slate-500">|</span>
            <span>Family Members: <strong className="text-slate-200">{totalFamilyCount || '0'}</strong></span>
            {reportData.cibilAppScore && reportData.cibilAppScore.trim() !== '' && (
              <>
                <span className="text-slate-500">|</span>
                <span>Applicant CIBIL: <strong className="text-amber-300 font-mono">{reportData.cibilAppScore}</strong></span>
              </>
            )}
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
          <FormEditorSidebar
            data={reportData}
            onChange={handleFieldChange}
            onNewReport={handleNewReport}
            onSaveReport={() => handleSaveReport()}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            isSavingReport={isSaving}
            isReportModified={isReportModified}
            currentReportId={currentReportId}
          />
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

      {/* Saved Reports Database Management Modal */}
      <SavedReportsModal
        isOpen={isSavedReportsModalOpen}
        onClose={() => setIsSavedReportsModalOpen(false)}
        onOpenReport={handleOpenReport}
        onNewReport={handleNewReport}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onReportsCountChange={(count) => setSavedReportsCount(count)}
        currentReportId={currentReportId}
        activeOfficerSession={officerSession}
      />

      {/* Upload PDF / Report & Edit Modal */}
      <UploadReportModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onLoadReport={handleLoadReportFromUpload}
      />

      {/* Strict Duplicate Warning Alert Modal */}
      <DuplicateWarningModal
        isOpen={Boolean(duplicateAlert)}
        alertInfo={duplicateAlert}
        onClose={() => setDuplicateAlert(null)}
        onOpenSavedReports={() => {
          setDuplicateAlert(null);
          setIsSavedReportsModalOpen(true);
        }}
        onUpdateExisting={(reportId) => handleSaveReport(reportId)}
        onAutoFixSkop={handleAutoFixSkop}
        onLoadExisting={handleLoadExisting}
      />

      {/* Lightweight Branch & Officer Entry Modal (Startup, New Sheet, or Switch) */}
      <BranchOfficerModal
        isOpen={isOfficerModalOpen}
        onClose={() => setIsOfficerModalOpen(false)}
        onConfirm={handleConfirmOfficerSession}
        initialSession={officerSession}
        mode={officerModalMode}
      />
    </div>
  );
}
