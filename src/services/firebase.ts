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
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { PDReportData, SavedReportRecord } from '../types';
import { getStoredOfficerSession } from '../components/BranchOfficerModal';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

/**
 * Generate a deterministic, sanitized partition key from branch & officer name.
 * Strictly separates records between different credit officers and branches.
 * Example: 'Kekri' + 'Manish Kumar' => 'kekri__manish_kumar'
 */
export function generatePartitionKey(branchName?: string, officerName?: string): string {
  const cleanBranch = (branchName || 'beawar')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'beawar';

  const cleanOfficer = (officerName || 'credit_officer')
    .replace(/Kuamar/gi, 'Kumar')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'credit_officer';

  return `${cleanBranch}__${cleanOfficer}`;
}

export function getPartitionCacheKey(partitionKey: string): string {
  return `sk_finance_cache_partition_${partitionKey}`;
}

export function getPartitionLocalCache(partitionKey: string): SavedReportRecord[] {
  try {
    const raw = localStorage.getItem(getPartitionCacheKey(partitionKey));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading partition cache:', e);
  }
  return [];
}

export function setPartitionLocalCache(partitionKey: string, records: SavedReportRecord[]): void {
  try {
    localStorage.setItem(getPartitionCacheKey(partitionKey), JSON.stringify(records));
  } catch (e) {
    console.error('Error writing partition cache:', e);
  }
}

/**
 * Local cache retrieval strictly scoped to the officer's partition.
 * Zero fallback to global lists to guarantee zero cross-officer data mixing.
 */
export function getLocalCache(
  partitionKey?: string,
  officerContext?: { branchName?: string; officerName?: string } | null
): SavedReportRecord[] {
  try {
    let targetKey = partitionKey;
    if (!targetKey) {
      const session = officerContext || getStoredOfficerSession();
      if (session?.branchName && session?.officerName) {
        targetKey = generatePartitionKey(session.branchName, session.officerName);
      }
    }
    if (targetKey) {
      return getPartitionLocalCache(targetKey);
    }
    return [];
  } catch (e) {
    console.error('Error reading local partition cache:', e);
    return [];
  }
}

/**
 * Local cache persistence strictly scoped to the officer's partition.
 */
export function setLocalCache(records: SavedReportRecord[], partitionKey?: string): void {
  try {
    let targetKey = partitionKey;
    if (!targetKey) {
      const currentSession = getStoredOfficerSession();
      if (currentSession?.branchName && currentSession?.officerName) {
        targetKey = generatePartitionKey(currentSession.branchName, currentSession.officerName);
      }
    }

    if (targetKey) {
      setPartitionLocalCache(targetKey, records);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sk_reports_changed', {
          detail: {
            count: records.length,
            records,
            partitionKey: targetKey
          }
        })
      );
    }
  } catch (e) {
    console.error('Error updating local reports partition cache:', e);
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
    return true;
  }
}

/**
 * Strict Scoped Querying:
 * Only queries the physical Firestore subcollection belonging precisely to the logged-in officer:
 * officer_partitions/{partitionKey}/reports
 */
