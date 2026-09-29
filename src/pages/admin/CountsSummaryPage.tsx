// src/pages/admin/CountsSummaryPage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { listUserFcmTokens, listPartnerFcmTokens } from '../../api/admin/fcm';
import type { UserFcmToken, PartnerFcmToken, FcmPlatform } from '../../types/admin/fcm';
import { exportData, sanitizeForExport, formatDateForExport } from '../../utils/exportUtils';
import * as XLSX from 'xlsx';

// ─── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

type ActiveTab = 'users' | 'partners';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const maskToken = (token: string) =>
  token ? `${token.slice(0, 12)}…${token.slice(-6)}` : '—';

// ─── Platform Badge ────────────────────────────────────────────────────────────
const PlatformBadge: React.FC<{ platform: string }> = ({ platform }) => {
  const config = {
    android: { class: 'bg-success', label: 'ANDROID' },
    ios: { class: 'bg-primary', label: 'iOS' },
  };
  const c = config[platform?.toLowerCase() as keyof typeof config] || config.android;
  return (
    <span className={`badge rounded-pill px-3 py-2 ${c.class}`}>
      <span className={`d-inline-block rounded-circle me-1 ${platform?.toLowerCase() === 'android' ? 'bg-white' : 'bg-white'}`} style={{ width: '6px', height: '6px' }}></span>
      {c.label}
    </span>
  );
};

// ─── Pagination ────────────────────────────────────────────────────────────────
const Pagination: React.FC<{
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}> = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  const pages: (number | '…')[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <nav aria-label="Token pagination">
      <ul className="pagination pagination-sm mb-0 flex-wrap">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button className="page-link" disabled={page === 1} onClick={() => onChange(page - 1)}>
            <i className="bi bi-chevron-left"></i>
          </button>
        </li>
        {pages.map((p, i) =>
          p === '…' ? (
            <li key={`e${i}`} className="page-item disabled">
              <span className="page-link">…</span>
            </li>
          ) : (
            <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
              <button className="page-link" onClick={() => onChange(p as number)}>
                {p}
              </button>
            </li>
          )
        )}
        <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
          <button className="page-link" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
            <i className="bi bi-chevron-right"></i>
          </button>
        </li>
      </ul>
    </nav>
  );
};

