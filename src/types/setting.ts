// ─── Game Coin Settings ────────────────────────────────────────────────────────
// GET/PATCH /api/admin/settings/current/

export interface GameCoinSettings {
  id:                          number;
  referrer_reward_enabled:     boolean;
  referrer_coin_reward:        number;
  referee_reward_enabled:      boolean;
  referee_coin_reward:         number;
  booking_fixed_reward_enabled:boolean;
  booking_fixed_coin_value:    number;
  booking_per_amount_enabled:  boolean;
  booking_per_amount_base:     string;  // "500.00"
  booking_per_amount_coin:     number;
  coin_to_wallet_rate:         string;  // "1.00"
  min_coins_for_conversion:    number;
}

export type UpdateGameCoinSettings = Partial<Omit<GameCoinSettings, 'id'>>;

// ─── Turf Default Settings ─────────────────────────────────────────────────────
// GET/PATCH /api/admin/settings/turf-defaults/current/

export interface TurfDefaultSettings {
  id:               number;
  advance_type:     'percentage' | 'fixed';
  advance_value:    string;   // "50.00"
  commission_type:  'percentage' | 'fixed';
  commission_value: string;   // "10.00"
  min_slots:        number;
}

export type UpdateTurfDefaultSettings = Partial<Omit<TurfDefaultSettings, 'id'>>;

// ─── Bulk Update Turf Settings ─────────────────────────────────────────────────
// POST /api/admin/turfs/bulk-update-settings/

export interface BulkUpdateTurfSettings {
  /** Specific turf IDs to update — omit if using `all: true` */
  turf_ids?:        number[];
  /** Set true to update ALL turfs regardless of turf_ids */
  all?:             boolean;
  advance_type?:    'percentage' | 'fixed';
  advance_value?:   number;
  commission_type?: 'percentage' | 'fixed';
  commission_value?:number;
  min_slots?:       number;
}

export interface BulkUpdateResponse {
  result:  'success' | 'fail';
  message: string;
  data: {
    updated_count:  number;
    updated_fields: Record<string, unknown>;
  };
}

