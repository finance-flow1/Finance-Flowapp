import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import AnalyticsChart from '../components/AnalyticsChart.jsx';
import { transactions } from '../api/api.js';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [recent,    setRecent]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const user = JSON.parse(localStorage.getItem('ff_user') || '{}');

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, tRes] = await Promise.all([
          transactions.analytics(),
          transactions.list({ limit: 5, page: 1 }),
        ]);
        setAnalytics(aRes.data.data);
        setRecent(tRes.data.data || []);
      } catch (err) {
        console.error('Dashboard load error', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = analytics?.summary || {};
  const monthly = analytics?.monthly || [];

  return (
    <div className="layout">
      <Navbar />
      <main className="main-content fade-in">
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Welcome back, <strong>{user.name}</strong> 👋</p>
        </div>

        {loading ? (
          <div className="spinner-wrap">
            <div className="spinner" />
            <p className="spinner-text">Updating your financial summary...</p>
          </div>
        ) : (
          <>
            {/* ── Stat cards ───────────────────────────── */}
            <div className="grid-3" style={{ marginBottom: 32 }}>
              <div className="card stat-card card-glow" style={{ borderTop: '4px solid var(--primary)' }}>
                <span className="stat-label">💰 Net Balance</span>
                <span className="stat-value" style={{ color: parseFloat(stats.balance) >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                  {fmt(stats.balance)}
                </span>
                <span className="stat-sub">Personal total balance</span>
              </div>

              <div className="card stat-card card-glow" style={{ borderTop: '4px solid var(--income)' }}>
                <span className="stat-label">📈 Total Income</span>
                <span className="stat-value" style={{ color: 'var(--income)' }}>{fmt(stats.total_income)}</span>
                <span className="stat-sub">All-time earnings</span>
              </div>

              <div className="card stat-card card-glow" style={{ borderTop: '4px solid var(--expense)' }}>
                <span className="stat-label">📉 Total Expenses</span>
                <span className="stat-value" style={{ color: 'var(--expense)' }}>{fmt(stats.total_expense)}</span>
                <span className="stat-sub">All-time spending</span>
              </div>
            </div>

            {/* ── Monthly chart ─────────────────────────── */}
            <div style={{ marginBottom: 32 }}>
              <div className="card chart-card">
                <h3 className="chart-title">Cash Flow Analytics (12m)</h3>
                <AnalyticsChart data={monthly} />
              </div>
            </div>

            {/* ── Recent transactions ───────────────────── */}
            <div className="card" style={{ padding: '24px 0' }}>
              <h3 style={{ padding: '0 24px', marginBottom: 20 }}>Recent Activity</h3>
              {recent.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon">💳</span>
                  <p>No transactions yet. <a href="/transactions" style={{ color: 'var(--primary-light)' }}>Add one!</a></p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((tx) => (
                        <tr key={tx.id} className={tx.type === 'income' ? 'row-income' : 'row-expense'}>
                          <td style={{ color: 'var(--text-secondary)' }}>{tx.date?.split('T')[0]}</td>
                          <td><span style={{ fontWeight: 600 }}>{tx.category}</span></td>
                          <td style={{ color: 'var(--text-secondary)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.description || '—'}
                          </td>
                          <td>
                            <span className={`badge badge-${tx.type}`}>{tx.type}</span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)' }}>
                            {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
