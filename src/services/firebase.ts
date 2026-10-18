import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  getDocFromServer,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { PDReportData, SavedReportRecord } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const LOCAL_BACKUP_KEY = 'sk_finance_saved_reports_cache_v1';

// Safe local cache functions for offline fallback
export function getLocalCache(): SavedReportRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_BACKUP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading local reports cache:', e);
    return [];
  }
}

export function setLocalCache(records: SavedReportRecord[]): void {
  try {
    localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(records));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sk_reports_changed', {
          detail: { count: records.length, records }
        })
      );
    }
  } catch (e) {
    console.error('Error updating local reports cache:', e);
  }
}

// Subscribe to real-time updates from Firestore collection and local cache
export function subscribeToSavedReports(
  onUpdate: (reports: SavedReportRecord[]) => void
): () => void {
  // Immediately emit current local cache so count displays without any network delay
  const initialCache = getLocalCache();
  onUpdate(initialCache);

  try {
    const colRef = collection(db, 'saved_reports');
    const q = query(colRef, orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reports: SavedReportRecord[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as SavedReportRecord;
          reports.push({
            ...data,
            id: d.id,
          });
        });
        setLocalCache(reports);
        onUpdate(reports);
      },
      (error) => {
        console.warn('Firestore real-time subscription error, using local cache:', error);
        onUpdate(getLocalCache());
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to setup Firestore subscription:', err);
    return () => {};
  }
}

// Test Firestore connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline mode.');
      return false;
    }
    // Any other error (like document not found) still proves server connectivity
    return true;
  }
}

export async function fetchAllReports(): Promise<SavedReportRecord[]> {
  try {
    const colRef = collection(db, 'saved_reports');
    const q = query(colRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);

    const reports: SavedReportRecord[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as SavedReportRecord;
      reports.push({
        ...data,
        id: d.id,
      });
    });

    // Update local cache
    if (reports.length > 0) {
      setLocalCache(reports);
    } else {
      // If server returned 0 records, check if we have local records to merge
      const cached = getLocalCache();
      if (cached.length > 0) {
        return cached;
      }
    }

    return reports;
  } catch (err) {
    console.error('Failed to fetch reports from Firestore, using offline cache:', err);
    return getLocalCache();
  }
}

export class DuplicateReportError extends Error {
  public field: 'skop' | 'mobile';
  public value: string;
  public conflictingCustomer: string;
  public conflictingReportId: string;
  public conflictingDate?: string;

  constructor(
    field: 'skop' | 'mobile',
    value: string,
    conflictingCustomer: string,
    conflictingReportId: string,
    conflictingDate?: string
  ) {
    const fieldName = field === 'skop' ? 'SKOP Number' : 'Verified Mobile Number';
    const message = `Duplicate ${fieldName}: "${value}" is already registered for customer "${conflictingCustomer}" (Report ID: ${conflictingReportId}${conflictingDate ? `, Date: ${conflictingDate}` : ''}). Each report must have a unique ${field === 'skop' ? 'SKOP number' : 'verified mobile number'}.`;
    super(message);
    this.name = 'DuplicateReportError';
    this.field = field;
    this.value = value;
    this.conflictingCustomer = conflictingCustomer;
    this.conflictingReportId = conflictingReportId;
    this.conflictingDate = conflictingDate;
  }
}

