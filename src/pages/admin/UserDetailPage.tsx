// src/pages/admin/UserDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import { getUser, updateUser } from '../../api/users';
import type { User } from '../../types/user';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatCurrency = (val: string) =>
  `₹${parseFloat(val || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// ─── UserDetailPage ────────────────────────────────────────────────────────────
const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const numericId = Number(id);
  if (!id || isNaN(numericId)) {
    return <Navigate to="/admin/users" replace />;
  }

  const refetch = async () => {
    const fresh = await getUser(numericId);
    setUser(fresh);
  };

  useEffect(() => {
    setIsLoading(true);
    getUser(numericId)
      .then(setUser)
      .catch(() => setError('Failed to load user details.'))
      .finally(() => setIsLoading(false));
  }, [numericId]);

  const handleToggleActive = async () => {
    if (!user) return;
    setIsToggling(true);
    try {
      await updateUser(user.id, { is_active: !user.is_active });
      await refetch();
    } catch {
      alert('Failed to update user status.');
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-fluid px-4 py-5">
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-secondary">Loading user…</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container-fluid px-4 py-4">
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
          <span><i className="bi bi-exclamation-triangle-fill me-2"></i>{error ?? 'User not found.'}</span>
          <Link to="/admin/users" className="btn btn-outline-danger btn-sm">
            <i className="bi bi-arrow-left me-1"></i> Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/admin/users" className="text-decoration-none text-success">
              <i className="bi bi-people me-1"></i>Users
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {user.name}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h1 className="h2 mb-1">
            <i className="bi bi-person-circle text-success me-2"></i>{user.name}
          </h1>
          <p className="text-secondary mb-0 small">User ID #{user.id}</p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-success px-4 py-2 rounded-pill shadow-sm"
            style={{ 
              fontWeight: 500,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(25, 135, 84, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(25, 135, 84, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(25, 135, 84, 0.2)';
            }}
            onClick={() => navigate(`/admin/users/${user.id}/edit`)}
          >
            <i className="bi bi-pencil me-1"></i> Edit
          </button>
          <button
            className={`btn px-4 py-2 rounded-pill shadow-sm ${
              user.is_active ? 'btn-outline-danger' : 'btn-success'
            }`}
            style={{ 
              fontWeight: 500,
              transition: 'all 0.2s ease',
              boxShadow: user.is_active 
                ? '0 2px 8px rgba(220, 53, 69, 0.15)' 
                : '0 2px 8px rgba(25, 135, 84, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = user.is_active 
                ? '0 4px 16px rgba(220, 53, 69, 0.25)' 
                : '0 4px 16px rgba(25, 135, 84, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = user.is_active 
                ? '0 2px 8px rgba(220, 53, 69, 0.15)' 
                : '0 2px 8px rgba(25, 135, 84, 0.2)';
            }}
            onClick={handleToggleActive}
            disabled={isToggling}
          >
            {isToggling ? (
              <><span className="spinner-border spinner-border-sm me-1"></span> Processing…</>
            ) : user.is_active ? (
              <><i className="bi bi-lock me-1"></i> Deactivate</>
            ) : (
              <><i className="bi bi-unlock me-1"></i> Activate</>
            )}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-6">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="bg-success bg-opacity-10 rounded-3 p-3">
                <i className="bi bi-wallet2 text-success fs-3"></i>
              </div>
              <div>
                <div className="fs-5 fw-bold text-success">{formatCurrency(user.wallet_balance)}</div>
                <div className="small text-secondary text-uppercase fw-semibold">Wallet Balance</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="bg-warning bg-opacity-10 rounded-3 p-3">
                <i className="bi bi-coin text-warning fs-3"></i>
              </div>
              <div>
                <div className="fs-5 fw-bold" style={{ color: '#e65100' }}>{user.game_coins.toLocaleString()}</div>
                <div className="small text-secondary text-uppercase fw-semibold">Game Coins</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                <i className="bi bi-link-45deg text-primary fs-3"></i>
              </div>
              <div>
                <div className="fs-6 fw-bold">
                  <code className="bg-light px-2 py-1 rounded">{user.referral_code}</code>
                </div>
                <div className="small text-secondary text-uppercase fw-semibold">Referral Code</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="bg-purple bg-opacity-10 rounded-3 p-3">
                <i className="bi bi-shield-check text-purple fs-3"></i>
              </div>
              <div>
                <span className={`badge rounded-pill px-3 py-2 ${user.is_active ? 'bg-success' : 'bg-secondary'}`}>
                  <span className={`d-inline-block rounded-circle me-1 ${user.is_active ? 'bg-white' : 'bg-white bg-opacity-50'}`} style={{ width: '6px', height: '6px' }}></span>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
                <div className="small text-secondary text-uppercase fw-semibold mt-1">Account Status</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="row g-4">
        {/* Profile Card */}
        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold text-secondary mb-3">
                <i className="bi bi-person-badge text-success me-2"></i>Profile
              </h6>
              <div className="text-center mb-3">
                {user.profile_image_url ? (
                  <img 
                    src={user.profile_image_url} 
                    alt={user.name} 
                    className="rounded-circle object-fit-cover border"
                    style={{ width: '80px', height: '80px' }}
                  />
                ) : (
                  <div 
                    className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center mx-auto border"
                    style={{ width: '80px', height: '80px', fontSize: '32px', fontWeight: '700' }}
                  >
                    {user.name?.charAt(0).toUpperCase() ?? 'U'}
                  </div>
                )}
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="small fw-semibold text-secondary text-uppercase">Full Name</span>
                <span className="fw-medium">{user.name}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="small fw-semibold text-secondary text-uppercase">Email</span>
                <span>
                  <a href={`mailto:${user.email}`} className="text-success text-decoration-none">{user.email}</a>
                </span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="small fw-semibold text-secondary text-uppercase">Phone</span>
                <span className="fw-medium">{user.number}</span>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="small fw-semibold text-secondary text-uppercase">Joined</span>
                <span className="fw-medium">{formatDate(user.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Card */}
        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold text-secondary mb-3">
                <i className="bi bi-wallet text-success me-2"></i>Wallet & Coins
              </h6>
              <div className="bg-success bg-opacity-10 rounded-3 p-3">
                <div className="d-flex align-items-center gap-3">
                  <span className="fs-2">💰</span>
                  <div>
                    <div className="fs-3 fw-bold text-success">{formatCurrency(user.wallet_balance)}</div>
                    <div className="small text-success fw-medium">Wallet Balance</div>
                  </div>
                </div>
                <hr className="border-success border-opacity-25" />
                <div className="d-flex align-items-center gap-3">
                  <span className="fs-2">🪙</span>
                  <div>
                    <div className="fs-3 fw-bold" style={{ color: '#e65100' }}>{user.game_coins.toLocaleString()}</div>
                    <div className="small" style={{ color: '#e65100', fontWeight: '500' }}>Game Coins</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meta Card */}
        <div className="col-md-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="fw-bold text-secondary mb-3">
                <i className="bi bi-info-circle text-success me-2"></i>Meta
              </h6>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="small fw-semibold text-secondary text-uppercase">User ID</span>
                <span className="fw-medium">#{user.id}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="small fw-semibold text-secondary text-uppercase">Referral Code</span>
                <span>
                  <code className="bg-light px-2 py-1 rounded">{user.referral_code}</code>
                </span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="small fw-semibold text-secondary text-uppercase">Account Status</span>
                <span className={`badge rounded-pill px-3 ${user.is_active ? 'bg-success' : 'bg-secondary'}`}>
                  <span className={`d-inline-block rounded-circle me-1 ${user.is_active ? 'bg-white' : 'bg-white bg-opacity-50'}`} style={{ width: '6px', height: '6px' }}></span>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="small fw-semibold text-secondary text-uppercase">Member Since</span>
                <span className="fw-medium">{formatDate(user.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;