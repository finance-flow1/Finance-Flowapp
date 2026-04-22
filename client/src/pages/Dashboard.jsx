import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import AnalyticsChart from '../components/AnalyticsChart.jsx';
import api from '../api/axios.js';

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
          api.get('/api/v1/transactions/analytics/summary'),
          api.get('/api/v1/transactions?limit=5&page=1'),
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
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : (
          <>
            {/* ── Stat cards ───────────────────────────── */}
            <div className="grid-3" style={{ marginBottom: 24 }}>
              <div className="card stat-card" style={{ borderTop: '3px solid var(--primary)' }}>
                <span className="stat-label">💰 Net Balance</span>
                <span className="stat-value" style={{ color: parseFloat(stats.balance) >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                  {fmt(stats.balance)}
                </span>
                <span className="stat-sub">All-time balance</span>
              </div>

              <div className="card stat-card" style={{ borderTop: '3px solid var(--income)' }}>
                <span className="stat-label">📈 Total Income</span>
                <span className="stat-value" style={{ color: 'var(--income)' }}>{fmt(stats.total_income)}</span>
                <span className="stat-sub">All-time income</span>
              </div>

              <div className="card stat-card" style={{ borderTop: '3px solid var(--expense)' }}>
                <span className="stat-label">📉 Total Expenses</span>
                <span className="stat-value" style={{ color: 'var(--expense)' }}>{fmt(stats.total_expense)}</span>
                <span className="stat-sub">All-time expenses</span>
              </div>
            </div>

            {/* ── Monthly chart ─────────────────────────── */}
            <div style={{ marginBottom: 24 }}>
              <AnalyticsChart data={monthly} />
            </div>

            {/* ── Recent transactions ───────────────────── */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 16 }}>Recent Transactions</h3>
              {recent.length === 0 ? (
                <div className="empty-state">
                  <span style={{ fontSize: 40 }}>💳</span>
                  <p>No transactions yet. <a href="/transactions" style={{ color: 'var(--primary)' }}>Add one!</a></p>
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
                        <tr key={tx.id}>
                          <td style={{ color: 'var(--text-secondary)' }}>{tx.date}</td>
                          <td><span style={{ fontWeight: 500 }}>{tx.category}</span></td>
                          <td style={{ color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.description || '—'}
                          </td>
                          <td>
                            <span className={`badge badge-${tx.type}`}>{tx.type}</span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)' }}>
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