export function normalizeSkop(val?: string): string {
  if (!val) return '';
  return val.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isSkopMatch(skopA?: string, skopB?: string): boolean {
  if (!skopA || !skopB) return false;
  const a = skopA.trim().toLowerCase();
  const b = skopB.trim().toLowerCase();
  if (!a || !b) return false;
  const ignored = ['', 'na', 'n/a', 'nil', 'none', '-'];
  if (ignored.includes(a) || ignored.includes(b)) return false;
  if (a === b) return true;
  const cleanA = a.replace(/[^a-z0-9]/g, '');
  const cleanB = b.replace(/[^a-z0-9]/g, '');
  return Boolean(cleanA && cleanB && cleanA === cleanB);
}

export function extractPhoneNumbers(input?: string): string[] {
  if (!input) return [];
  const numbers: string[] = [];

  // Match 10-digit mobile patterns (\b[6-9]\d{9}\b or any 10 continuous digits)
  const matches = input.match(/(?:(?:\+91|0)?\s*)?([6-9]\d{9})/g);
  if (matches) {
    for (const m of matches) {
      const digits = m.replace(/\D/g, '');
      if (digits.length >= 10) {
        const ten = digits.slice(-10);
        if (!numbers.includes(ten)) numbers.push(ten);
      }
    }
  }

  // Also split by common delimiters to catch non-standard numbers
  const parts = input.split(/[,/;\n|&]+/).map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const digits = part.replace(/\D/g, '');
    if (digits.length >= 10) {
      const ten = digits.slice(-10);
      if (!numbers.includes(ten)) numbers.push(ten);
    } else if (digits.length >= 7) {
      if (!numbers.includes(digits)) numbers.push(digits);
    }
  }

  return numbers;
}

export async function validateReportUniqueness(
  reportData: PDReportData,
  existingId?: string
): Promise<{ isValid: boolean; error?: DuplicateReportError }> {
  const allRecords = await fetchAllReports();
  const currentId = existingId?.trim() || '';

  // 1. Strict Validation: SKOP Number uniqueness
  const skop = (reportData.shopNo || '').trim();
  const ignoredSkops = ['', 'na', 'n/a', 'nil', 'none', '-'];
  if (skop && !ignoredSkops.includes(skop.toLowerCase())) {
    const conflicting = allRecords.find((r) => {
      if (r.id === currentId) return false;
      const otherSkop = (r.shopNo || r.reportData?.shopNo || '').trim();
      return isSkopMatch(skop, otherSkop);
    });

    if (conflicting) {
      return {
        isValid: false,
        error: new DuplicateReportError(
          'skop',
          skop,
          conflicting.customerName || conflicting.reportData?.customerName || 'Existing Customer',
          conflicting.id,
          conflicting.visitDate || conflicting.reportData?.visitDate
        )
      };
    }
  }

  // 2. Strict Validation: Verified Mobile Number uniqueness
  const newMobiles = extractPhoneNumbers(reportData.contactNumbers);
  if (newMobiles.length > 0) {
    for (const mobile of newMobiles) {
      if (/^0+$/.test(mobile) || mobile === '1234567890') continue;

      const conflicting = allRecords.find((r) => {
        if (r.id === currentId) return false;
        const otherMobiles = extractPhoneNumbers(r.contactNumbers || r.reportData?.contactNumbers);
        return otherMobiles.includes(mobile);
      });

      if (conflicting) {
        return {
          isValid: false,
          error: new DuplicateReportError(
            'mobile',
            mobile,
            conflicting.customerName || conflicting.reportData?.customerName || 'Existing Customer',
            conflicting.id,
            conflicting.visitDate || conflicting.reportData?.visitDate
          )
        };
      }
    }
  }

  return { isValid: true };
}

