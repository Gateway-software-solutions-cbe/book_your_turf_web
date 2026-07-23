import React, { useEffect, useState, useCallback } from 'react';
import {
  getGameCoinSettings, updateGameCoinSettings,
  getTurfDefaultSettings, updateTurfDefaultSettings,
  bulkUpdateTurfSettings,
} from '../../api/settings';
import { listTurfs } from '../../api/turfs';
import type { GameCoinSettings, TurfDefaultSettings } from '../../types/setting';
import type { Turf } from '../../types/turf';

// ─── Tab type ──────────────────────────────────────────────────────────────────
type SettingsTab = 'game-coins' | 'turf-defaults' | 'bulk-update';

const TABS: { id: SettingsTab; label: string; icon: string }[] = [
  { id: 'game-coins', label: 'Game Coin Settings', icon: 'bi-coin' },
  { id: 'turf-defaults', label: 'Turf Default Settings', icon: 'bi-geo-alt' },
  { id: 'bulk-update', label: 'Bulk Update Turfs', icon: 'bi-lightning-charge' }
];

// ─── Shared Components ─────────────────────────────────────────────────────────
const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="mb-3">
    <label className="form-label fw-semibold text-dark small mb-1">{label}</label>
    {children}
    {hint && <div className="text-secondary small mt-1">{hint}</div>}
  </div>
);

const Toggle: React.FC<{ 
  label: string; 
  hint?: string; 
  checked: boolean; 
  onChange: (v: boolean) => void;
  disabled?: boolean;
}> = ({ label, hint, checked, onChange, disabled = false }) => (
  <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
    <div>
      <div className="fw-semibold text-dark small">{label}</div>
      {hint && <div className="text-secondary small">{hint}</div>}
    </div>
    <div className="form-check form-switch mb-0">
      <input
        className="form-check-input"
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={{ 
          width: '3rem', 
          height: '1.5rem',
          cursor: 'pointer',
          backgroundColor: checked ? '#198754' : '#ced4da',
          borderColor: checked ? '#198754' : '#ced4da'
        }}
      />
    </div>
  </div>
);

