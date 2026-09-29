// src/pages/user/CoinHistoryPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import { listCoinTransactions } from '../../api/user/coins';
import type {
  CoinTransaction,
  CoinTransactionStatus,
  CoinTransactionType,
} from '../../types/user/coins';
import './style/CoinHistoryPage.css';

// ─── Helpers ──────────────────────────────────────────────────────────────
const formatTxnDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ─── Page ─────────────────────────────────────────────────────────────────
const CoinHistoryPage = () => {
  const navigate = useNavigate();
  const { gameCoins, refreshUserData } = useUserAuth();

  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<'' | CoinTransactionType>('');
  const [statusFilter, setStatusFilter] = useState<'' | CoinTransactionStatus>('');

  // ─── Fetch ──────────────────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listCoinTransactions({
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      if (res.result === 'success' && Array.isArray(res.data)) {
        setTransactions(res.data);
      } else {
        setError(res.message || 'Failed to load coin history');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    refreshUserData();
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTransactions]);

  return (
    <div className="coin-history-page">
      {/* Header */}
      <div className="coin-history-page__header">
        <button
          className="coin-history-page__back"
          onClick={() => navigate('/wallet')}
        >
          <i className="bi bi-arrow-left" /> Back
        </button>
        <h1>Game Coin History</h1>
        <p>Track all your coin earnings and conversions</p>
      </div>

      {/* Balance summary */}
      <div className="coin-balance-card">
        <div className="coin-balance-card__label">Current Coin Balance</div>
        <div className="coin-balance-card__amount">
          <i className="bi bi-coin" />
          <span>{gameCoins}</span>
        </div>
        <Link to="/wallet" className="coin-balance-card__cta">
          <i className="bi bi-arrow-left-right" /> Convert to Wallet
        </Link>
      </div>

      {/* Filters */}
      <div className="coin-history-page__filters">
        <div className="coin-history-page__filter-group">
          <span className="coin-history-page__filter-label">Type</span>
          <div className="coin-history-page__chips">
            <button
              className={`coin-history-page__chip ${typeFilter === '' ? 'active' : ''}`}
              onClick={() => setTypeFilter('')}
            >All</button>
            <button
              className={`coin-history-page__chip ${typeFilter === 'credit' ? 'active' : ''}`}
              onClick={() => setTypeFilter('credit')}
            >Earned</button>
            <button
              className={`coin-history-page__chip ${typeFilter === 'debit' ? 'active' : ''}`}
              onClick={() => setTypeFilter('debit')}
            >Used</button>
          </div>
        </div>

        <div className="coin-history-page__filter-group">
          <span className="coin-history-page__filter-label">Status</span>
          <div className="coin-history-page__chips">
            <button
              className={`coin-history-page__chip ${statusFilter === '' ? 'active' : ''}`}
              onClick={() => setStatusFilter('')}
            >All</button>
            <button
              className={`coin-history-page__chip ${statusFilter === 'success' ? 'active' : ''}`}
              onClick={() => setStatusFilter('success')}
            >Success</button>
            <button
              className={`coin-history-page__chip ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >Pending</button>
            <button
              className={`coin-history-page__chip ${statusFilter === 'failed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('failed')}
            >Failed</button>
          </div>
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="coin-history-page__loading">
          <div className="spinner-border text-success" role="status" />
          <p>Loading coin history...</p>
        </div>
      )}

      {error && !loading && (
        <div className="coin-history-page__error">
          <i className="bi bi-exclamation-triangle-fill" />
          <p>{error}</p>
          <button onClick={fetchTransactions}>Retry</button>
        </div>
      )}

      {!loading && !error && transactions.length === 0 && (
        <div className="coin-history-page__empty">
          <i className="bi bi-coin" />
          <h3>No coin transactions yet</h3>
          <p>
            {typeFilter || statusFilter
              ? 'Try changing the filters'
              : 'Earn coins by playing games and referring friends'}
          </p>
        </div>
      )}

      {/* List */}
      {!loading && !error && transactions.length > 0 && (
        <div className="coin-history-page__list">
          {transactions.map((txn) => (
            <div key={txn.id} className="coin-txn-row">
              <div className={`coin-txn-row__icon coin-txn-row__icon--${txn.transaction_type}`}>
                <i className={`bi bi-${txn.transaction_type === 'credit' ? 'plus-lg' : 'dash-lg'}`} />
              </div>

              <div className="coin-txn-row__body">
                <div className="coin-txn-row__desc">{txn.description}</div>

                <div className="coin-txn-row__meta">
                  <span>{formatTxnDate(txn.created_at)}</span>
                  <span className="coin-txn-row__dot">·</span>
                  <span className="coin-txn-row__ref">Ref: {txn.reference_id}</span>
                </div>

                {/* Booking link if linked */}
                {txn.booking && (
                  <Link
                    to="/bookings"
                    className="coin-txn-row__booking-link"
                  >
                    <i className="bi bi-calendar-event" />
                    {txn.booking.booking_id || 'View Booking'}
                  </Link>
                )}
              </div>

              <div className="coin-txn-row__right">
                <div className={`coin-txn-row__amount coin-txn-row__amount--${txn.transaction_type}`}>
                  {txn.transaction_type === 'credit' ? '+' : '−'}{txn.amount}
                  <i className="bi bi-coin" />
                </div>
                <span className={`coin-txn-row__status coin-txn-row__status--${txn.status}`}>
                  {txn.status}
                </span>
                <div className="coin-txn-row__balance">
                  Balance: <strong>{txn.current_balance}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoinHistoryPage;