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

const GLOBAL_CACHE_KEY = 'sk_finance_saved_reports_cache_v1';

/**
 * Generate a deterministic, sanitized partition key from branch & officer name.
 * Prevents cross-contamination between different credit officers and branches.
 */
export function generatePartitionKey(branchName?: string, officerName?: string): string {
  const cleanBranch = (branchName || 'default_branch')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'default_branch';

  const cleanOfficer = (officerName || 'default_officer')
    .replace(/Kuamar/gi, 'Kumar')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'default_officer';

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

// Local cache functions with partition awareness
export function getLocalCache(partitionKey?: string): SavedReportRecord[] {
  try {
    // If specific partition key provided, prioritize it
    if (partitionKey) {
      const partCache = getPartitionLocalCache(partitionKey);
      if (partCache.length > 0) return partCache;
    }

    // Try current active officer partition from session
    const currentSession = getStoredOfficerSession();
    if (currentSession?.branchName && currentSession?.officerName) {
      const activeKey = generatePartitionKey(currentSession.branchName, currentSession.officerName);
      const activePart = getPartitionLocalCache(activeKey);
      if (activePart.length > 0) return activePart;
    }

    // Fallback to global cache
    const raw = localStorage.getItem(GLOBAL_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading local reports cache:', e);
    return [];
  }
}

export function setLocalCache(records: SavedReportRecord[], partitionKey?: string): void {
  try {
    // Determine active partition key
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

    // Also update global cache with latest records (merge by ID)
    const rawGlobal = localStorage.getItem(GLOBAL_CACHE_KEY);
    const globalList: SavedReportRecord[] = rawGlobal ? JSON.parse(rawGlobal) : [];
    const map = new Map<string, SavedReportRecord>();
    globalList.forEach((r) => map.set(r.id, r));
    records.forEach((r) => map.set(r.id, r));
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    );

    localStorage.setItem(GLOBAL_CACHE_KEY, JSON.stringify(merged));

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
    console.error('Error updating local reports cache:', e);
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
 * Fetch reports for a specific officer partition or all reports
 */
export async function fetchReportsByPartition(
  officerContext?: { branchName?: string; officerName?: string } | null,
  includeAll = false
): Promise<SavedReportRecord[]> {
  const session = officerContext || getStoredOfficerSession();
  const partitionKey = session?.branchName && session?.officerName
    ? generatePartitionKey(session.branchName, session.officerName)
    : null;

  // 1. If scoped to an active officer partition (Default for zero data mixing)
  if (!includeAll && partitionKey) {
    try {
      // Query physical partitioned subcollection
      const partCol = collection(db, 'officer_partitions', partitionKey, 'reports');
      const qPart = query(partCol, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(qPart);

      const partReports: SavedReportRecord[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as SavedReportRecord;
        partReports.push({ ...item, id: d.id });
      });

      // Also check root collection to catch any reports saved under this officer before subcollections or offline
      try {
        const rootCol = collection(db, 'saved_reports');
        const qRoot = query(rootCol, orderBy('updatedAt', 'desc'));
        const rootSnap = await getDocs(qRoot);
        rootSnap.forEach((d) => {
          const item = d.data() as SavedReportRecord;
          const matchKey = item.partitionKey === partitionKey;
          const matchNames =
            (item.branchName || item.branch_name || '').trim().toLowerCase() === (session?.branchName || '').trim().toLowerCase() &&
            (item.officerName || item.officer_name || '').replace(/Kuamar/gi, 'Kumar').trim().toLowerCase() ===
              (session?.officerName || '').replace(/Kuamar/gi, 'Kumar').trim().toLowerCase();

          if (matchKey || matchNames) {
            if (!partReports.some((p) => p.id === d.id)) {
              partReports.push({ ...item, id: d.id, partitionKey });
            }
          }
        });
      } catch (err) {
        console.warn('Fallback scan of root reports collection skipped:', err);
      }

      // Sort by newest updated
      partReports.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

      // Update partition cache
      setPartitionLocalCache(partitionKey, partReports);
      return partReports;
    } catch (err) {
      console.error('Error fetching partitioned reports, falling back to partition cache:', err);
      return getPartitionLocalCache(partitionKey);
    }
  }

  // 2. Fallback: Fetch all saved reports across all partitions (used when user chooses 'All Reports')
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

    if (reports.length > 0) {
      localStorage.setItem(GLOBAL_CACHE_KEY, JSON.stringify(reports));
    }
    return reports;
  } catch (err) {
    console.error('Failed to fetch reports from Firestore, using offline cache:', err);
    return getLocalCache();
  }
}

/**
 * Fetch all reports. Scopes to active officer partition by default to prevent data mixing.
 */
export async function fetchAllReports(
  officerContext?: { branchName?: string; officerName?: string } | null,
  includeAll = false
): Promise<SavedReportRecord[]> {
  return fetchReportsByPartition(officerContext, includeAll);
}

/**
 * Real-time subscription to saved reports for the active officer partition
 */
export function subscribeToSavedReports(
  onUpdate: (reports: SavedReportRecord[]) => void,
  officerContext?: { branchName?: string; officerName?: string } | null,
  includeAll = false
): () => void {
  const session = officerContext || getStoredOfficerSession();
  const partitionKey = session?.branchName && session?.officerName
    ? generatePartitionKey(session.branchName, session.officerName)
    : null;

  // Immediately emit current partition local cache for 0ms UI loading
  if (!includeAll && partitionKey) {
    const cached = getPartitionLocalCache(partitionKey);
    onUpdate(cached);
  } else {
    onUpdate(getLocalCache());
  }

  const unsubscribes: Unsubscribe[] = [];

  // 1. Subscribe to physical partition subcollection if partitionKey is available
  if (!includeAll && partitionKey) {
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

          // Also merge any local partition items not yet synced
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
          console.warn('Firestore partition subscription error, using local partition cache:', error);
          onUpdate(getPartitionLocalCache(partitionKey));
        }
      );
      unsubscribes.push(unsub);
    } catch (err) {
      console.error('Failed to setup Firestore partition subscription:', err);
    }
  } else {
    // Root collection subscription
    try {
      const colRef = collection(db, 'saved_reports');
      const q = query(colRef, orderBy('updatedAt', 'desc'));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const reports: SavedReportRecord[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as SavedReportRecord;
            reports.push({ ...data, id: d.id });
          });
          localStorage.setItem(GLOBAL_CACHE_KEY, JSON.stringify(reports));
          onUpdate(reports);
        },
        (error) => {
          console.warn('Firestore subscription error, using local cache:', error);
          onUpdate(getLocalCache());
        }
      );
      unsubscribes.push(unsub);
    } catch (err) {
      console.error('Failed to setup Firestore root subscription:', err);
    }
  }

  return () => {
    unsubscribes.forEach((fn) => fn());
  };
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