// ─── Logged-in Users Tab ───────────────────────────────────────────────────────
const LoggedInUsersTab: React.FC<{
  data: UserFcmToken[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onPlatformChange: (platform: FcmPlatform | '') => void;
  onRetry: () => void;
}> = ({ 
  data, 
  totalCount, 
  isLoading, 
  error, 
  onPageChange, 
  onSearch, 
  onPlatformChange,
  onRetry 
}) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState<FcmPlatform | ''>('');
  const [debSearch, setDebSearch] = useState('');

  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (val: string) => {
    setSearch(val);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => {
      setDebSearch(val);
      onSearch(val);
      setPage(1);
      onPageChange(1);
    }, 400);
  };

  const handlePlatformChange = (val: FcmPlatform | '') => {
    setPlatform(val);
    onPlatformChange(val);
    setPage(1);
    onPageChange(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    onPageChange(newPage);
  };

  const safeCount = totalCount ?? 0;
  const totalPages = Math.ceil(safeCount / PAGE_SIZE);
  const start = safeCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, safeCount);

  return (
    <div>
      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-wrap align-items-center gap-3">
            <div className="flex-grow-1 position-relative" style={{ minWidth: '160px' }}>
              <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
              <input
                className="form-control ps-5"
                type="search"
                placeholder="Search by name, email, phone, device, location…"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ borderRadius: '10px' }}
              />
            </div>
            <div className="d-flex gap-2 flex-wrap">
              {([
                ['', 'All'],
                ['android', 'Android'],
                ['ios', 'iOS'],
              ] as [string, string][]).map(([val, label]) => (
                <button
                  key={val}
                  className={`btn btn-sm rounded-pill px-3 ${platform === val ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => handlePlatformChange(val as FcmPlatform | '')}
                  style={{ fontWeight: 500 }}
                >
                  {label}
                </button>
              ))}
            </div>
            {!isLoading && (
              <span className="badge bg-light text-dark rounded-pill px-3 py-2 ms-auto">
                <i className="bi bi-devices me-1"></i>
                {safeCount.toLocaleString()} active device{safeCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── States ────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-secondary small">Loading devices…</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert" style={{ borderRadius: '12px' }}>
          <span className="small"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</span>
          <button className="btn btn-outline-danger btn-sm" onClick={onRetry}>
            <i className="bi bi-arrow-repeat me-1"></i> Retry
          </button>
        </div>
      )}

      {!isLoading && !error && data.length === 0 && (
        <div className="text-center py-5">
          <div className="text-secondary">
            <i className="bi bi-devices fs-1 d-block mb-3"></i>
            <p>No active user devices found.</p>
          </div>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {!isLoading && !error && data.length > 0 && (
        <>
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="table-responsive" style={{ overflowX: 'auto', overflowY: 'visible' }}>
              <table className="table table-hover align-middle mb-0" style={{ minWidth: '850px', fontSize: '12px' }}>
                <thead className="bg-light">
                  <tr>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '140px' }}>User</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '150px' }}>Device</th>
                    <th className="text-uppercase text-secondary fw-bold text-center" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '80px' }}>Platform</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '130px' }}>Location</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '130px' }}>Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((t) => (
                    <tr key={t.id}  style={{ fontSize: '14px' }}>
                      <td>
                        <div className="fw-semibold">{t.user_name.toUpperCase()}</div>
                        <div className="text-secondary">{t.user_email}</div>
                        <div className="text-secondary">{t.user_phone}</div>
                      </td>
                      <td>
                        <div className="fw-medium">{t.device_name}</div>
                        <div className="text-secondary">
                          <i className="bi bi-info-circle me-1"></i>OS {t.os_version} · {t.device_id}
                        </div>
                      </td>
                      <td className="text-center">
                        <PlatformBadge platform={t.platform} />
                      </td>
                      <td>
                        <div className="text-secondary small">{t.location || '—'}</div>
                      </td>
                      <td className="text-secondary small">
                        <i className="bi bi-clock me-1"></i>
                        {formatDate(t.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination ────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
              <span className="small text-secondary">
                <i className="bi bi-info-circle me-1"></i>
                Showing {start}–{end} of {safeCount.toLocaleString()}
              </span>
              <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Logged-in Partners Tab ────────────────────────────────────────────────────
const LoggedInPartnersTab: React.FC<{
  data: PartnerFcmToken[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onPlatformChange: (platform: FcmPlatform | '') => void;
  onRetry: () => void;
}> = ({ 
  data, 
  totalCount, 
  isLoading, 
  error, 
  onPageChange, 
  onSearch, 
  onPlatformChange,
  onRetry 
}) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState<FcmPlatform | ''>('');
  const [debSearch, setDebSearch] = useState('');

  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (val: string) => {
    setSearch(val);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => {
      setDebSearch(val);
      onSearch(val);
      setPage(1);
      onPageChange(1);
    }, 400);
  };

  const handlePlatformChange = (val: FcmPlatform | '') => {
    setPlatform(val);
    onPlatformChange(val);
    setPage(1);
    onPageChange(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    onPageChange(newPage);
  };

  const safeCount = totalCount ?? 0;
  const totalPages = Math.ceil(safeCount / PAGE_SIZE);
  const start = safeCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, safeCount);

  return (
    <div>
      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-wrap align-items-center gap-3">
            <div className="flex-grow-1 position-relative" style={{ minWidth: '160px' }}>
              <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
              <input
                className="form-control ps-5"
                type="search"
                placeholder="Search by name, email, business, device, location…"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ borderRadius: '10px' }}
              />
            </div>
            <div className="d-flex gap-2 flex-wrap">
              {([
                ['', 'All'],
                ['android', 'Android'],
                ['ios', 'iOS'],
              ] as [string, string][]).map(([val, label]) => (
                <button
                  key={val}
                  className={`btn btn-sm rounded-pill px-3 ${platform === val ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => handlePlatformChange(val as FcmPlatform | '')}
                  style={{ fontWeight: 500 }}
                >
                  {label}
                </button>
              ))}
            </div>
            {!isLoading && (
              <span className="badge bg-light text-dark rounded-pill px-3 py-2 ms-auto">
                <i className="bi bi-devices me-1"></i>
                {safeCount.toLocaleString()} active device{safeCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── States ────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-secondary small">Loading devices…</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert" style={{ borderRadius: '12px' }}>
          <span className="small"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</span>
          <button className="btn btn-outline-danger btn-sm" onClick={onRetry}>
            <i className="bi bi-arrow-repeat me-1"></i> Retry
          </button>
        </div>
      )}

      {!isLoading && !error && data.length === 0 && (
        <div className="text-center py-5">
          <div className="text-secondary">
            <i className="bi bi-devices fs-1 d-block mb-3"></i>
            <p>No active partner devices found.</p>
          </div>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {!isLoading && !error && data.length > 0 && (
        <>
          <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="table-responsive" style={{ overflowX: 'auto', overflowY: 'visible' }}>
              <table className="table table-hover align-middle mb-0" style={{ minWidth: '850px', fontSize: '12px' }}>
                <thead className="bg-light">
                  <tr>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '140px' }}>Partner</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '150px' }}>Device</th>
                    <th className="text-uppercase text-secondary fw-bold text-center" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '80px' }}>Platform</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '130px' }}>Location</th>
                    <th className="text-uppercase text-secondary fw-bold" style={{ fontSize: '10px', letterSpacing: '0.3px', width: '130px' }}>Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((t) => (
                    <tr key={t.id} style={{ fontSize: '14px' }}>
                      <td>
                        <div className="fw-semibold">{t.partner_name.toUpperCase()}</div>
                        <div className="text-secondary">{t.partner_email}</div>
                        {t.partner_business && (
                          <div className="text-secondary">{t.partner_business}</div>
                        )}
                      </td>
                      <td>
                        <div className="fw-medium">{t.device_name}</div>
                        <div className="text-secondary">
                          <i className="bi bi-info-circle me-1"></i>OS {t.os_version} · {t.device_id}
                        </div>
                      </td>
                      <td className="text-center">
                        <PlatformBadge platform={t.platform} />
                      </td>
                      <td>
                        <div className="text-secondary small">{t.location || '—'}</div>
                      </td>
                      <td className="text-secondary small">
                        <i className="bi bi-clock me-1"></i>
                        {formatDate(t.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination ────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
              <span className="small text-secondary">
                <i className="bi bi-info-circle me-1"></i>
                Showing {start}–{end} of {safeCount.toLocaleString()}
              </span>
              <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── CountsSummaryPage ─────────────────────────────────────────────────────────
const CountsSummaryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('users');
  
  // User data state
  const [userData, setUserData] = useState<UserFcmToken[]>([]);
  const [userTotalCount, setUserTotalCount] = useState(0);
  const [userIsLoading, setUserIsLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userPlatform, setUserPlatform] = useState<FcmPlatform | ''>('');

  // Partner data state
  const [partnerData, setPartnerData] = useState<PartnerFcmToken[]>([]);
  const [partnerTotalCount, setPartnerTotalCount] = useState(0);
  const [partnerIsLoading, setPartnerIsLoading] = useState(true);
  const [partnerError, setPartnerError] = useState<string | null>(null);
  const [partnerPage, setPartnerPage] = useState(1);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerPlatform, setPartnerPlatform] = useState<FcmPlatform | ''>('');

  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // ── Fetch Users ──────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setUserIsLoading(true);
    setUserError(null);
    try {
      const data = await listUserFcmTokens({
        page: userPage,
        page_size: PAGE_SIZE,
        ...(userSearch ? { search: userSearch } : {}),
        ...(userPlatform ? { platform: userPlatform } : {}),
      });
      setUserData(data.results ?? []);
      setUserTotalCount(data.count ?? 0);
    } catch (err) {
      setUserError('Failed to load logged-in user devices.');
      setUserData([]);
      setUserTotalCount(0);
    } finally {
      setUserIsLoading(false);
    }
  }, [userPage, userSearch, userPlatform]);

  // ── Fetch Partners ────────────────────────────────────────────────────────────
  const fetchPartners = useCallback(async () => {
    setPartnerIsLoading(true);
    setPartnerError(null);
    try {
      const data = await listPartnerFcmTokens({
        page: partnerPage,
        page_size: PAGE_SIZE,
        ...(partnerSearch ? { search: partnerSearch } : {}),
        ...(partnerPlatform ? { platform: partnerPlatform } : {}),
      });
      setPartnerData(data.results ?? []);
      setPartnerTotalCount(data.count ?? 0);
    } catch (err) {
      setPartnerError('Failed to load logged-in partner devices.');
      setPartnerData([]);
      setPartnerTotalCount(0);
    } finally {
      setPartnerIsLoading(false);
    }
  }, [partnerPage, partnerSearch, partnerPlatform]);

  // ── Fetch all data for export ───────────────────────────────────────────────
  const fetchAllDataForExport = useCallback(async (
    type: 'users' | 'partners',
    search?: string,
    platform?: FcmPlatform | ''
  ) => {
    let page = 1;
    let allResults: any[] = [];
    let hasMore = true;
    const maxPageSize = 100; // Adjust based on your API's max page size

    while (hasMore) {
      try {
        const params: any = {
          page,
          page_size: maxPageSize,
          ...(search ? { search } : {}),
          ...(platform ? { platform } : {}),
        };

        let data;
        if (type === 'users') {
          data = await listUserFcmTokens(params);
        } else {
          data = await listPartnerFcmTokens(params);
        }

        const results = data.results ?? [];
        allResults = [...allResults, ...results];
        hasMore = data.next !== null && results.length > 0;
        page++;

        // Safety check to prevent infinite loops
        if (page > 100) break;
      } catch (error) {
        console.error(`Error fetching ${type} for export:`, error);
        break;
      }
    }

    return allResults;
  }, []);

  // ── Get User Export Data ─────────────────────────────────────────────────────
  const getUserExportData = useCallback((data: UserFcmToken[]) => {
    return sanitizeForExport(
      data.map(t => ({
        'User Name': t.user_name || '',
        'User Email': t.user_email || '',
        'User Phone': t.user_phone || '',
        'Device Name': t.device_name || '',
        'Device ID': t.device_id || '',
        'Platform': t.platform || '',
        'OS Version': t.os_version || '',
        'Location': t.location || '',
        'Token': t.token || '',
        'Last Seen': formatDateForExport(t.updated_at),
        'Created Date': formatDateForExport(t.created_at),
      }))
    );
  }, []);

  // ── Get Partner Export Data ──────────────────────────────────────────────────
  const getPartnerExportData = useCallback((data: PartnerFcmToken[]) => {
    return sanitizeForExport(
      data.map(t => ({
        'Partner Name': t.partner_name || '',
        'Partner Email': t.partner_email || '',
        'Partner Business': t.partner_business || '',
        'Device Name': t.device_name || '',
        'Device ID': t.device_id || '',
        'Platform': t.platform || '',
        'OS Version': t.os_version || '',
        'Location': t.location || '',
        'Token': t.token || '',
        'Last Seen': formatDateForExport(t.updated_at),
        'Created Date': formatDateForExport(t.created_at),
      }))
    );
  }, []);

  // ── Export Combined ──────────────────────────────────────────────────────────
  const handleExportCombined = async () => {
    setIsExporting(true);
    setShowExportMenu(false);
    
    try {
      const [allUsers, allPartners] = await Promise.all([
        fetchAllDataForExport('users', userSearch, userPlatform),
        fetchAllDataForExport('partners', partnerSearch, partnerPlatform)
      ]);

      if (allUsers.length === 0 && allPartners.length === 0) {
        alert('No data to export.');
        setIsExporting(false);
        return;
      }

      const workbook = XLSX.utils.book_new();
      
      if (allUsers.length > 0) {
        const userExportData = getUserExportData(allUsers);
        const userSheet = XLSX.utils.json_to_sheet(userExportData);
        XLSX.utils.book_append_sheet(workbook, userSheet, 'Users');
      }
      
      if (allPartners.length > 0) {
        const partnerExportData = getPartnerExportData(allPartners);
        const partnerSheet = XLSX.utils.json_to_sheet(partnerExportData);
        XLSX.utils.book_append_sheet(workbook, partnerSheet, 'Partners');
      }
      
      const summaryData = [
        { 'Type': 'Users', 'Active Devices': allUsers.length },
        { 'Type': 'Partners', 'Active Devices': allPartners.length },
        { 'Type': 'Total', 'Active Devices': allUsers.length + allPartners.length },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      XLSX.writeFile(workbook, `active_sessions_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // ── Export Users Only ────────────────────────────────────────────────────────
  const handleExportUsers = async () => {
    setIsExporting(true);
    setShowExportMenu(false);
    
    try {
      const allUsers = await fetchAllDataForExport('users', userSearch, userPlatform);
      
      if (allUsers.length === 0) {
        alert('No user data to export.');
        setIsExporting(false);
        return;
      }

      const exportDataArray = getUserExportData(allUsers);
      exportData(exportDataArray, {
        fileName: `user_sessions_export_${new Date().toISOString().split('T')[0]}`,
        format: 'excel',
        sheetName: 'Users',
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // ── Export Partners Only ─────────────────────────────────────────────────────
  const handleExportPartners = async () => {
    setIsExporting(true);
    setShowExportMenu(false);
    
    try {
      const allPartners = await fetchAllDataForExport('partners', partnerSearch, partnerPlatform);
      
      if (allPartners.length === 0) {
        alert('No partner data to export.');
        setIsExporting(false);
        return;
      }

      const exportDataArray = getPartnerExportData(allPartners);
      exportData(exportDataArray, {
        fileName: `partner_sessions_export_${new Date().toISOString().split('T')[0]}`,
        format: 'excel',
        sheetName: 'Partners',
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // ── Fetch both on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchUsers();
    fetchPartners();
  }, []);

  // ── Fetch when dependencies change ──────────────────────────────────────────
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // ── Close dropdown when clicking outside ────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showExportMenu && !target.closest('.export-dropdown-container')) {
        setShowExportMenu(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showExportMenu]);

  return (
    <div className="container-fluid px-3 px-md-4 py-3 py-md-4" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
        <div>
          <h3 className="h3 mb-0">
            <i className="bi bi-people text-success me-2"></i>Active Sessions
          </h3>
          <p className="text-secondary small mb-0">
            Currently logged-in users and channel partners by device
          </p>
        </div>
        <div className="d-flex gap-2">
          <div className="export-dropdown-container position-relative">
            <button
              className="btn btn-outline-success rounded-pill px-3"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting || (userData.length === 0 && partnerData.length === 0)}
              style={{ fontWeight: 500 }}
            >
              {isExporting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Exporting...
                </>
              ) : (
                <>
                  <i className="bi bi-download me-1"></i>
                  Export
                  <i className="bi bi-chevron-down ms-1"></i>
                </>
              )}
            </button>
            {showExportMenu && (
              <div 
                className="position-absolute end-0 mt-1 bg-white border rounded-3 shadow-sm"
                style={{ 
                  minWidth: '240px', 
                  zIndex: 1050,
                  animation: 'fadeInDown 0.2s ease-out'
                }}
              >
                <button
                  className="dropdown-item d-flex align-items-center px-3 py-2 w-100 border-0 bg-transparent"
                  onClick={handleExportCombined}
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-file-earmark-excel me-2 text-success fs-5"></i>
                  <div className="text-start">
                    <div className="small fw-semibold">Combined Export</div>
                    <div className="text-secondary small">Users + Partners in one file</div>
                  </div>
                </button>
                <hr className="my-1" />
                <button
                  className="dropdown-item d-flex align-items-center px-3 py-2 w-100 border-0 bg-transparent"
                  onClick={handleExportUsers}
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-people me-2 text-primary fs-5"></i>
                  <div className="text-start">
                    <div className="small fw-semibold">Users Only</div>
                    <div className="text-secondary small">{userTotalCount} active devices</div>
                  </div>
                </button>
                <button
                  className="dropdown-item d-flex align-items-center px-3 py-2 w-100 border-0 bg-transparent"
                  onClick={handleExportPartners}
                  style={{ cursor: 'pointer' }}
                >
                  <i className="bi bi-person-badge me-2 text-warning fs-5"></i>
                  <div className="text-start">
                    <div className="small fw-semibold">Partners Only</div>
                    <div className="text-secondary small">{partnerTotalCount} active devices</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Centered Tabs ────────────────────────────────────────────────── */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
        <div className="card-body p-2 d-flex">
          <div className="d-flex gap-2" style={{ maxWidth: '950px', width: '100%' }}>
            <button
              className={`btn flex-fill rounded-pill py-2 justify-content-center ${activeTab === 'users' ? 'btn-success text-white shadow-sm' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('users')}
              style={{ fontWeight: 500, transition: 'all 0.2s ease' }}
            >
              <i className="bi bi-people me-1"></i> Logged-in Users
              <span className="badge bg-light text-dark ms-1 rounded-pill">{userTotalCount}</span>
            </button>
            <button
              className={`btn flex-fill rounded-pill py-2 justify-content-center ${activeTab === 'partners' ? 'btn-success text-white shadow-sm' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('partners')}
              style={{ fontWeight: 500, transition: 'all 0.2s ease' }}
            >
              <i className="bi bi-person-badge me-1"></i> Logged-in Partners
              <span className="badge bg-light text-dark ms-1 rounded-pill">{partnerTotalCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <LoggedInUsersTab
          data={userData}
          totalCount={userTotalCount}
          isLoading={userIsLoading}
          error={userError}
          onPageChange={setUserPage}
          onSearch={setUserSearch}
          onPlatformChange={setUserPlatform}
          onRetry={fetchUsers}
        />
      )}
      {activeTab === 'partners' && (
        <LoggedInPartnersTab
          data={partnerData}
          totalCount={partnerTotalCount}
          isLoading={partnerIsLoading}
          error={partnerError}
          onPageChange={setPartnerPage}
          onSearch={setPartnerSearch}
          onPlatformChange={setPartnerPlatform}
          onRetry={fetchPartners}
        />
      )}

      {/* ─── Add Animate.css ────────────────────────────────────────────────── */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" />
      
      {/* ─── Custom Styles ──────────────────────────────────────────────────── */}
      <style>{`
        .dropdown-item {
          transition: background-color 0.15s ease;
        }
        .dropdown-item:hover {
          background-color: #f8f9fa;
        }
        .dropdown-item:active {
          background-color: #198754;
          color: white;
        }
        .dropdown-item:active i {
          color: white !important;
        }
        .dropdown-item:active .text-secondary {
          color: rgba(255,255,255,0.8) !important;
        }
        .btn-success {
          transition: all 0.2s ease;
        }
        .btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(25, 135, 84, 0.3) !important;
        }
        .btn-outline-success {
          transition: all 0.2s ease;
        }
        .btn-outline-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(25, 135, 84, 0.15) !important;
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CountsSummaryPage;