export async function saveReport(
  reportData: PDReportData,
  existingId?: string,
  officerContext?: { branchName?: string; officerName?: string }
): Promise<SavedReportRecord> {
  // Enforce strict duplicate validation before saving
  const validation = await validateReportUniqueness(reportData, existingId);
  if (!validation.isValid && validation.error) {
    throw validation.error;
  }

  const now = new Date().toISOString();
  const id = existingId && existingId.trim() ? existingId.trim() : `SKPD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // If updating, preserve creation date and original branch/officer if not provided
  let createdAt = now;
  let existingBranch = '';
  let existingOfficer = '';
  if (existingId) {
    const cached = getLocalCache();
    const existing = cached.find((r) => r.id === existingId);
    if (existing?.createdAt) {
      createdAt = existing.createdAt;
      existingBranch = existing.branchName || existing.branch_name || '';
      existingOfficer = existing.officerName || existing.officer_name || '';
    }
  }

  const branchName = (
    reportData.branchName ||
    reportData.branch_name ||
    officerContext?.branchName ||
    existingBranch ||
    ''
  ).trim();

  const officerName = (
    reportData.officerName ||
    reportData.officer_name ||
    officerContext?.officerName ||
    existingOfficer ||
    reportData.pdAuthorisedPerson ||
    ''
  ).trim();

  const record: SavedReportRecord = {
    id,
    shopNo: reportData.shopNo || '',
    customerName: reportData.customerName || 'Unnamed Applicant',
    visitDate: reportData.visitDate || '',
    visitLocation: reportData.visitLocation || '',
    contactNumbers: reportData.contactNumbers || '',
    branchName,
    officerName,
    branch_name: branchName,
    officer_name: officerName,
    createdAt,
    updatedAt: now,
    reportData: {
      ...reportData,
      shopNo: reportData.shopNo || '',
      customerName: reportData.customerName || 'Unnamed Applicant',
      branchName,
      officerName,
      branch_name: branchName,
      officer_name: officerName,
      pdAuthorisedPerson: reportData.pdAuthorisedPerson || officerName || ''
    }
  };

  // Helper to remove any undefined fields recursively to prevent Firestore validation errors
  function removeUndefined<T>(value: T): T {
    if (value === undefined || value === null) {
      return null as any;
    }
    if (Array.isArray(value)) {
      return value.map((item) => removeUndefined(item)) as any;
    }
    if (typeof value === 'object') {
      const res: Record<string, any> = {};
      for (const [k, v] of Object.entries(value as Record<string, any>)) {
        if (v !== undefined) {
          res[k] = removeUndefined(v);
        }
      }
      return res as T;
    }
    return value;
  }

  // 1. Immediately persist to local cache for instant UI response
  const cached = getLocalCache();
  const existingIdx = cached.findIndex((r) => r.id === id);
  let updatedCache: SavedReportRecord[];
  if (existingIdx >= 0) {
    updatedCache = [...cached];
    updatedCache[existingIdx] = record;
  } else {
    updatedCache = [record, ...cached];
  }
  setLocalCache(updatedCache);

  // 2. Persist to Firestore permanent database
  try {
    const docRef = doc(db, 'saved_reports', id);
    const sanitizedRecord = removeUndefined(record);
    await setDoc(docRef, sanitizedRecord);
  } catch (err: any) {
    console.error('Failed to save report to Firestore (saved locally):', err);
    // If Firestore fails due to non-offline errors, propagate so user is alerted
    if (!err?.message?.includes('offline')) {
      throw err;
    }
  }

  return record;
}

export async function deleteReport(id: string): Promise<void> {
  // 1. Remove from local cache
  const cached = getLocalCache().filter((r) => r.id !== id);
  setLocalCache(cached);

  // 2. Remove from Firestore
  try {
    const docRef = doc(db, 'saved_reports', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete report from Firestore:', err);
  }
}

export async function duplicateReport(id: string): Promise<SavedReportRecord> {
  const cached = getLocalCache();
  let source = cached.find((r) => r.id === id);

  if (!source) {
    // Try fetching from Firestore
    try {
      const docSnap = await getDoc(doc(db, 'saved_reports', id));
      if (docSnap.exists()) {
        source = docSnap.data() as SavedReportRecord;
      }
    } catch (e) {
      console.error('Failed to fetch source report to duplicate:', e);
    }
  }

  if (!source) {
    throw new Error('Report to duplicate was not found.');
  }

  // Create duplicate with unique SKOP suffix and cleared contact numbers so it passes uniqueness
  const uniqueSuffix = Date.now().toString().slice(-4);
  const duplicatedData: PDReportData = {
    ...source.reportData,
    customerName: `${source.reportData.customerName || 'Applicant'} (Copy)`,
    shopNo: source.reportData.shopNo ? `${source.reportData.shopNo}-CP${uniqueSuffix}` : '',
    contactNumbers: '', // Cleared so it doesn't collide with the original applicant's verified phone
    branchName: source.branchName || source.branch_name || source.reportData?.branchName || '',
    officerName: source.officerName || source.officer_name || source.reportData?.officerName || '',
    branch_name: source.branchName || source.branch_name || source.reportData?.branchName || '',
    officer_name: source.officerName || source.officer_name || source.reportData?.officerName || '',
  };

  return await saveReport(duplicatedData);
}