export async function fetchReportsByPartition(
  officerContext?: { branchName?: string; officerName?: string } | null
): Promise<SavedReportRecord[]> {
  const session = officerContext || getStoredOfficerSession();
  const partitionKey = session?.branchName && session?.officerName
    ? generatePartitionKey(session.branchName, session.officerName)
    : null;

  if (!partitionKey) {
    return [];
  }

  try {
    const partCol = collection(db, 'officer_partitions', partitionKey, 'reports');
    const qPart = query(partCol, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(qPart);

    const partReports: SavedReportRecord[] = [];
    snapshot.forEach((d) => {
      const item = d.data() as SavedReportRecord;
      partReports.push({ ...item, id: d.id, partitionKey });
    });

    // Sort by newest updated
    partReports.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

    // Update partition local cache
    setPartitionLocalCache(partitionKey, partReports);
    return partReports;
  } catch (err) {
    console.error(`Error fetching reports for officer partition ${partitionKey}, using cache:`, err);
    return getPartitionLocalCache(partitionKey);
  }
}

/**
 * Fetch all reports for the currently active officer workspace.
 */
export async function fetchAllReports(
  officerContext?: { branchName?: string; officerName?: string } | null
): Promise<SavedReportRecord[]> {
  return fetchReportsByPartition(officerContext);
}

/**
 * Strict Scoped Real-Time Snapshot Listener:
 * Listens exclusively to updates inside officer_partitions/{partitionKey}/reports.
 * Never listens to global root or other officers' partitions.
 */
export function subscribeToSavedReports(
  onUpdate: (reports: SavedReportRecord[]) => void,
  officerContext?: { branchName?: string; officerName?: string } | null
): () => void {
  const session = officerContext || getStoredOfficerSession();
  const partitionKey = session?.branchName && session?.officerName
    ? generatePartitionKey(session.branchName, session.officerName)
    : null;

  if (!partitionKey) {
    onUpdate([]);
    return () => {};
  }

  // Immediately emit current partition local cache for 0ms latency UI loading
  const cached = getPartitionLocalCache(partitionKey);
  onUpdate(cached);

  try {
    const partCol = collection(db, 'officer_partitions', partitionKey, 'reports');
    const q = query(partCol, orderBy('updatedAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const reports: SavedReportRecord[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as SavedReportRecord;
          reports.push({
            ...data,
            id: d.id,
            partitionKey
          });
        });

        // Merge any locally pending changes in this partition
        const localPart = getPartitionLocalCache(partitionKey);
        for (const loc of localPart) {
          if (!reports.some((r) => r.id === loc.id)) {
            reports.push(loc);
          }
        }

        reports.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        setPartitionLocalCache(partitionKey, reports);
        onUpdate(reports);
      },
      (error) => {
        console.warn(`Firestore partition subscription error for ${partitionKey}:`, error);
        onUpdate(getPartitionLocalCache(partitionKey));
      }
    );

    return unsub;
  } catch (err) {
    console.error(`Failed to setup Firestore partition subscription for ${partitionKey}:`, err);
    return () => {};
  }
}

export class DuplicateReportError extends Error {
  public field: 'skop' | 'mobile';
  public value: string;
  public conflictingCustomer: string;
  public conflictingReportId: string;
  public conflictingDate?: string;
  public conflictingRecord?: SavedReportRecord;

  constructor(
    field: 'skop' | 'mobile',
    value: string,
    conflictingCustomer: string,
    conflictingReportId: string,
    conflictingDate?: string,
    conflictingRecord?: SavedReportRecord
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
    this.conflictingRecord = conflictingRecord;
  }
}

