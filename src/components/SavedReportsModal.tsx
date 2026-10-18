import React, { useState, useMemo, useEffect } from 'react';
import { SavedReportRecord, PDReportData } from '../types';
import {
  fetchAllReports,
  deleteReport,
  duplicateReport
} from '../services/firebase';
import {
  Search,
  RotateCcw,
  Trash2,
  Copy,
  ExternalLink,
  Edit3,
  Calendar,
  MapPin,
  Phone,
  FileText,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  Plus,
  Upload,
  User,
  Building2,
  UserCheck
} from 'lucide-react';

interface SavedReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReport: (record: SavedReportRecord) => void;
  onNewReport: () => void;
  onOpenUploadModal?: () => void;
  onReportsCountChange?: (count: number) => void;
  currentReportId: string | null;
  activeOfficerSession?: { branchName: string; officerName: string } | null;
}

type SortField = 'visitDate' | 'customerName' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

export const SavedReportsModal: React.FC<SavedReportsModalProps> = ({
  isOpen,
  onClose,
  onOpenReport,
  onNewReport,
  onOpenUploadModal,
  onReportsCountChange,
  currentReportId,
  activeOfficerSession
}) => {
  const [reports, setReports] = useState<SavedReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Global search input
  const [searchTerm, setSearchTerm] = useState('');

  // Detailed filters
  const [filterApplicant, setFilterApplicant] = useState('');
  const [filterSkop, setFilterSkop] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterOfficer, setFilterOfficer] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Confirm delete dialog state
  const [deleteCandidate, setDeleteCandidate] = useState<SavedReportRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action status message
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAllReports();
      setReports(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load saved reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadReports();
    }
  }, [isOpen]);

  useEffect(() => {
    onReportsCountChange?.(reports.length);
  }, [reports, onReportsCountChange]);

  // Dynamically extract all distinct officers & branches from saved reports
  const uniqueOfficers = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      const off =
        r.officerName ||
        r.officer_name ||
        r.reportData?.officerName ||
        r.reportData?.officer_name ||
        r.reportData?.pdAuthorisedPerson;
      if (off && off.trim()) set.add(off.trim());
    });
    return Array.from(set).sort();
  }, [reports]);

  const uniqueBranches = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      const br =
        r.branchName ||
        r.branch_name ||
        r.reportData?.branchName ||
        r.reportData?.branch_name;
      if (br && br.trim()) set.add(br.trim());
    });
    return Array.from(set).sort();
  }, [reports]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterApplicant('');
    setFilterSkop('');
    setFilterLocation('');
    setFilterOfficer('');
    setFilterBranch('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Filter & Search Logic
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const reportOfficer = (
        item.officerName ||
        item.officer_name ||
        item.reportData?.officerName ||
        item.reportData?.officer_name ||
        item.reportData?.pdAuthorisedPerson ||
        ''
      ).trim();

      const reportBranch = (
        item.branchName ||
        item.branch_name ||
        item.reportData?.branchName ||
        item.reportData?.branch_name ||
        ''
      ).trim();

      // 1. Global search term (Applicant, Date, SKOP, Location, Mobile, Officer, Branch, ID)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesGlobal =
          (item.customerName || '').toLowerCase().includes(q) ||
          (item.shopNo || '').toLowerCase().includes(q) ||
          (item.visitDate || '').toLowerCase().includes(q) ||
          (item.visitLocation || '').toLowerCase().includes(q) ||
          (item.contactNumbers || '').toLowerCase().includes(q) ||
          reportOfficer.toLowerCase().includes(q) ||
          reportBranch.toLowerCase().includes(q) ||
          (item.id || '').toLowerCase().includes(q);

        if (!matchesGlobal) return false;
      }

      // 2. Specific field filters
      if (filterApplicant.trim()) {
        if (!item.customerName.toLowerCase().includes(filterApplicant.toLowerCase().trim())) {
          return false;
        }
      }

      if (filterSkop.trim()) {
        if (!item.shopNo.toLowerCase().includes(filterSkop.toLowerCase().trim())) {
          return false;
        }
      }

      if (filterLocation.trim()) {
        if (!item.visitLocation.toLowerCase().includes(filterLocation.toLowerCase().trim())) {
          return false;
        }
      }

      // Officer Filter
      if (filterOfficer.trim()) {
        if (!reportOfficer.toLowerCase().includes(filterOfficer.toLowerCase().trim())) {
          return false;
        }
      }

      // Branch Filter
      if (filterBranch.trim()) {
        if (!reportBranch.toLowerCase().includes(filterBranch.toLowerCase().trim())) {
          return false;
        }
      }

      return true;
    });
  }, [
    reports,
    searchTerm,
    filterApplicant,
    filterSkop,
    filterLocation,
    filterOfficer,
    filterBranch,
    filterDateFrom,
    filterDateTo
  ]);

  // Sort Logic
  const sortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (sortField === 'customerName') {
        valA = a.customerName.toLowerCase();
        valB = b.customerName.toLowerCase();
      } else if (sortField === 'visitDate') {
        valA = a.visitDate || '';
        valB = b.visitDate || '';
      } else {
        valA = a.updatedAt || '';
        valB = b.updatedAt || '';
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredReports, sortField, sortOrder]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedReports.length / pageSize) || 1;
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedReports.slice(start, start + pageSize);
  }, [sortedReports, currentPage, pageSize]);

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await deleteReport(deleteCandidate.id);
      setReports((prev) => prev.filter((r) => r.id !== deleteCandidate.id));
      setActionNotice(`Report "${deleteCandidate.customerName}" deleted successfully.`);
      setTimeout(() => setActionNotice(null), 3000);
      setDeleteCandidate(null);
    } catch (err: any) {
      setActionNotice(`Failed to delete report: ${err?.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (record: SavedReportRecord) => {
    try {
      setActionNotice(`Duplicating "${record.customerName}"...`);
      const cloned = await duplicateReport(record.id);
      setReports((prev) => [cloned, ...prev]);
      setActionNotice(`✓ Duplicated as "${cloned.customerName}".`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      setActionNotice(`Failed to duplicate report: ${err?.message || err}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-wide">
                  Saved PD Visit Reports
                </h3>
                <span className="text-xs bg-slate-800 text-emerald-400 border border-emerald-500/30 font-semibold px-2 py-0.5 rounded-full">
                  {reports.length} Total
                </span>
              </div>
              <p className="text-xs text-slate-400">
                S K Finance Limited · Permanent Database Storage & History
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenUploadModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUploadModal();
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md flex items-center gap-1.5 transition-colors shadow-sm"
                title="Upload PDF or document report to extract into form"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Report / PDF</span>
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onNewReport();
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              New Report
            </button>
            <button
              onClick={loadReports}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
              title="Refresh Reports"
            >
              <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notice Ribbon */}
        {actionNotice && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-300 text-xs px-6 py-2 flex items-center justify-between animate-fadeIn">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Global Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by Applicant, Officer, Branch, SKOP No., Date, Location, Mobile, ID..."
                className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick My Reports Filter & Filter Toggle & Clear */}
            <div className="flex flex-wrap items-center gap-2">
              {activeOfficerSession?.officerName && (
                <button
                  type="button"
                  onClick={() => {
                    if (filterOfficer === activeOfficerSession.officerName) {
                      setFilterOfficer('');
                    } else {
                      setFilterOfficer(activeOfficerSession.officerName);
                    }
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                    filterOfficer === activeOfficerSession.officerName
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-1 ring-indigo-400/50'
                      : 'bg-slate-800 text-indigo-300 hover:text-white border-indigo-500/30 hover:bg-slate-700'
                  }`}
                  title="Filter to show only reports tagged with your officer name"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>My Reports</span>
                  {filterOfficer === activeOfficerSession.officerName && (
                    <span className="text-[10px] bg-white/20 px-1 rounded font-bold">Active</span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                  showAdvancedFilters || filterApplicant || filterSkop || filterLocation || filterOfficer || filterBranch
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
                {(filterApplicant || filterSkop || filterLocation || filterOfficer || filterBranch) && (
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                )}
              </button>

              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Collapsible Advanced Field Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80 animate-fadeIn">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Applicant Name
                </label>
                <input
                  type="text"
                  value={filterApplicant}
                  onChange={(e) => {
                    setFilterApplicant(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="e.g. Kulwant"
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Officer Name
                </label>
                <select
                  value={filterOfficer}
                  onChange={(e) => {
                    setFilterOfficer(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Officers</option>
                  {uniqueOfficers.map((off) => (
                    <option key={off} value={off}>
                      {off}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Branch Name
                </label>
                <select
                  value={filterBranch}
                  onChange={(e) => {
                    setFilterBranch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Branches</option>
                  {uniqueBranches.map((br) => (
                    <option key={br} value={br}>
                      {br}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  SKOP Number
                </label>
                <input
                  type="text"
                  value={filterSkop}
                  onChange={(e) => {
                    setFilterSkop(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="e.g. 48902154"
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Location / Village
                </label>
                <input
                  type="text"
                  value={filterLocation}
                  onChange={(e) => {
                    setFilterLocation(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="e.g. Beawar"
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Results Count & Current Active Filter Notice */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>
              Showing <strong className="text-slate-200">{filteredReports.length}</strong> matching{' '}
              {filteredReports.length === 1 ? 'report' : 'reports'}
            </span>
            {currentReportId && (
              <span className="text-[11px] text-amber-400/90 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                Currently editing report: <code className="text-amber-300 font-mono">{currentReportId}</code>
              </span>
            )}
          </div>
        </div>

        {/* Reports Table Area */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <RotateCcw className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-sm">Connecting to Firestore & fetching saved records...</p>
            </div>
          ) : error ? (
            <div className="p-10 text-center text-red-400 space-y-3">
              <p className="font-semibold">Error Loading Reports</p>
              <p className="text-xs text-red-300/80 max-w-md mx-auto">{error}</p>
              <button
                onClick={loadReports}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700"
              >
                Retry
              </button>
            </div>
          ) : paginatedReports.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-base font-semibold text-slate-300">No Reports Found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {reports.length === 0
                  ? 'No PD reports have been saved to the database yet. Click "Save Report" in the top bar to save your current report.'
                  : 'No saved reports matched your search criteria. Try clearing or relaxing your filters.'}
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                {reports.length > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                  >
                    Clear All Filters
                  </button>
                )}
                {onOpenUploadModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenUploadModal();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition shadow"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Report / PDF</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider text-[10px] font-bold sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th
                      onClick={() => handleSort('visitDate')}
                      className="py-3 px-4 cursor-pointer hover:text-white transition-colors select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Report Date</span>
                        {sortField === 'visitDate' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('customerName')}
                      className="py-3 px-4 cursor-pointer hover:text-white transition-colors select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Applicant Name</span>
                        {sortField === 'customerName' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4">SKOP Number</th>
                    <th className="py-3 px-4">Officer & Branch</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Mobile Number</th>
                    <th
                      onClick={() => handleSort('updatedAt')}
                      className="py-3 px-4 cursor-pointer hover:text-white transition-colors select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Last Updated</span>
                        {sortField === 'updatedAt' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {paginatedReports.map((record) => {
                    const isCurrent = record.id === currentReportId;
                    const formattedUpdated = record.updatedAt
                      ? new Date(record.updatedAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Unknown';

                    return (
                      <tr
                        key={record.id}
                        className={`hover:bg-slate-800/60 transition-colors ${
                          isCurrent ? 'bg-emerald-950/20 border-l-2 border-emerald-500' : ''
                        }`}
                      >
                        {/* Report Date */}
                        <td className="py-3 px-4 font-mono font-medium text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{record.visitDate || 'No date'}</span>
                          </div>
                        </td>

                        {/* Applicant Name */}
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-semibold text-white text-[13px] block">
                              {record.customerName || 'Unnamed'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              ID: {record.id}
                            </span>
                          </div>
                        </td>

                        {/* SKOP Number */}
                        <td className="py-3 px-4 font-mono font-bold text-amber-400/90">
                          {record.shopNo || '-'}
                        </td>

                        {/* Officer & Branch */}
                        <td className="py-3 px-4">
                          {(() => {
                            const offName =
                              record.officerName ||
                              record.officer_name ||
                              record.reportData?.officerName ||
                              record.reportData?.officer_name ||
                              record.reportData?.pdAuthorisedPerson ||
                              '';
                            const brName =
                              record.branchName ||
                              record.branch_name ||
                              record.reportData?.branchName ||
                              record.reportData?.branch_name ||
                              '';
                            const isMyReport = Boolean(
                              activeOfficerSession?.officerName &&
                              offName &&
                              offName.toLowerCase() === activeOfficerSession.officerName.toLowerCase()
                            );

                            return (
                              <div className="space-y-0.5 max-w-[170px]">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                                  <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                  <span className="truncate" title={offName || 'Unassigned'}>
                                    {offName || <span className="text-slate-500 font-normal italic">Unassigned</span>}
                                  </span>
                                  {isMyReport && (
                                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1 rounded font-bold shrink-0">
                                      You
                                    </span>
                                  )}
                                </div>
                                {brName ? (
                                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                    <Building2 className="w-3 h-3 text-blue-400 shrink-0" />
                                    <span className="truncate" title={brName}>
                                      {brName}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-slate-600 italic">No branch</div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-slate-300 max-w-[180px] truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate" title={record.visitLocation}>
                              {record.visitLocation || '-'}
                            </span>
                          </div>
                        </td>

                        {/* Mobile Number */}
                        <td className="py-3 px-4 font-mono text-slate-300">
                          <div className="flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{record.contactNumbers || '-'}</span>
                          </div>
                        </td>

                        {/* Last Updated */}
                        <td className="py-3 px-4 text-[11px] text-slate-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{formattedUpdated}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                onOpenReport(record);
                                onClose();
                              }}
                              className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors inline-flex items-center gap-1 shadow-sm"
                              title="Open & Edit this report"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Open</span>
                            </button>

                            <button
                              onClick={() => handleDuplicate(record)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors"
                              title="Duplicate Report"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeleteCandidate(record)}
                              className="p-1.5 bg-slate-800 hover:bg-red-950/70 text-slate-400 hover:text-red-400 border border-slate-700/60 rounded transition-colors"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-200">
              {filteredReports.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-200">
              {Math.min(currentPage * pageSize, filteredReports.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-200">{filteredReports.length}</span> reports
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="px-2 font-medium text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 flex items-center gap-1 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {deleteCandidate && (
          <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-red-500/40 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Permanently Delete Report?</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Are you sure you want to delete the report for{' '}
                    <strong className="text-white">{deleteCandidate.customerName || 'Unnamed'}</strong> (SKOP:{' '}
                    {deleteCandidate.shopNo || 'NA'})?
                  </p>
                  <p className="text-[11px] text-red-400/80 mt-1.5 font-medium">
                    This action cannot be undone. All report notes, CIBIL, and underwriting data will be erased from Firestore.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteCandidate(null)}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
                >
                  {isDeleting ? <RotateCcw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