// ─── Tab: Game Coin Settings ───────────────────────────────────────────────────
const GameCoinTab: React.FC = () => {
  const [settings, setSettings] = useState<GameCoinSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGameCoinSettings()
      .then(setSettings)
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setIsLoading(false));
  }, []);

  const set = <K extends keyof GameCoinSettings>(key: K, val: GameCoinSettings[K]) =>
    setSettings((prev) => prev ? { ...prev, [key]: val } : prev);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateGameCoinSettings(settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError('Failed to save settings.'); }
    finally { setIsSaving(false); }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!settings) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0">Game Coin Settings</h5>
          <p className="text-secondary small mb-0">Configure referral rewards, booking rewards, and coin-to-wallet conversion.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {saved && (
            <span className="badge bg-success rounded-pill px-3 py-2 animate__animated animate__fadeIn">
              <i className="bi bi-check-circle-fill me-1"></i>Saved
            </span>
          )}
          <button 
            className="btn btn-success rounded-pill px-4 shadow-sm" 
            onClick={handleSave} 
            disabled={isSaving}
            style={{ fontWeight: 500 }}
          >
            {isSaving ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check2-circle me-1"></i>Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show rounded-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-1"></i>{error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Referral Rewards */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px', transition: 'all 0.3s ease' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-share-fill text-success me-2"></i>Referral Rewards
              </h6>
              <Toggle 
                label="Referrer Reward" 
                hint="Reward the person who referred" 
                checked={settings.referrer_reward_enabled} 
                onChange={(v) => set('referrer_reward_enabled', v)} 
              />
              <div className="mt-3">
                <Field label="Referrer Coin Reward">
                  <input 
                    className={`form-control form-control-sm rounded-3 ${!settings.referrer_reward_enabled ? 'bg-light' : ''}`} 
                    type="number" 
                    value={settings.referrer_coin_reward} 
                    onChange={(e) => set('referrer_coin_reward', Number(e.target.value))} 
                    disabled={!settings.referrer_reward_enabled} 
                  />
                </Field>
              </div>
              <div className="mt-3">
                <Toggle 
                  label="Referee Reward" 
                  hint="Reward the new user who was referred" 
                  checked={settings.referee_reward_enabled} 
                  onChange={(v) => set('referee_reward_enabled', v)} 
                />
              </div>
              <div className="mt-3">
                <Field label="Referee Coin Reward">
                  <input 
                    className={`form-control form-control-sm rounded-3 ${!settings.referee_reward_enabled ? 'bg-light' : ''}`} 
                    type="number" 
                    value={settings.referee_coin_reward} 
                    onChange={(e) => set('referee_coin_reward', Number(e.target.value))} 
                    disabled={!settings.referee_reward_enabled} 
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Rewards */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px', transition: 'all 0.3s ease' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-calendar-check text-success me-2"></i>Booking Rewards
              </h6>
              <Toggle 
                label="Fixed Coin Reward per Booking" 
                checked={settings.booking_fixed_reward_enabled} 
                onChange={(v) => set('booking_fixed_reward_enabled', v)} 
              />
              <div className="mt-3">
                <Field label="Fixed Coin Value">
                  <input 
                    className={`form-control form-control-sm rounded-3 ${!settings.booking_fixed_reward_enabled ? 'bg-light' : ''}`} 
                    type="number" 
                    value={settings.booking_fixed_coin_value} 
                    onChange={(e) => set('booking_fixed_coin_value', Number(e.target.value))} 
                    disabled={!settings.booking_fixed_reward_enabled} 
                  />
                </Field>
              </div>
              <div className="mt-3">
                <Toggle 
                  label="Per-Amount Coin Reward" 
                  hint="Coins per booking amount spent" 
                  checked={settings.booking_per_amount_enabled} 
                  onChange={(v) => set('booking_per_amount_enabled', v)} 
                />
              </div>
              <div className="row g-2 mt-2">
                <div className="col-6">
                  <Field label="Base Amount (₹)">
                    <input 
                      className={`form-control form-control-sm rounded-3 ${!settings.booking_per_amount_enabled ? 'bg-light' : ''}`} 
                      type="number" 
                      value={settings.booking_per_amount_base} 
                      onChange={(e) => set('booking_per_amount_base', e.target.value)} 
                      disabled={!settings.booking_per_amount_enabled} 
                    />
                  </Field>
                </div>
                <div className="col-6">
                  <Field label="Coins per Base">
                    <input 
                      className={`form-control form-control-sm rounded-3 ${!settings.booking_per_amount_enabled ? 'bg-light' : ''}`} 
                      type="number" 
                      value={settings.booking_per_amount_coin} 
                      onChange={(e) => set('booking_per_amount_coin', Number(e.target.value))} 
                      disabled={!settings.booking_per_amount_enabled} 
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coin Conversion */}
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px', transition: 'all 0.3s ease' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-arrow-left-right text-success me-2"></i>Coin Conversion
              </h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <Field label="Coin to Wallet Rate (₹ per coin)" hint="How much 1 coin is worth in wallet balance">
                    <input 
                      className="form-control form-control-sm rounded-3" 
                      type="number" 
                      step="0.01" 
                      value={settings.coin_to_wallet_rate} 
                      onChange={(e) => set('coin_to_wallet_rate', e.target.value)} 
                    />
                  </Field>
                </div>
                <div className="col-md-6">
                  <Field label="Minimum Coins for Conversion" hint="Users need at least this many coins to redeem">
                    <input 
                      className="form-control form-control-sm rounded-3" 
                      type="number" 
                      value={settings.min_coins_for_conversion} 
                      onChange={(e) => set('min_coins_for_conversion', Number(e.target.value))} 
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Turf Default Settings ────────────────────────────────────────────────
const TurfDefaultsTab: React.FC = () => {
  const [settings, setSettings] = useState<TurfDefaultSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTurfDefaultSettings()
      .then(setSettings)
      .catch(() => setError('Failed to load defaults.'))
      .finally(() => setIsLoading(false));
  }, []);

  const set = <K extends keyof TurfDefaultSettings>(key: K, val: TurfDefaultSettings[K]) =>
    setSettings((prev) => prev ? { ...prev, [key]: val } : prev);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateTurfDefaultSettings(settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError('Failed to save.'); }
    finally { setIsSaving(false); }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!settings) {
    return <div className="alert alert-danger">{error ?? 'Could not load settings.'}</div>;
  }

  return (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0">Turf Default Settings</h5>
          <p className="text-secondary small mb-0">These defaults apply to newly created turfs unless overridden.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {saved && (
            <span className="badge bg-success rounded-pill px-3 py-2 animate__animated animate__fadeIn">
              <i className="bi bi-check-circle-fill me-1"></i>Saved
            </span>
          )}
          <button 
            className="btn btn-success rounded-pill px-4 shadow-sm" 
            onClick={handleSave} 
            disabled={isSaving}
            style={{ fontWeight: 500 }}
          >
            {isSaving ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check2-circle me-1"></i>Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show rounded-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-1"></i>{error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: '640px', borderRadius: '16px' }}>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-6">
              <Field label="Advance Type">
                <select 
                  className="form-select form-select-sm rounded-3" 
                  value={settings.advance_type} 
                  onChange={(e) => set('advance_type', e.target.value as 'percentage' | 'fixed')}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </Field>
            </div>
            <div className="col-md-6">
              <Field label={`Advance Value (${settings.advance_type === 'percentage' ? '%' : '₹'})`}>
                <input 
                  className="form-control form-control-sm rounded-3" 
                  type="number" 
                  min={0} 
                  value={settings.advance_value} 
                  onChange={(e) => set('advance_value', e.target.value)} 
                />
              </Field>
            </div>
            <div className="col-md-6">
              <Field label="Commission Type">
                <select 
                  className="form-select form-select-sm rounded-3" 
                  value={settings.commission_type} 
                  onChange={(e) => set('commission_type', e.target.value as 'percentage' | 'fixed')}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </Field>
            </div>
            <div className="col-md-6">
              <Field label={`Commission Value (${settings.commission_type === 'percentage' ? '%' : '₹'})`}>
                <input 
                  className="form-control form-control-sm rounded-3" 
                  type="number" 
                  min={0} 
                  value={settings.commission_value} 
                  onChange={(e) => set('commission_value', e.target.value)} 
                />
              </Field>
            </div>
            <div className="col-12">
              <Field label="Minimum Booking Slots">
                <input 
                  className="form-control form-control-sm rounded-3" 
                  type="number" 
                  min={1} 
                  value={settings.min_slots} 
                  onChange={(e) => set('min_slots', Number(e.target.value))} 
                />
              </Field>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Bulk Update ──────────────────────────────────────────────────────────
const BulkUpdateTab: React.FC = () => {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [turfsLoading, setTurfsLoading] = useState(true);
  const [updateAll, setUpdateAll] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [turfSearch, setTurfSearch] = useState('');
  const [advType, setAdvType] = useState<'percentage' | 'fixed'>('percentage');
  const [advValue, setAdvValue] = useState('');
  const [comType, setComType] = useState<'percentage' | 'fixed'>('percentage');
  const [comValue, setComValue] = useState('');
  const [minSlots, setMinSlots] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTurfs().then(setTurfs).finally(() => setTurfsLoading(false));
  }, []);

  const toggleId = (id: number) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleSubmit = async () => {
    if (!updateAll && selectedIds.length === 0) { 
      setError('Select at least one turf or choose "Update All".'); 
      return; 
    }
    if (!advValue && !comValue && !minSlots) { 
      setError('Provide at least one field to update.'); 
      return; 
    }
    setIsSaving(true);
    setError(null);
    setResult(null);
    try {
      const payload: Parameters<typeof bulkUpdateTurfSettings>[0] = {
        ...(updateAll ? { all: true } : { turf_ids: selectedIds }),
        ...(advValue ? { advance_type: advType, advance_value: Number(advValue) } : {}),
        ...(comValue ? { commission_type: comType, commission_value: Number(comValue) } : {}),
        ...(minSlots ? { min_slots: Number(minSlots) } : {}),
      };
      const res = await bulkUpdateTurfSettings(payload);
      setResult(`✓ Updated ${res.data.updated_count} turfs successfully.`);
      setTimeout(() => setResult(null), 5000);
    } catch { 
      setError('Bulk update failed. Please try again.'); 
    }
    finally { setIsSaving(false); }
  };

  return (
    <div className="animate__animated animate__fadeIn">
      <div className="mb-4">
        <h5 className="fw-bold mb-0">Bulk Update Turf Settings</h5>
        <p className="text-secondary small mb-0">Update advance, commission, or minimum slots for multiple turfs at once.</p>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show rounded-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-1"></i>{error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}
      
      {result && (
        <div className="alert alert-success alert-dismissible fade show rounded-3 animate__animated animate__fadeIn" role="alert">
          <i className="bi bi-check-circle-fill me-1"></i>{result}
          <button type="button" className="btn-close" onClick={() => setResult(null)}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Scope */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-target text-success me-2"></i>Scope
              </h6>
              <div className="d-flex gap-2 mb-3">
                <button 
                  className={`btn btn-sm flex-fill rounded-pill py-2 justify-content-center fw-semibold ${
                    updateAll ? 'btn-success text-white shadow-sm' : 'btn-light text-secondary border-0'
                  }`}
                  onClick={() => setUpdateAll(true)}
                  style={{ transition: 'all 0.2s ease' }}
                >
                  <i className="bi bi-lightning-fill me-1"></i>All Turfs
                </button>
                <button 
                  className={`btn btn-sm flex-fill rounded-pill py-2 justify-content-center fw-semibold ${
                    !updateAll ? 'btn-success text-white shadow-sm' : 'btn-light text-secondary border-0'
                  }`}
                  onClick={() => setUpdateAll(false)}
                  style={{ transition: 'all 0.2s ease' }}
                >
                  <i className="bi bi-check2-square me-1"></i>Select Specific
                </button>
              </div>

              {!updateAll && (
                <div className="border rounded-3 p-2 bg-light">
                  <div className="position-relative mb-2">
                    <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2 text-secondary"></i>
                    <input
                      className="form-control form-control-sm rounded-pill ps-4"
                      type="search"
                      placeholder="Search turfs..."
                      value={turfSearch}
                      onChange={(e) => setTurfSearch(e.target.value)}
                    />
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {turfsLoading ? (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-success" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const q = turfSearch.toLowerCase();
                        const visible = q
                          ? turfs.filter(t =>
                              t.name.toLowerCase().includes(q) ||
                              t.partner_name.toLowerCase().includes(q)
                            )
                          : turfs;
                        return visible.length === 0 ? (
                          <p className="text-secondary small text-center py-2 mb-0">No turfs found.</p>
                        ) : (
                          visible.map((t) => (
                            <label 
                              key={t.id} 
                              className={`d-flex align-items-center gap-2 p-2 rounded-2 ${selectedIds.includes(t.id) ? 'bg-success bg-opacity-10' : ''}`}
                              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                            >
                              <input 
                                type="checkbox" 
                                checked={selectedIds.includes(t.id)} 
                                onChange={() => toggleId(t.id)}
                                className="form-check-input"
                              />
                              <div className="flex-grow-1">
                                <div className="fw-semibold small text-dark">{t.name}</div>
                                <div className="text-secondary small">{t.partner_name}</div>
                              </div>
                            </label>
                          ))
                        );
                      })()
                    )}
                  </div>
                  {!turfsLoading && selectedIds.length > 0 && (
                    <div className="mt-2 text-center">
                      <span className="badge bg-success rounded-pill">
                        {selectedIds.length} turf{selectedIds.length !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fields to update */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-pencil-square text-success me-2"></i>Fields to Update
              </h6>
              <p className="text-secondary small mb-3">
                <i className="bi bi-info-circle me-1"></i>Leave a field blank to keep existing values.
              </p>
              <div className="row g-3">
                <div className="col-md-6">
                  <Field label="Advance Type">
                    <select 
                      className="form-select form-select-sm rounded-3" 
                      value={advType} 
                      onChange={(e) => setAdvType(e.target.value as 'percentage' | 'fixed')}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed (₹)</option>
                    </select>
                  </Field>
                </div>
                <div className="col-md-6">
                  <Field label={`Advance Value (${advType === 'percentage' ? '%' : '₹'})`}>
                    <input 
                      className="form-control form-control-sm rounded-3" 
                      type="number" 
                      min={0} 
                      placeholder="Leave blank" 
                      value={advValue} 
                      onChange={(e) => setAdvValue(e.target.value)} 
                    />
                  </Field>
                </div>
                <div className="col-md-6">
                  <Field label="Commission Type">
                    <select 
                      className="form-select form-select-sm rounded-3" 
                      value={comType} 
                      onChange={(e) => setComType(e.target.value as 'percentage' | 'fixed')}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed (₹)</option>
                    </select>
                  </Field>
                </div>
                <div className="col-md-6">
                  <Field label={`Commission Value (${comType === 'percentage' ? '%' : '₹'})`}>
                    <input 
                      className="form-control form-control-sm rounded-3" 
                      type="number" 
                      min={0} 
                      placeholder="Leave blank" 
                      value={comValue} 
                      onChange={(e) => setComValue(e.target.value)} 
                    />
                  </Field>
                </div>
                <div className="col-12">
                  <Field label="Min Slots">
                    <input 
                      className="form-control form-control-sm rounded-3" 
                      type="number" 
                      min={1} 
                      placeholder="Leave blank" 
                      value={minSlots} 
                      onChange={(e) => setMinSlots(e.target.value)} 
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-4">
                <button 
                  className="btn btn-success rounded-pill px-4 shadow-sm w-100" 
                  onClick={handleSubmit} 
                  disabled={isSaving}
                  style={{ fontWeight: 500 }}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-arrow-repeat me-1 p-2"></i>
                      Apply to {updateAll ? 'All Turfs' : `${selectedIds.length} Turf${selectedIds.length !== 1 ? 's' : ''}`}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── SettingsPage ──────────────────────────────────────────────────────────────
const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('game-coins');

  return (
    <div className="container-fluid px-3 px-md-4 py-3 py-md-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div className="bg-success bg-opacity-10 rounded-3 p-3 d-flex align-items-center justify-content-center">
          <i className="bi bi-gear-fill text-success fs-4"></i>
        </div>
        <div>
          <h1 className="h3 mb-0 fw-bold text-dark">Settings</h1>
          <p className="text-secondary small mb-0">Configure system preferences and defaults</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
        <div className="card-body p-3">
          <div className="d-flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`btn btn-sm rounded-pill px-4 py-2 fw-semibold ${
                  activeTab === t.id 
                    ? 'btn-success text-white shadow-sm' 
                    : 'btn-light text-secondary border-0'
                }`}
                onClick={() => setActiveTab(t.id)}
                style={{ transition: 'all 0.2s ease' }}
              >
                <i className={`${t.icon} me-2`}></i>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
        <div className="card-body p-4">
          {activeTab === 'game-coins' && <GameCoinTab />}
          {activeTab === 'turf-defaults' && <TurfDefaultsTab />}
          {activeTab === 'bulk-update' && <BulkUpdateTab />}
        </div>
      </div>

      {/* Add Animate.css for animations (add to your index.html or import) */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" />
    </div>
  );
};

export default SettingsPage;