export function generateUniqueSkop(baseSkop?: string): string {
  const currentSession = getStoredOfficerSession();
  const allRecords = getLocalCache(undefined, currentSession);
  const existingSkops = new Set<string>();
  allRecords.forEach((r) => {
    if (r.shopNo) existingSkops.add(normalizeSkop(r.shopNo));
    if (r.reportData?.shopNo) existingSkops.add(normalizeSkop(r.reportData.shopNo));
  });

  if (baseSkop && /^\d+$/.test(baseSkop.trim())) {
    const num = parseInt(baseSkop.trim(), 10);
    for (let i = 1; i <= 200; i++) {
      const candidate = String(num + i);
      if (!existingSkops.has(candidate)) {
        return candidate;
      }
    }
  }

  for (let i = 0; i < 100; i++) {
    const candidate = `4890${Math.floor(1000 + Math.random() * 9000)}`;
    if (!existingSkops.has(candidate)) {
      return candidate;
    }
  }

  return `4890${Date.now().toString().slice(-4)}`;
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

/**
 * Validate uniqueness strictly against the active officer's partition.
 */
export async function validateReportUniqueness(
  reportData: PDReportData,
  existingId?: string,
  officerContext?: { branchName?: string; officerName?: string } | null
): Promise<{ isValid: boolean; error?: DuplicateReportError; conflictingRecord?: SavedReportRecord }> {
  // Validate against active officer partition records ONLY
  const officerRecords = await fetchAllReports(officerContext);
  const currentId = typeof existingId === 'string' && existingId.trim() ? existingId.trim() : '';

  // 1. Strict Validation: SKOP Number uniqueness
  const skop = (reportData.shopNo || '').trim();
  const ignoredSkops = ['', 'na', 'n/a', 'nil', 'none', '-'];
  if (skop && !ignoredSkops.includes(skop.toLowerCase())) {
    const conflicting = officerRecords.find((r) => {
      if (r.id === currentId) return false;
      const otherSkop = (r.shopNo || r.reportData?.shopNo || '').trim();
      return isSkopMatch(skop, otherSkop);
    });

    if (conflicting) {
      return {
        isValid: false,
        conflictingRecord: conflicting,
        error: new DuplicateReportError(
          'skop',
          skop,
          conflicting.customerName || conflicting.reportData?.customerName || 'Existing Customer',
          conflicting.id,
          conflicting.visitDate || conflicting.reportData?.visitDate,
          conflicting
        )
      };
    }
  }

  // 2. Strict Validation: Verified Mobile Number uniqueness
  const newMobiles = extractPhoneNumbers(reportData.contactNumbers);
  if (newMobiles.length > 0) {
    for (const mobile of newMobiles) {
      if (/^0+$/.test(mobile) || mobile === '1234567890') continue;

      const conflicting = officerRecords.find((r) => {
        if (r.id === currentId) return false;
        const otherMobiles = extractPhoneNumbers(r.contactNumbers || r.reportData?.contactNumbers);
        return otherMobiles.includes(mobile);
      });

      if (conflicting) {
        return {
          isValid: false,
          conflictingRecord: conflicting,
          error: new DuplicateReportError(
            'mobile',
            mobile,
            conflicting.customerName || conflicting.reportData?.customerName || 'Existing Customer',
            conflicting.id,
            conflicting.visitDate || conflicting.reportData?.visitDate,
            conflicting
          )
        };
      }
    }
  }

  return { isValid: true };
}

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

/**
 * Officer-Exclusive Data Storage:
 * Stored and written EXCLUSIVELY under the officer's partition key in Firestore:
 * officer_partitions/{partitionKey}/reports/{id}
 * Never writes to global collections to eliminate cross-officer data mixing.
 */
export async function saveReport(
  reportData: PDReportData,
  existingId?: string,
  officerContext?: { branchName?: string; officerName?: string },
  allowAutoLink: boolean = true
): Promise<SavedReportRecord> {
  const session = officerContext || getStoredOfficerSession();
  const branchName = (
    reportData.branchName ||
    reportData.branch_name ||
    session?.branchName ||
    'Beawar'
  ).trim();

  const officerName = (
    reportData.officerName ||
    reportData.officer_name ||
    session?.officerName ||
    reportData.pdAuthorisedPerson ||
    'Credit Officer'
  ).replace(/Kuamar/gi, 'Kumar').trim();

  // Create partition key for isolated storage
  const partitionKey = generatePartitionKey(branchName, officerName);

  let resolvedId = typeof existingId === 'string' && existingId.trim() ? existingId.trim() : '';

  // If no explicit ID was provided, auto-link to existing report IF the SKOP and customer name match in this partition
  if (!resolvedId && allowAutoLink) {
    const officerRecords = await fetchReportsByPartition({ branchName, officerName });
    const skop = (reportData.shopNo || '').trim();
    const customer = (reportData.customerName || '').trim().toLowerCase();

    if (skop) {
      const match = officerRecords.find((r) => {
        const otherSkop = (r.shopNo || r.reportData?.shopNo || '').trim();
        const otherCust = (r.customerName || r.reportData?.customerName || '').trim().toLowerCase();
        return isSkopMatch(skop, otherSkop) && (
          otherCust === customer ||
          (customer.length > 3 && otherCust.includes(customer)) ||
          (otherCust.length > 3 && customer.includes(otherCust))
        );
      });
      if (match) {
        resolvedId = match.id;
      }
    }
  }

  // Enforce strict duplicate validation within this officer's workspace
  const validation = await validateReportUniqueness(reportData, resolvedId || undefined, { branchName, officerName });
  if (!validation.isValid && validation.error) {
    throw validation.error;
  }

  const now = new Date().toISOString();
  const id = resolvedId || `SKPD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  let createdAt = now;
  if (resolvedId) {
    const cached = getPartitionLocalCache(partitionKey);
    const existing = cached.find((r) => r.id === resolvedId);
    if (existing?.createdAt) {
      createdAt = existing.createdAt;
    }
  }

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
    partitionKey,
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
      partitionKey,
      pdAuthorisedPerson: reportData.pdAuthorisedPerson || officerName || ''
    }
  };

  // 1. Immediately update partition cache
  const partCache = getPartitionLocalCache(partitionKey);
  const partIdx = partCache.findIndex((r) => r.id === id);
  let updatedPartCache: SavedReportRecord[];
  if (partIdx >= 0) {
    updatedPartCache = [...partCache];
    updatedPartCache[partIdx] = record;
  } else {
    updatedPartCache = [record, ...partCache];
  }
  setLocalCache(updatedPartCache, partitionKey);

  // 2. Persist exclusively to Firestore partition subcollection:
  // officer_partitions/{partitionKey}/reports/{id}
  try {
    const sanitizedRecord = removeUndefined(record);
    const partDocRef = doc(db, 'officer_partitions', partitionKey, 'reports', id);
    await setDoc(partDocRef, sanitizedRecord);
  } catch (err: any) {
    console.error('Failed to save report to Firestore partition (saved locally):', err);
    if (!err?.message?.includes('offline')) {
      throw err;
    }
  }

  return record;
}

/**
 * Delete a report exclusively from this officer's partition.
 */
export async function deleteReport(
  id: string,
  officerContext?: { branchName?: string; officerName?: string },
  recordPartitionKey?: string
): Promise<void> {
  const session = officerContext || getStoredOfficerSession();
  const partitionKey =
    recordPartitionKey ||
    (session?.branchName && session?.officerName ? generatePartitionKey(session.branchName, session.officerName) : null);

  if (!partitionKey) return;

  // 1. Remove from local partition cache
  const cached = getPartitionLocalCache(partitionKey).filter((r) => r.id !== id);
  setPartitionLocalCache(partitionKey, cached);
  setLocalCache(cached, partitionKey);

  // 2. Remove exclusively from officer partition in Firestore
  try {
    await deleteDoc(doc(db, 'officer_partitions', partitionKey, 'reports', id));
  } catch (err) {
    console.error('Failed to delete report from Firestore partition:', err);
  }
}

/**
 * Duplicate a report within the officer's private partition.
 */
export async function duplicateReport(
  id: string,
  officerContext?: { branchName?: string; officerName?: string }
): Promise<SavedReportRecord> {
  const session = officerContext || getStoredOfficerSession();
  const partitionKey = session?.branchName && session?.officerName
    ? generatePartitionKey(session.branchName, session.officerName)
    : null;

  let source: SavedReportRecord | undefined;
  if (partitionKey) {
    source = getPartitionLocalCache(partitionKey).find((r) => r.id === id);
    if (!source) {
      try {
        const snap = await getDoc(doc(db, 'officer_partitions', partitionKey, 'reports', id));
        if (snap.exists()) source = snap.data() as SavedReportRecord;
      } catch (e) {
        console.warn('Error fetching source report for duplication:', e);
      }
    }
  }

  if (!source) {
    throw new Error('Report not found in your partition.');
  }

  const newSkop = generateUniqueSkop(source.shopNo);
  const newReportData: PDReportData = {
    ...source.reportData,
    shopNo: newSkop,
    customerName: `${source.customerName || 'Applicant'} (Copy)`,
    visitDate: new Date().toLocaleDateString('en-GB')
  };

  return saveReport(newReportData, undefined, session || undefined);
}
