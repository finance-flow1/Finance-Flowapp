import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import AnalyticsChart from '../components/AnalyticsChart.jsx';
import { users, transactions } from '../api/api.js';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Admin() {
  const [stats,    setStats]    = useState(null);
  const [userList, setUserList] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, sRes] = await Promise.all([
          users.list(),
          transactions.adminStats(),
        ]);
        setUserList(uRes.data.users || []);
        setStats(sRes.data.data || {});
      } catch (err) {
        console.error('Admin load error', err);
        setError('Failed to load admin data. Access denied?');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const summary = stats?.summary || {};
  const monthly = stats?.monthly || [];

  return (
    <div className="layout">
      <Navbar />
      <main className="main-content fade-in">
        <div className="admin-header-accent">🛡️ System Administration</div>
        <div className="page-header">
          <h1>Admin Control Panel</h1>
          <p>Global system overview and user management</p>
        </div>

        {error ? (
          <div className="auth-error">{error}</div>
        ) : loading ? (
          <div className="spinner-wrap"><div className="spinner" /><p className="spinner-text">Loading secure data...</p></div>
        ) : (
          <>
            {/* ── Global Stat Cards ───────────────────── */}
            <div className="grid-4" style={{ marginBottom: 32 }}>
              <div className="card stat-card card-glow">
                <span className="stat-icon">👥</span>
                <span className="stat-label">Total Users</span>
                <span className="stat-value">{summary.active_users}</span>
                <span className="stat-sub">Registered accounts</span>
              </div>

              <div className="card stat-card card-glow">
                <span className="stat-icon">🔁</span>
                <span className="stat-label">Total Transactions</span>
                <span className="stat-value">{summary.total_transactions}</span>
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
                                {userList.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                                                    {(u.name || u.email)[0].toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{u.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge badge-${u.role}`}>
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
