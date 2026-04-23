import { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar.jsx';
import { users, transactions } from '../api/api.js';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
const fmtCur  = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

export default function Admin() {
  const [userStats, setUserStats] = useState(null);
  const [txStats,   setTxStats]   = useState(null);
  const [userList,  setUserList]  = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);

  const loadData = useCallback(async (currentPage = 1) => {
    setLoading(true);
    setError('');
    try {
      const [uRes, usRes, tsRes] = await Promise.all([
        users.list({ page: currentPage, limit: 15 }),
        users.adminStats(),
        transactions.adminStats(),
      ]);

      setUserList(uRes.data.users || []);
      setPagination(uRes.data.pagination || { total: 0, page: 1, pages: 1 });
      setUserStats(usRes.data.data || {});
      setTxStats(tsRes.data.data?.summary || {});
    } catch (err) {
      console.error('Admin data load failed:', err);
      const status = err.response?.status;
      if (status === 401) setError('Session expired. Please log in again.');
      else if (status === 403) setError('Admin access required. Your account does not have admin privileges.');
      else setError(err.message || 'Failed to load admin data. Check that all services are running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(page);
  }, [loadData, page]);

  const filteredUsers = userList.filter(u =>
    !search ||
    (u.name  && u.name.toLowerCase().includes(search.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const us = userStats || {};
  const ts = txStats || {};

  return (
    <div className="layout">
      <Navbar />
      <main className="main-content fade-in">

        {/* ── Header ─────────────────────────────────── */}
        <div className="admin-header-accent">🛡️ System Administration</div>
        <div className="page-header-row" style={{ marginBottom: 32 }}>
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1>Admin Control Panel</h1>
            <p>System-wide health and user directory</p>
          </div>
          <button
            id="admin-refresh-btn"
            className="btn btn-secondary"
            onClick={() => loadData(page)}
            disabled={loading}
          >
            {loading ? '⏳ Loading…' : '🔄 Refresh'}
          </button>
        </div>

        {/* ── Error state ────────────────────────────── */}
        {error ? (
          <div className="auth-card" style={{ padding: 40, textAlign: 'center', margin: '40px auto', maxWidth: 520 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ marginBottom: 12 }}>Data Loading Failed</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>{error}</p>
            <button className="btn btn-primary" onClick={() => loadData(page)}>Try Again</button>
          </div>

        ) : loading ? (
          <div className="spinner-wrap" style={{ minHeight: '60vh' }}>
            <div className="spinner" />
            <p className="spinner-text">Loading admin metrics…</p>
          </div>

        ) : (
          <>
            {/* ── User Stat Cards ─────────────────────────── */}
            <h3 style={{ marginBottom: 16, fontSize: '1rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Ecosystem</h3>
            <div className="grid-4" style={{ marginBottom: 32 }}>
              <div className="card stat-card card-glow" style={{ borderTop: '3px solid var(--primary)' }}>
                <span className="stat-icon">👥</span>
                <span className="stat-label">Total Users</span>
                <span className="stat-value">{us.total_users ?? 0}</span>
                <span className="stat-sub">Registered accounts</span>
              </div>
              <div className="card stat-card card-glow" style={{ borderTop: '3px solid var(--income)' }}>
                <span className="stat-icon">🆕</span>
                <span className="stat-label">New (30d)</span>
                <span className="stat-value" style={{ color: 'var(--income)' }}>{us.new_users_30d ?? 0}</span>
                <span className="stat-sub">Recent growth</span>
              </div>
              <div className="card stat-card card-glow" style={{ borderTop: '3px solid var(--secondary)' }}>
                <span className="stat-icon">🛡️</span>
                <span className="stat-label">Admins</span>
                <span className="stat-value">{us.total_admins ?? 0}</span>
                <span className="stat-sub">Staff access</span>
              </div>
              <div className="card stat-card card-glow" style={{ borderTop: '3px solid var(--accent)' }}>
                <span className="stat-icon">👤</span>
                <span className="stat-label">Regular</span>
                <span className="stat-value">{us.total_regular_users ?? 0}</span>
                <span className="stat-sub">Standard users</span>
              </div>
            </div>

            {/* ── Transaction Stat Cards ─────────────────── */}
            <h3 style={{ marginBottom: 16, fontSize: '1rem', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Financial Activity</h3>
            <div className="grid-4" style={{ marginBottom: 40 }}>
              <div className="card stat-card card-glow" style={{ borderTop: '3px solid var(--secondary)' }}>
                <span className="stat-icon">📈</span>
                <span className="stat-label">Transactions</span>
                <span className="stat-value">{ts.total_transactions ?? 0}</span>
                <span className="stat-sub">Total processed</span>
              </div>
              <div className="card stat-card card-glow" style={{ borderTop: '3px solid var(--income)' }}>
                <span className="stat-icon">💰</span>
                <span className="stat-label">Net Volume</span>
                <span className="stat-value" style={{ color: 'var(--income)' }}>{fmtCur(ts.net_balance)}</span>
                <span className="stat-sub">System-wide balance</span>
              </div>
              <div className="card stat-card card-glow" style={{ borderTop: '3px solid var(--primary-light)' }}>
                <span className="stat-icon">📊</span>
                <span className="stat-label">Avg Ticket</span>
                <span className="stat-value">{fmtCur(ts.avg_transaction)}</span>
                <span className="stat-sub">Per transaction</span>
              </div>
              <div className="card stat-card card-glow" style={{ borderTop: '3px solid var(--accent)' }}>
                <span className="stat-icon">🔥</span>
                <span className="stat-label">Active Users</span>
                <span className="stat-value">{ts.active_users ?? 0}</span>
                <span className="stat-sub">Transacting users</span>
              </div>
            </div>

            {/* ── User Management Table ───────────────── */}
            <div className="card" style={{ padding: '28px 0', overflow: 'hidden' }}>
              {/* Table header with search */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ marginBottom: 4 }}>System Users</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {pagination.total} total · Page {pagination.page} of {pagination.pages}
                  </p>
                </div>
                <input
                  id="admin-user-search"
                  className="input"
                  style={{ maxWidth: 260 }}
                  placeholder="🔍  Search by name or email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                          {search ? `No users matching "${search}"` : 'No users found in the directory.'}
                        </td>
                      </tr>
                    ) : filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                              className="user-avatar"
                              style={{
                                width: 32, height: 32, fontSize: '0.72rem',
                                background: u.role === 'admin'
                                  ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
                                  : 'linear-gradient(135deg, var(--accent), var(--primary))',
                              }}
                            >
                              {(u.name || u.email || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name || '—'}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID #{u.id}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{u.email}</td>
                        <td>
                          <span className={`badge badge-${u.role === 'admin' ? 'admin' : 'user'}`}>
                            {u.role === 'admin' ? '🛡️ ' : ''}{u.role}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{fmtDate(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === pagination.pages || Math.abs(p - page) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === '…'
                        ? <span key={`ellipsis-${i}`} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>
                        : <button key={p} className={`page-btn${p === page ? ' current' : ''}`} onClick={() => setPage(p)}>{p}</button>
                    )
                  }
                  <button
                    className="page-btn"
                    disabled={page >= pagination.pages}
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>

            {/* ── System Info Footer ──────────────────── */}
            {(us.oldest_account || us.newest_account) && (
              <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
                <div className="card" style={{ flex: 1, padding: '18px 24px', minWidth: 200 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    🗓️ Oldest Account
                  </div>
                  <div style={{ fontWeight: 600 }}>{fmtDate(us.oldest_account)}</div>
                </div>
                <div className="card" style={{ flex: 1, padding: '18px 24px', minWidth: 200 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    ✨ Most Recent Account
                  </div>
                  <div style={{ fontWeight: 600 }}>{fmtDate(us.newest_account)}</div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