export async function validateReportUniqueness(
  reportData: PDReportData,
  existingId?: string,
  officerContext?: { branchName?: string; officerName?: string } | null
): Promise<{ isValid: boolean; error?: DuplicateReportError }> {
  // Validate against both active partition and global records
  const allRecords = await fetchAllReports(officerContext, true);
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

export async function saveReport(
  reportData: PDReportData,
  existingId?: string,
  officerContext?: { branchName?: string; officerName?: string }
): Promise<SavedReportRecord> {
  // Enforce strict duplicate validation before saving
  const validation = await validateReportUniqueness(reportData, existingId, officerContext);
  if (!validation.isValid && validation.error) {
    throw validation.error;
  }

  const now = new Date().toISOString();
  const id = existingId && existingId.trim() ? existingId.trim() : `SKPD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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
    'Beawar'
  ).trim();

  const officerName = (
    reportData.officerName ||
    reportData.officer_name ||
    officerContext?.officerName ||
    existingOfficer ||
    reportData.pdAuthorisedPerson ||
    'Credit Officer'
  ).replace(/Kuamar/gi, 'Kumar').trim();

  // Create partition key for isolated storage
  const partitionKey = generatePartitionKey(branchName, officerName);

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

  // 1. Immediately update partition cache and local store for instant offline UI update
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

  // 2. Persist to Firestore:
  // (A) Primary Partition Subcollection: officer_partitions/{partitionKey}/reports/{id}
  // (B) Global root backup: saved_reports/{id} with partitionKey tag
  try {
    const sanitizedRecord = removeUndefined(record);

    // Save into isolated partition subcollection
    const partDocRef = doc(db, 'officer_partitions', partitionKey, 'reports', id);
    const savePartPromise = setDoc(partDocRef, sanitizedRecord);

    // Also backup to root collection
    const rootDocRef = doc(db, 'saved_reports', id);
    const saveRootPromise = setDoc(rootDocRef, sanitizedRecord);

    await Promise.allSettled([savePartPromise, saveRootPromise]);
  } catch (err: any) {
    console.error('Failed to save report to Firestore (saved locally):', err);
    if (!err?.message?.includes('offline')) {
      throw err;
    }
  }

  return record;
}

export async function deleteReport(
  id: string,
  officerContext?: { branchName?: string; officerName?: string },
  recordPartitionKey?: string
): Promise<void> {
  const session = officerContext || getStoredOfficerSession();
  const partitionKey =
    recordPartitionKey ||
    (session?.branchName && session?.officerName ? generatePartitionKey(session.branchName, session.officerName) : null);

  // 1. Remove from local caches
  if (partitionKey) {
    const cached = getPartitionLocalCache(partitionKey).filter((r) => r.id !== id);
    setLocalCache(cached, partitionKey);
  }
  const globalCached = getLocalCache().filter((r) => r.id !== id);
  localStorage.setItem(GLOBAL_CACHE_KEY, JSON.stringify(globalCached));

  // 2. Remove from Firestore: both partition subcollection and root backup
  try {
    const promises: Promise<any>[] = [deleteDoc(doc(db, 'saved_reports', id))];
    if (partitionKey) {
      promises.push(deleteDoc(doc(db, 'officer_partitions', partitionKey, 'reports', id)));
    }
    await Promise.allSettled(promises);
  } catch (err) {
    console.error('Failed to delete report from Firestore:', err);
  }
}

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
  }
  if (!source) {
    source = getLocalCache().find((r) => r.id === id);
  }

  if (!source) {
    try {
      if (partitionKey) {
        const snap = await getDoc(doc(db, 'officer_partitions', partitionKey, 'reports', id));
        if (snap.exists()) source = snap.data() as SavedReportRecord;
      }
      if (!source) {
        const rootSnap = await getDoc(doc(db, 'saved_reports', id));
        if (rootSnap.exists()) source = rootSnap.data() as SavedReportRecord;
      }
    } catch (e) {
      console.error('Failed to fetch source report to duplicate:', e);
    }
  }

  if (!source) {
    throw new Error('Report to duplicate was not found.');
  }

  const uniqueSuffix = Date.now().toString().slice(-4);
  const targetBranch = session?.branchName || source.branchName || source.branch_name || 'Beawar';
  const targetOfficer = (session?.officerName || source.officerName || source.officer_name || 'Credit Officer').replace(/Kuamar/gi, 'Kumar');

  const duplicatedData: PDReportData = {
    ...source.reportData,
    customerName: `${source.reportData.customerName || 'Applicant'} (Copy)`,
    shopNo: source.reportData.shopNo ? `${source.reportData.shopNo}-CP${uniqueSuffix}` : '',
    contactNumbers: '',
    branchName: targetBranch,
    officerName: targetOfficer,
    branch_name: targetBranch,
    officer_name: targetOfficer,
    partitionKey: generatePartitionKey(targetBranch, targetOfficer)
  };

  return await saveReport(duplicatedData, undefined, { branchName: targetBranch, officerName: targetOfficer });
}
