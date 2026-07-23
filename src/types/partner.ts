// ─── Partner Types ─────────────────────────────────────────────────────────────

export type TurfStatus = 'Pending' | 'Active' | 'Inactive' | 'Rejected';

export interface PartnerTurf {
  id: number;
  name: string;
  turf_code: string;
  status: TurfStatus;
}

export interface Partner {
  id: number;
  name: string;
  email: string;
  number: string;
  is_verified: boolean;
  is_active: boolean;
  profile_image: string | null;
  profile_image_url: string | null;
  created_at: string;
  deactivation_reason: string | null;

  turfs?: PartnerTurf[];
}

// ─── Request Shapes ────────────────────────────────────────────────────────────

export interface CreatePartnerRequest {
  name: string;
  email: string;
  number: string;
  password: string;
}

export interface UpdatePartnerRequest {
  name?: string;
  email?: string;
  number?: string;
  is_verified?: boolean;
  is_active?: boolean;
  deactivation_reason?: string;
}

// ─── UI Helpers ────────────────────────────────────────────────────────────────

export type PartnerFilterStatus = 'all' | 'active' | 'inactive' | 'verified' | 'unverified';
