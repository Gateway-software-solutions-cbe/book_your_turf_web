// ─── User Types ────────────────────────────────────────────────────────────────
// Derived from GET /api/admin/users/ and GET /api/admin/users/{id}/ responses

export interface User {
  id:                number;
  name:              string;
  email:             string;
  number:            string;
  wallet_balance:    string;   // "100.50"
  game_coins:        number;
  referral_code:     string;
  is_active:         boolean;
  created_at:        string;   // ISO 8601
  is_verified:       string;
  /** Only present in detail response */
  profile_image?:    string | null;
  profile_image_url: string | null;
}
export interface PaginatedUsers {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  User[];
}

// ─── Request shapes ────────────────────────────────────────────────────────────

export interface ListUsersParams {
  search?:    string;
  is_active?: boolean;
  page?:      number;
  page_size?: number;
}

export interface UpdateUserRequest {
  name?:          string;
  email?:         string;
  number?:        string;
  is_active?:     boolean;
  profile_image?: File;
}