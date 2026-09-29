// src/pages/user/WalletTransactionsPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listWalletTransactions } from '../../api/user/wallet';
import type {
  WalletTransaction,
  WalletTransactionStatus,
  WalletTransactionType,
} from '../../types/user/wallet';
import './style/WalletTransactionsPage.css';

// ─── Helpers ──────────────────────────────────────────────────────────────
const formatCurrency = (value: string | number) => {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(n) ? '0.00' : n.toFixed(2);
};

const formatTxnDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const WalletTransactionsPage = () => {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<'' | WalletTransactionType>('');
  const [statusFilter, setStatusFilter] = useState<'' | WalletTransactionStatus>('');

  // ─── Fetch ──────────────────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listWalletTransactions({
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      if (res.result === 'success' && Array.isArray(res.data)) {
        setTransactions(res.data);
      } else {
        setError(res.message || 'Failed to load transactions');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="wallet-txn-page">
      {/* Header */}
      <div className="wallet-txn-page__header">
        <button className="wallet-txn-page__back" onClick={() => navigate('/wallet')}>
          <i className="bi bi-arrow-left" /> Back to Wallet
        </button>
        <h1>Wallet Transactions</h1>
        <p>All your credits and debits</p>
      </div>

      {/* Filters */}
      <div className="wallet-txn-page__filters">
        <div className="wallet-txn-page__filter-group">
          <span className="wallet-txn-page__filter-label">Type</span>
          <div className="wallet-txn-page__chips">
            <button
              className={`wallet-txn-page__chip ${typeFilter === '' ? 'active' : ''}`}
              onClick={() => setTypeFilter('')}
            >All</button>
            <button
              className={`wallet-txn-page__chip ${typeFilter === 'credit' ? 'active' : ''}`}
              onClick={() => setTypeFilter('credit')}
            >Credit</button>
            <button
              className={`wallet-txn-page__chip ${typeFilter === 'debit' ? 'active' : ''}`}
              onClick={() => setTypeFilter('debit')}
            >Debit</button>
          </div>
        </div>

        <div className="wallet-txn-page__filter-group">
          <span className="wallet-txn-page__filter-label">Status</span>
          <div className="wallet-txn-page__chips">
            <button
              className={`wallet-txn-page__chip ${statusFilter === '' ? 'active' : ''}`}
              onClick={() => setStatusFilter('')}
            >All</button>
            <button
              className={`wallet-txn-page__chip ${statusFilter === 'success' ? 'active' : ''}`}
              onClick={() => setStatusFilter('success')}
            >Success</button>
            <button
              className={`wallet-txn-page__chip ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >Pending</button>
            <button
              className={`wallet-txn-page__chip ${statusFilter === 'failed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('failed')}
            >Failed</button>
          </div>
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="wallet-txn-page__loading">
          <div className="spinner-border text-success" role="status" />
          <p>Loading transactions...</p>
        </div>
      )}

      {error && !loading && (
        <div className="wallet-txn-page__error">
          <i className="bi bi-exclamation-triangle-fill" />
          <p>{error}</p>
          <button onClick={fetchTransactions}>Retry</button>
        </div>
      )}

      {!loading && !error && transactions.length === 0 && (
        <div className="wallet-txn-page__empty">
          <i className="bi bi-inbox" />
          <h3>No transactions found</h3>
          <p>
            {typeFilter || statusFilter
              ? 'Try changing the filters'
              : 'Start adding money to see your transactions here'}
          </p>
        </div>
      )}

      {!loading && !error && transactions.length > 0 && (
        <div className="wallet-txn-page__list">
          {transactions.map((txn) => (
            <div key={txn.id} className="wallet-txn-row">
              <div className={`wallet-txn-row__icon wallet-txn-row__icon--${txn.transaction_type}`}>
                <i className={`bi bi-arrow-${txn.transaction_type === 'credit' ? 'down-left' : 'up-right'}`} />
              </div>

              <div className="wallet-txn-row__body">
                <div className="wallet-txn-row__desc">{txn.description}</div>
                <div className="wallet-txn-row__meta">
                  <span>{formatTxnDate(txn.created_at)}</span>
                  <span className="wallet-txn-row__dot">·</span>
                  <span className="wallet-txn-row__ref">Ref: {txn.reference_id}</span>
                </div>
              </div>

              <div className="wallet-txn-row__right">
                <div className={`wallet-txn-row__amount wallet-txn-row__amount--${txn.transaction_type}`}>
                  {txn.transaction_type === 'credit' ? '+' : '−'}₹{formatCurrency(txn.amount)}
                </div>
                <span className={`wallet-txn-row__status wallet-txn-row__status--${txn.status}`}>
                  {txn.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WalletTransactionsPage;