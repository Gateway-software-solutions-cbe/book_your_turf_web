// src/pages/admin/NotificationsPage.tsx
import React, { useEffect, useState, useMemo, type FormEvent, useCallback } from 'react';
import { getNotificationHistory, sendNotification } from '../../api/notifications';
import { listPartners } from '../../api/partners';
import { listUsers } from '../../api/users';
import type { NotificationRecord, FilterType } from '../../types/notification';
import type { Partner } from '../../types/partner';
import type { User } from '../../types/user';

// ─── Constants ─────────────────────────────────────────────────────────────────
const HISTORY_PAGE_SIZE = 20;
const RECIPIENT_PAGE_SIZE = 20;

const FILTER_TYPES: { value: FilterType; label: string; icon: string }[] = [
  { value: 'all_users', label: 'All Users', icon: 'bi-people' },
  { value: 'all_partners', label: 'All Partners', icon: 'bi-building' },
  { value: 'specific_users', label: 'Specific Users', icon: 'bi-person' },
  { value: 'specific_partners', label: 'Specific Partners', icon: 'bi-person-badge' },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const typeLabel = (type: string) =>
  type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Recipient Picker ──────────────────────────────────────────────────────────
const RecipientPicker: React.FC<{
  filterType: FilterType;
  selectedIds: number[];
  onToggle: (id: number) => void;
  onClearAll: () => void;
}> = ({ filterType, selectedIds, onToggle, onClearAll }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [partnerPage, setPartnerPage] = useState(1);
  const [userTotalCount, setUserTotalCount] = useState(0);
  const [partnerTotalCount, setPartnerTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const isSpecificPartners = filterType === 'specific_partners';
  const isSpecificUsers = filterType === 'specific_users';

  // Fetch Users with pagination
  const fetchUsers = useCallback(async (page: number, search: string = '') => {
    if (isSpecificUsers) {
      setIsLoading(true);
      try {
        const params: any = { page, page_size: RECIPIENT_PAGE_SIZE };
        if (search) params.search = search;
        const data = await listUsers(params);
        setUsers(prev => page === 1 ? data.results || [] : [...prev, ...(data.results || [])]);
        setUserTotalCount(data.count || 0);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isSpecificUsers]);

  // Fetch Partners with pagination
  const fetchPartners = useCallback(async (page: number, search: string = '') => {
    if (isSpecificPartners) {
      setIsLoading(true);
      try {
        // If listPartners doesn't support pagination, we need to filter client-side
        const allPartners = await listPartners();
        setPartners(allPartners);
        setPartnerTotalCount(allPartners.length);
      } catch (error) {
        console.error('Error fetching partners:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isSpecificPartners]);

  // Initial fetch
  useEffect(() => {
    if (isSpecificUsers) {
      fetchUsers(1, recipientSearch);
    }
    if (isSpecificPartners) {
      fetchPartners(1, recipientSearch);
    }
  }, [isSpecificUsers, isSpecificPartners, fetchUsers, fetchPartners]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isSpecificUsers) {
        setUserPage(1);
        fetchUsers(1, recipientSearch);
      }
      if (isSpecificPartners) {
        setPartnerPage(1);
        fetchPartners(1, recipientSearch);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [recipientSearch, isSpecificUsers, isSpecificPartners, fetchUsers, fetchPartners]);

  if (!isSpecificPartners && !isSpecificUsers) return null;

  const q = recipientSearch.toLowerCase();

  // For Partners - client-side filtering
  const filteredPartners = isSpecificPartners
    ? partners.filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.number?.includes(q)
      )
    : [];

  // For Users - client-side filtering (since we already have them loaded)
  const filteredUsers = isSpecificUsers
    ? users.filter(
        (u) =>
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.number?.includes(q)
      )
    : [];

  const items: { id: number; primary: string; secondary: string }[] = isSpecificPartners
    ? filteredPartners.map((p) => ({ id: p.id, primary: p.name, secondary: p.email }))
    : filteredUsers.map((u) => ({ id: u.id, primary: u.name, secondary: u.email }));

  const totalCount = isSpecificPartners ? partnerTotalCount : userTotalCount;
  const hasMore = isSpecificUsers && items.length < totalCount && !isLoading;

  // Load more users (infinite scroll)
  const loadMore = () => {
    if (isSpecificUsers && !isLoading && hasMore) {
      const nextPage = userPage + 1;
      setUserPage(nextPage);
      fetchUsers(nextPage, recipientSearch);
    }
  };

  return (
    <div className="border rounded-3 p-3 bg-white shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-semibold text-dark">
          Select {isSpecificPartners ? 'Partners' : 'Users'}
          {selectedIds.length > 0 && (
            <span className="badge bg-success ms-2 rounded-pill">{selectedIds.length} selected</span>
          )}
          {!isLoading && (
            <span className="badge bg-light text-dark ms-2 rounded-pill">
              {totalCount} total
            </span>
          )}
        </span>
        {selectedIds.length > 0 && (
          <button
            type="button"
            className="btn btn-outline-danger btn-sm rounded-pill"
            onClick={onClearAll}
          >
            <i className="bi bi-x-circle me-1"></i>Clear all
          </button>
        )}
      </div>
      <div className="position-relative">
        <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary" style={{ fontSize: '0.875rem' }}></i>
        <input
          className="form-control form-control-sm ps-5 rounded-pill"
          type="search"
          placeholder={`Search ${isSpecificPartners ? 'partners' : 'users'} by name, email, phone…`}
          value={recipientSearch}
          onChange={(e) => setRecipientSearch(e.target.value)}
        />
      </div>
      {isLoading && (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      {!isLoading && items.length === 0 && (
        <p className="text-muted small mb-0 py-2 text-center">
          {recipientSearch ? 'No results match your search.' : `No ${isSpecificPartners ? 'partners' : 'users'} found.`}
        </p>
      )}
      <div className="mt-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
        {items.map((item) => (
          <label
            key={item.id}
            className={`d-flex align-items-center gap-2 p-2 rounded-2 ${
              selectedIds.includes(item.id) ? 'bg-success bg-opacity-10 border border-success' : 'hover-bg-light'
            }`}
            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              onChange={() => onToggle(item.id)}
              className="form-check-input"
            />
            <div>
              <div className="fw-semibold small text-dark">{item.primary}</div>
              <div className="text-secondary small">{item.secondary}</div>
            </div>
          </label>
        ))}
        {isSpecificUsers && hasMore && (
          <div className="text-center py-2">
            <button
              className="btn btn-sm btn-outline-success rounded-pill px-3"
              onClick={loadMore}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  Loading...
                </>
              ) : (
                <>
                  <i className="bi bi-chevron-down me-1"></i>
                  Load More
                </>
              )}
            </button>
          </div>
        )}
      </div>
      {!isLoading && items.length > 0 && (
        <div className="text-secondary small mt-2 text-center border-top pt-2">
          Showing {items.length} of {totalCount} {isSpecificPartners ? 'partners' : 'users'}
        </div>
      )}
    </div>
  );
};

// ─── Pagination ────────────────────────────────────────────────────────────────
const Pagination: React.FC<{
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}> = ({ page, total, pageSize, onChange }) => {
  const totalPages = Math.ceil(total / pageSize);
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
    <nav aria-label="History pagination">
      <ul className="pagination pagination-sm mb-0 flex-wrap">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button className="page-link rounded-start" disabled={page === 1} onClick={() => onChange(page - 1)}>
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
          <button className="page-link rounded-end" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
            <i className="bi bi-chevron-right"></i>
          </button>
        </li>
      </ul>
    </nav>
  );
};

// ─── NotificationsPage ─────────────────────────────────────────────────────────
const NotificationsPage: React.FC = () => {
  // ── Send form ──────────────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all_users');
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendMessage, setSendMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    body?: string;
    recipients?: string;
  }>({});

  // ── History ────────────────────────────────────────────────────────────────
  const [history, setHistory] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [histError, setHistError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [histPage, setHistPage] = useState(1);

  const fetchHistory = () => {
    setIsLoading(true);
    setHistError(null);
    getNotificationHistory()
      .then((res) => setHistory(res.data ?? []))
      .catch(() => setHistError('Failed to load notification history.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setHistPage(1);
  }, [searchQuery]);

  // Reset recipient selection when filter type changes
  useEffect(() => {
    setSelectedRecipients([]);
  }, [filterType]);

  // ── Toggle recipient ───────────────────────────────────────────────────────
  const toggleRecipient = (id: number) =>
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const clearAllRecipients = () => setSelectedRecipients([]);

  // ── Send handler ───────────────────────────────────────────────────────────
  const handleSend = async (e: FormEvent) => {
    e.preventDefault();

    const errs: typeof formErrors = {};
    if (!title.trim()) errs.title = 'Title is required.';
    if (!body.trim()) errs.body = 'Message body is required.';
    if (
      (filterType === 'specific_partners' || filterType === 'specific_users') &&
      selectedRecipients.length === 0
    ) {
      errs.recipients = 'Select at least one recipient.';
    }
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }

    setIsSending(true);
    setSendError(null);
    setSendSuccess(false);
    setSendMessage(null);

    let filterData: Record<string, unknown> = {};

    switch (filterType) {
      case 'specific_users':
        filterData = { user_ids: selectedRecipients };
        break;
      case 'specific_partners':
        filterData = { partner_ids: selectedRecipients };
        break;
      case 'all_users':
      case 'all_partners':
        filterData = {};
        break;
      default:
        filterData = {};
    }

    try {
      const response = await sendNotification({
        title,
        body,
        filter_type: filterType,
        filter_data: filterData,
      });

      if (response && (response as { message?: string }).message) {
        setSendMessage((response as { message: string }).message);
      } else {
        setSendSuccess(true);
      }

      setTitle('');
      setBody('');
      setFilterType('all_users');
      setSelectedRecipients([]);
      setFormErrors({});

      setTimeout(() => {
        fetchHistory();
        setSendSuccess(false);
        setSendMessage(null);
      }, 3000);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to send notification.';
      setSendError(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  // ── Filtered + paginated history ───────────────────────────────────────────
  const filteredHistory = useMemo(
    () =>
      history.filter((n) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.recipient.toLowerCase().includes(q) ||
          n.type.toLowerCase().includes(q)
        );
      }),
    [history, searchQuery]
  );

  const paginatedHistory = useMemo(() => {
    const start = (histPage - 1) * HISTORY_PAGE_SIZE;
    return filteredHistory.slice(start, start + HISTORY_PAGE_SIZE);
  }, [filteredHistory, histPage]);

  const needsRecipientPicker =
    filterType === 'specific_partners' || filterType === 'specific_users';

  return (
    <div className="container-fluid px-3 px-md-4 py-3 py-md-4" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h1 className="h3 mb-0 fw-bold">
            <i className="bi bi-bell text-success me-2"></i>Notifications
          </h1>
          <p className="text-secondary small mb-0">Send push notifications to users and partners</p>
        </div>
      </div>

      {/* ── Premium Send Notification Form ────────────────────────────────── */}
      <div className="card border-0 shadow-lg mb-4 overflow-hidden" style={{ borderRadius: '20px' }}>
        <div className="card-header bg-white border-0 pt-4 pb-0 px-4">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-success bg-opacity-10 rounded-3 p-3 d-flex align-items-center justify-content-center">
              <i className="bi bi-send text-success fs-4"></i>
            </div>
            <div>
              <h5 className="fw-bold mb-0 text-dark">Compose Notification</h5>
            </div>
          </div>
        </div>

        <div className="card-body p-4">
          {sendSuccess && (
            <div className="alert alert-success alert-dismissible fade show rounded-3 border-0 shadow-sm" role="alert">
              <div className="d-flex align-items-center">
                <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                <span>Notification sent successfully!</span>
              </div>
              <button type="button" className="btn-close" onClick={() => setSendSuccess(false)}></button>
            </div>
          )}

          {sendMessage && (
            <div className="alert alert-success alert-dismissible fade show rounded-3 border-0 shadow-sm" role="alert">
              <div className="d-flex align-items-center">
                <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                <span>{sendMessage}</span>
              </div>
              <button type="button" className="btn-close" onClick={() => setSendMessage(null)}></button>
            </div>
          )}

          {sendError && (
            <div className="alert alert-danger alert-dismissible fade show rounded-3 border-0 shadow-sm" role="alert">
              <div className="d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <span>{sendError}</span>
              </div>
              <button type="button" className="btn-close" onClick={() => setSendError(null)}></button>
            </div>
          )}

          <form onSubmit={handleSend} noValidate>
            {/* Recipient Type */}
            <div className="mb-4">
              <label className="form-label fw-semibold text-dark mb-2">
                <i className="bi bi-people me-2 text-success"></i>Recipients <span className="text-danger">*</span>
              </label>
              <div className="d-flex flex-wrap gap-2">
                {FILTER_TYPES.map((f) => (
                  <label
                    key={f.value}
                    className={`btn btn-sm rounded-pill px-4 py-2 fw-semibold ${
                      filterType === f.value 
                        ? 'btn-success text-white shadow-sm' 
                        : 'btn-outline-secondary bg-dark bg-opacity-10 text-dark hover-bg-light'
                    }`}
                    style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="filter_type"
                      value={f.value}
                      checked={filterType === f.value}
                      onChange={() => setFilterType(f.value)}
                      className="d-none"
                    />
                    <i className={`bi ${f.icon} me-2`}></i> {f.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Recipient Picker */}
            {needsRecipientPicker && (
              <div className="mb-4">
                <RecipientPicker
                  filterType={filterType}
                  selectedIds={selectedRecipients}
                  onToggle={toggleRecipient}
                  onClearAll={clearAllRecipients}
                />
                {formErrors.recipients && (
                  <div className="text-danger small mt-2">
                    <i className="bi bi-exclamation-circle me-1"></i>{formErrors.recipients}
                  </div>
                )}
              </div>
            )}

            {/* Title & Body - Two Column Layout */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark">
                  <i className="bi bi-tag me-2 text-success"></i>Title <span className="text-danger">*</span>
                </label>
                <div className="position-relative">
                  <input
                    className={`form-control form-control-lg rounded-5 ${formErrors.title ? 'is-invalid' : ''}`}
                    type="text"
                    placeholder="Enter notification title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setFormErrors((p) => ({ ...p, title: undefined }));
                    }}
                    style={{ paddingLeft: '3rem', borderColor: formErrors.title ? '#dc3545' : '#dee2e6' }}
                  />
                  <i className="bi bi-pencil position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                </div>
                {formErrors.title && <div className="invalid-feedback d-block">{formErrors.title}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold text-dark">
                  <i className="bi bi-chat-dots me-2 text-success"></i>Message <span className="text-danger">*</span>
                </label>
                <div className="position-relative">
                  <input
                    className={`form-control form-control-lg rounded-5 ${formErrors.body ? 'is-invalid' : ''}`}
                    type="text"
                    placeholder="Enter notification message"
                    value={body}
                    onChange={(e) => {
                      setBody(e.target.value);
                      setFormErrors((p) => ({ ...p, body: undefined }));
                    }}
                    style={{ paddingLeft: '3rem', borderColor: formErrors.body ? '#dc3545' : '#dee2e6' }}
                  />
                  <i className="bi bi-pencil-square position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                </div>
                {formErrors.body && <div className="invalid-feedback d-block">{formErrors.body}</div>}
              </div>
            </div>

            {/* Send Button */}
            <div className="d-flex justify-content-end">
              <button
                type="submit"
                className="btn btn-success btn-lg rounded-pill px-5 shadow-sm"
                disabled={isSending}
                style={{ fontWeight: 600, minWidth: '200px', minHeight: '30px' }}
              >
                {isSending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>Send Notification
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── History with 2-Column Grid ────────────────────────────────────── */}
      <div className="card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
        <div className="card-header bg-white border-0 pt-4 pb-0 px-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-secondary bg-opacity-10 rounded-3 p-3 d-flex align-items-center justify-content-center">
                <i className="bi bi-clock-history text-secondary fs-4"></i>
              </div>
              <div>
                <h5 className="fw-bold mb-0 text-dark">Notification History</h5>
                {!isLoading && (
                  <span className="text-secondary small">{filteredHistory.length} notifications sent</span>
                )}
              </div>
            </div>
            <div className="position-relative">
              <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
              <input
                className="form-control form-control-sm rounded-pill ps-5"
                type="search"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '220px', borderColor: '#dee2e6' }}
              />
            </div>
          </div>
        </div>

        <div className="card-body p-4">
          {/* Loading */}
          {isLoading && (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-secondary small">Loading history…</p>
            </div>
          )}

          {/* Error */}
          {histError && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between rounded-3 border-0 shadow-sm" role="alert">
              <div className="d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <span>{histError}</span>
              </div>
              <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={fetchHistory}>
                <i className="bi bi-arrow-repeat me-1"></i> Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !histError && filteredHistory.length === 0 && (
            <div className="text-center py-5">
              <div className="text-secondary">
                <i className="bi bi-bell-slash fs-1 d-block mb-3"></i>
                <p className="fw-semibold mb-1">{searchQuery ? 'No notifications match your search.' : 'No notifications sent yet.'}</p>
                <p className="small">Start sending notifications to see them here.</p>
              </div>
            </div>
          )}

          {/* History List - 2 Columns */}
          {!isLoading && !histError && paginatedHistory.length > 0 && (
            <>
              <div className="row g-3">
                {paginatedHistory.map((n, i) => (
                  <div key={i} className="col-md-6">
                    <div className="card h-100 border-0 shadow-sm hover-shadow-lg" style={{ borderRadius: '16px', transition: 'all 0.25s ease' }}>
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                          <span className="badge bg-secondary bg-opacity-10 text-dark rounded-pill px-3 py-2">
                            <i className="bi bi-tag me-1"></i>{typeLabel(n.type)}
                          </span>
                          <span className={`badge rounded-pill px-3 py-2 ${
                            n.status === 'success' ? 'bg-success bg-opacity-10 text-success' :
                            n.status === 'failed' ? 'bg-danger bg-opacity-10 text-danger' :
                            'bg-warning bg-opacity-10 text-warning'
                          }`}>
                            <span className={`d-inline-block rounded-circle me-1 ${
                              n.status === 'success' ? 'bg-success' :
                              n.status === 'failed' ? 'bg-danger' :
                              'bg-warning'
                            }`} style={{ width: '6px', height: '6px' }}></span>
                            {n.status}
                          </span>
                        </div>
                        <h6 className="fw-bold mb-1 text-dark">{n.title}</h6>
                        <p className="text-secondary small mb-2">{n.body}</p>
                        <div className="d-flex justify-content-between flex-wrap gap-2 text-secondary small pt-2 border-top">
                          <span><i className="bi bi-envelope me-1"></i> {n.recipient}</span>
                          <span><i className="bi bi-clock me-1"></i> {formatDate(n.sent_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mt-4 pt-2 border-top">
                <span className="small text-secondary">
                  <i className="bi bi-info-circle me-1"></i>
                  Showing {(histPage - 1) * HISTORY_PAGE_SIZE + 1}–
                  {Math.min(histPage * HISTORY_PAGE_SIZE, filteredHistory.length)} of {filteredHistory.length}
                </span>
                <Pagination
                  page={histPage}
                  total={filteredHistory.length}
                  pageSize={HISTORY_PAGE_SIZE}
                  onChange={setHistPage}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;