// src/pages/user/WalletPage.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';
import {
  initiateWalletRecharge,
  convertCoins,
  listWalletTransactions,
} from '../../api/user/wallet';
import type { WalletTransaction } from '../../types/user/wallet';
import { MIN_COINS_TO_CONVERT, COIN_TO_RUPEE_RATIO } from '../../types/user/wallet';
import './style/WalletPage.css';

// ─── Helpers ──────────────────────────────────────────────────────────────
const QUICK_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

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

const WalletPage = () => {
  const navigate = useNavigate();
  const { user, walletBalance, gameCoins, refreshUserData } = useUserAuth();

  // Recharge
  const [rechargeAmount, setRechargeAmount] = useState<string>('');
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [rechargeError, setRechargeError] = useState<string | null>(null);

  // Convert
  const [coinsToConvert, setCoinsToConvert] = useState<number>(0);
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  // Recent txns
  const [recentTxns, setRecentTxns] = useState<WalletTransaction[]>([]);
  const [txnLoading, setTxnLoading] = useState(true);

  useEffect(() => {
    refreshUserData();
    loadRecentTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecentTransactions = async () => {
    setTxnLoading(true);
    try {
      const res = await listWalletTransactions();
      if (res.result === 'success' && Array.isArray(res.data)) {
        // Flat array — take first 5
        setRecentTxns(res.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load recent transactions:', err);
    } finally {
      setTxnLoading(false);
    }
  };

  // ─── Recharge ───────────────────────────────────────────────────────
  const handleRecharge = async () => {
    setRechargeError(null);

    const amt = parseFloat(rechargeAmount);
    if (!amt || amt <= 0) { setRechargeError('Enter a valid amount'); return; }
    if (amt < 10) { setRechargeError('Minimum recharge amount is ₹10'); return; }
    if (amt > 50000) { setRechargeError('Maximum recharge amount is ₹50,000'); return; }

    setRechargeLoading(true);
    try {
      const res = await initiateWalletRecharge({ amount: amt.toFixed(2) });

      if (res.result === 'success' && res.data) {
        navigate('/razorpay-wallet-recharge', {
          state: { orderData: res.data, amount: amt },
        });
      } else {
        setRechargeError(res.message || 'Failed to initiate recharge');
      }
    } catch (err: any) {
      setRechargeError(
        err.response?.data?.message || 'Failed to initiate recharge. Try again.'
      );
    } finally {
      setRechargeLoading(false);
    }
  };

  // ─── Coin Conversion ────────────────────────────────────────────────
  const handleConvertCoins = async () => {
    setConvertError(null);

    if (!coinsToConvert || coinsToConvert <= 0) {
      setConvertError('Enter a valid number of coins');
      return;
    }
    if (coinsToConvert < MIN_COINS_TO_CONVERT) {
      setConvertError(`Minimum ${MIN_COINS_TO_CONVERT} coins required to convert`);
      return;
    }
    if (coinsToConvert > gameCoins) {
      setConvertError(`You only have ${gameCoins} coins`);
      return;
    }

    setConvertLoading(true);
    try {
      const res = await convertCoins({ coins_to_convert: coinsToConvert });
      if (res.result === 'success') {
        setCoinsToConvert(0);
        await refreshUserData();
        await loadRecentTransactions();
      } else {
        setConvertError(res.message || 'Failed to convert coins');
      }
    } catch (err: any) {
      setConvertError(
        err.response?.data?.message || 'Failed to convert coins. Try again.'
      );
    } finally {
      setConvertLoading(false);
    }
  };

  const convertPreviewAmount = coinsToConvert * COIN_TO_RUPEE_RATIO;
  const canConvert =
    coinsToConvert >= MIN_COINS_TO_CONVERT &&
    coinsToConvert <= gameCoins &&
    gameCoins >= MIN_COINS_TO_CONVERT;

  return (
    <div className="wallet-page">
      {/* Header */}
      <div className="wallet-page__header">
        <h1>My Wallet</h1>
        <p>Top up your wallet, convert coins, and view transactions</p>
      </div>

      {/* Balance Card */}
      <div className="wallet-balance-card">
        <div className="wallet-balance-card__label">Available Balance</div>
        <div className="wallet-balance-card__amount">
          ₹{formatCurrency(walletBalance)}
        </div>
        <div className="wallet-balance-card__coins">
          <i className="bi bi-coin" />
          <span>{gameCoins} Game Coins</span>
        </div>
      </div>

      {/* Recharge */}
      <div className="wallet-section">
        <h2 className="wallet-section__title">
          <i className="bi bi-plus-circle-fill" /> Add Money
        </h2>

        <div className="wallet-recharge">
          <div className="wallet-recharge__quick">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                className={`wallet-recharge__chip ${
                  parseFloat(rechargeAmount) === amt ? 'active' : ''
                }`}
                onClick={() => {
                  setRechargeAmount(String(amt));
                  setRechargeError(null);
                }}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          <div className="wallet-recharge__input-wrap">
            <span className="wallet-recharge__rupee">₹</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="Enter amount"
              value={rechargeAmount}
              onChange={(e) => {
                setRechargeAmount(e.target.value);
                setRechargeError(null);
              }}
              min={10}
              max={50000}
            />
          </div>

          {rechargeError && (
            <div className="wallet-recharge__error">
              <i className="bi bi-exclamation-circle-fill" /> {rechargeError}
            </div>
          )}

          <button
            className="wallet-recharge__btn"
            onClick={handleRecharge}
            disabled={rechargeLoading || !rechargeAmount}
          >
            {rechargeLoading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" />
                Processing...
              </>
            ) : (
              <>
                <i className="bi bi-credit-card" /> Proceed to Pay
              </>
            )}
          </button>
        </div>
      </div>

      {/* Convert Coins */}
      <div className="wallet-section">
        <h2 className="wallet-section__title">
          <i className="bi bi-coin" /> Convert Game Coins
        </h2>

        <div className="wallet-convert">
          <div className="wallet-convert__info">
            <span>You have</span>
            <strong>{gameCoins} coins</strong>
          </div>

          <div className="wallet-convert__input-wrap">
            <input
              type="number"
              inputMode="numeric"
              placeholder={`Min ${MIN_COINS_TO_CONVERT} coins`}
              value={coinsToConvert || ''}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setCoinsToConvert(isNaN(v) ? 0 : v);
                setConvertError(null);
              }}
              min={MIN_COINS_TO_CONVERT}
              max={gameCoins}
            />
            <button
              type="button"
              className="wallet-convert__max"
              onClick={() => {
                setCoinsToConvert(gameCoins);
                setConvertError(null);
              }}
              disabled={gameCoins < MIN_COINS_TO_CONVERT}
            >
              MAX
            </button>
          </div>

          {/* Live preview: 1 coin = ₹1 */}
          {coinsToConvert > 0 && (
            <div className="wallet-convert__preview">
              <i className="bi bi-arrow-right" />
              <span>
                ₹{formatCurrency(convertPreviewAmount)} wallet credit
              </span>
            </div>
          )}

          {/* Info about minimum */}
          {gameCoins < MIN_COINS_TO_CONVERT && (
            <div className="wallet-convert__info-msg">
              <i className="bi bi-info-circle" />
              You need at least {MIN_COINS_TO_CONVERT} coins to convert.
              You currently have {gameCoins}.
            </div>
          )}

          {convertError && (
            <div className="wallet-convert__error">
              <i className="bi bi-exclamation-circle-fill" /> {convertError}
            </div>
          )}

          <button
            className="wallet-convert__btn"
            onClick={handleConvertCoins}
            disabled={convertLoading || !canConvert}
          >
            {convertLoading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" />
                Converting...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-left-right" /> Convert to Wallet
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="wallet-section">
        <div className="wallet-section__header">
          <h2 className="wallet-section__title">
            <i className="bi bi-clock-history" /> Recent Transactions
          </h2>
          <Link to="/wallet/transactions" className="wallet-section__link">
            View All <i className="bi bi-arrow-right" />
          </Link>
        </div>

        {txnLoading ? (
          <div className="wallet-txn__loading">
            <div className="spinner-border spinner-border-sm text-success" role="status" />
            <span>Loading...</span>
          </div>
        ) : recentTxns.length === 0 ? (
          <div className="wallet-txn__empty">
            <i className="bi bi-inbox" />
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="wallet-txn__list">
            {recentTxns.map((txn) => (
              <div key={txn.id} className="wallet-txn__item">
                <div className={`wallet-txn__icon wallet-txn__icon--${txn.transaction_type}`}>
                  <i className={`bi bi-arrow-${txn.transaction_type === 'credit' ? 'down-left' : 'up-right'}`} />
                </div>
                <div className="wallet-txn__body">
                  <div className="wallet-txn__desc">{txn.description}</div>
                  <div className="wallet-txn__date">{formatTxnDate(txn.created_at)}</div>
                </div>
                <div className={`wallet-txn__amount wallet-txn__amount--${txn.transaction_type}`}>
                  {txn.transaction_type === 'credit' ? '+' : '−'}₹{formatCurrency(txn.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;