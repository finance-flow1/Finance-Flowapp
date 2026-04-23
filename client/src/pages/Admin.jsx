import { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar.jsx';
import AnalyticsChart from '../components/AnalyticsChart.jsx';
import { users, transactions } from '../api/api.js';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Admin() {
  const [stats,    setStats]    = useState(null);
  const [userList, setUserList] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Execute calls sequentially or via Promise.all with individual error handling
      const [uRes, sRes] = await Promise.all([
        users.list().catch(err => {
          console.error('User list fetch failed:', err);
          throw new Error('Could not fetch user directory.');
        }),
        transactions.adminStats().catch(err => {
          console.error('Admin stats fetch failed:', err);
          throw new Error('Could not fetch system metrics.');
        })
      ]);

      console.log('Admin Data Loaded:', { users: uRes.data, stats: sRes.data });
      
      setUserList(uRes.data.users || []);
      setStats(sRes.data.data || {});
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while loading admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = stats?.summary || {};
  const monthly = stats?.monthly || [];

  return (
    <div className="layout">
      <Navbar />
      <main className="main-content fade-in">
        <div className="admin-header-accent">🛡️ System Administration</div>
        <div className="page-header-row">
          <div className="page-header">
            <h1>Admin Control Panel</h1>
            <p>Global system overview and user management</p>
          </div>
          <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
            {loading ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
        </div>

        {error ? (
          <div className="auth-card" style={{ padding: 40, textAlign: 'center', margin: '40px auto', maxWidth: 500 }}>
             <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
             <h3 style={{ marginBottom: 12 }}>Data Loading Failed</h3>
             <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p>
             <button className="btn btn-primary" onClick={loadData}>Try Again</button>
          </div>
        ) : loading ? (
          <div className="spinner-wrap" style={{ minHeight: '60vh' }}>
            <div className="spinner" />
            <p className="spinner-text">Accessing secure vault data...</p>
          </div>
        ) : (
          <>
            {/* ── Global Stat Cards ───────────────────── */}
            <div className="grid-4" style={{ marginBottom: 32 }}>
              <div className="card stat-card card-glow">
                <span className="stat-icon">👥</span>
                <span className="stat-label">Total Users</span>
                <span className="stat-value">{summary.active_users || 0}</span>
                <span className="stat-sub">Registered accounts</span>
              </div>

              <div className="card stat-card card-glow">
                <span className="stat-icon">🔁</span>
                <span className="stat-label">Total Transactions</span>
                <span className="stat-value">{summary.total_transactions || 0}</span>
                <span className="stat-sub">Processed by system</span>
              </div>

              <div className="card stat-card card-glow">
                <span className="stat-icon">💎</span>
                <span className="stat-label">Total Volume</span>
                <span className="stat-value" style={{ color: 'var(--primary-light)' }}>{fmt(summary.total_income)}</span>
                <span className="stat-sub">Aggregated income</span>
              </div>

              <div className="card stat-card card-glow">
                <span className="stat-icon">💹</span>
                <span className="stat-label">Net Balance</span>
                <span className="stat-value" style={{ color: parseFloat(summary.net_balance) >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                  {fmt(summary.net_balance)}
                </span>
                <span className="stat-sub">System net worth</span>
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 32 }}>
                {/* ── Monthly Volume ─────────────────────── */}
                <div className="card chart-card">
                  <h3 className="chart-title">Global Transaction Volume (6m)</h3>
                  <AnalyticsChart data={monthly} />
                </div>

                {/* ── User Management ────────────────────── */}
                <div className="card" style={{ padding: '24px 0', overflow: 'hidden' }}>
                    <h3 style={{ padding: '0 24px', marginBottom: 20 }}>System Users</h3>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Joined</th>
                                    <th>Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userList.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                            No users found in directory.
                                        </td>
                                    </tr>
                                ) : userList.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                                                    {(u.name || u.email || '?')[0].toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{u.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</td>
                                        <td>
                                            <span className={`badge badge-${u.role === 'admin' ? 'admin' : 'user'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
