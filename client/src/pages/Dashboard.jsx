import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Navbar from '../components/Navbar.jsx';
import { transactions } from '../api/api.js';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtShort = (n) => {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};

const CATEGORY_COLORS = [
  '#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#f43f5e','#ec4899','#3b82f6',
];

const GOALS_KEY = () => {
  const u = JSON.parse(localStorage.getItem('ff_user') || '{}');
  return `ff_goals_${u.id || 'default'}`;
};
const loadGoals  = () => JSON.parse(localStorage.getItem(GOALS_KEY()) || '{}');
const saveGoals  = (g) => localStorage.setItem(GOALS_KEY(), JSON.stringify(g));

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(9,14,26,0.95)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 14px', fontSize:'0.8rem' }}>
      <p style={{ color:'var(--text-muted)', marginBottom:6, fontWeight:700 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.name === 'income' ? 'var(--income)' : 'var(--expense)', fontWeight:600 }}>
          {p.name.charAt(0).toUpperCase() + p.name.slice(1)}: {fmtShort(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('ff_user') || '{}');

  const [analytics,   setAnalytics]   = useState(null);
  const [recent,      setRecent]       = useState([]);
  const [loading,     setLoading]      = useState(true);
  const [error,       setError]        = useState('');
  const [retryCount,  setRetryCount]   = useState(0);
  const [goals,       setGoals]        = useState(loadGoals);
  const [editGoal,    setEditGoal]     = useState(null); // { category, value }
  const [showGoalForm, setShowGoalForm] = useState(false);

  useEffect(() => {
    const load = async () => {
      setError('');
      setLoading(true);
      try {
        const [aRes, tRes] = await Promise.all([
          transactions.analytics(),
          transactions.list({ limit: 5, page: 1 }),
        ]);
        setAnalytics(aRes.data.data);
        setRecent(tRes.data.data || []);
      } catch (err) {
        const msg = err.response?.data?.error || err.message || 'Failed to load dashboard data.';
        setError(`${err.response?.status ? `[${err.response.status}] ` : ''}${msg}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [retryCount]);

  const reload = () => setRetryCount((n) => n + 1);

  const saveGoal = () => {
    if (!editGoal) return;
    const updated = { ...goals, [editGoal.category]: parseFloat(editGoal.value) || 0 };
    setGoals(updated);
    saveGoals(updated);
    setEditGoal(null);
    setShowGoalForm(false);
  };

  const stats    = analytics?.summary || {};
  const monthly  = analytics?.monthly || [];
  const catBreak = (analytics?.categoryBreakdown || [])
    .filter((c) => c.type === 'expense')
    .slice(0, 6);

  const today    = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const expenseCategories = catBreak.map((c) => c.category);

  return (
    <div className="layout">
      <Navbar />
      <main className="main-content fade-in">

        {/* ── Header ────────────────────────────────────── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32, flexWrap:'wrap', gap:16 }}>
          <div>
            <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{today}</p>
            <h1 style={{ fontSize:'2rem', fontWeight:900, letterSpacing:'-0.04em', marginBottom:4 }}>
              {greeting}, <span style={{ background:'linear-gradient(135deg,var(--primary-light),var(--accent))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{user.name?.split(' ')[0] || 'there'}</span> 👋
            </h1>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>Here's your financial overview</p>
          </div>
          <button className="btn btn-primary" onClick={reload} disabled={loading}>
            {loading ? <><div className="spinner" style={{width:14,height:14,borderWidth:2}}/> Syncing…</> : '🔄 Refresh'}
          </button>
        </div>

        {/* ── Error state ───────────────────────────────── */}
        {error && (
          <div className="auth-card" style={{ padding:32, textAlign:'center', margin:'0 auto 32px', maxWidth:480 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
            <h3 style={{ marginBottom:8 }}>Could not load data</h3>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginBottom:20, fontFamily:'monospace' }}>{error}</p>
            <button className="btn btn-primary" onClick={reload}>🔄 Retry</button>
          </div>
        )}

        {!error && loading && (
          <div className="spinner-wrap"><div className="spinner"/><p className="spinner-text">Updating your financial summary…</p></div>
        )}

        {!error && !loading && (
          <>
            {/* ── 4 Stat Cards ──────────────────────────── */}
            <div className="grid-4" style={{ marginBottom:28 }}>
              {[
                { label:'Net Balance',     value: fmt(stats.balance),       color:'var(--primary-light)', icon:'💰', top:'4px solid var(--primary)' },
                { label:'Total Income',    value: fmt(stats.total_income),  color:'var(--income)',        icon:'📈', top:'4px solid var(--income)' },
                { label:'Total Expenses',  value: fmt(stats.total_expense), color:'var(--expense)',       icon:'📉', top:'4px solid var(--expense)' },
                { label:'Transactions',    value: recent.length || '—',     color:'var(--accent)',        icon:'💳', top:'4px solid var(--accent)' },
              ].map((s) => (
                <div key={s.label} className="card stat-card card-glow" style={{ borderTop: s.top }}>
                  <span style={{ fontSize:'1.6rem' }}>{s.icon}</span>
                  <span className="stat-label">{s.label}</span>
                  <span className="stat-value" style={{ fontSize:'1.6rem', color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* ── Two-column main ───────────────────────── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:20, marginBottom:24, alignItems:'start' }}>

              {/* Chart */}
              <div className="card chart-card">
                <p className="chart-title">Cash Flow Analytics — Last 12 Months</p>
                {monthly.length === 0 ? (
                  <div className="empty-state" style={{ padding:40 }}><span className="empty-state-icon">📊</span><p>No data yet. Add some transactions!</p></div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={monthly} barSize={10} barCategoryGap="30%">
                      <XAxis dataKey="month" tick={{ fill:'#475569', fontSize:10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:'#475569', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="income"  fill="var(--income)"  radius={[4,4,0,0]} />
                      <Bar dataKey="expense" fill="var(--expense)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                <div style={{ display:'flex', gap:16, justifyContent:'center', marginTop:12 }}>
                  <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}><span style={{ color:'var(--income)', fontWeight:700 }}>■</span> Income</span>
                  <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}><span style={{ color:'var(--expense)', fontWeight:700 }}>■</span> Expense</span>
                </div>
              </div>

              {/* Right column — Category breakdown + Goals */}
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

                {/* Category Breakdown */}
                <div className="card" style={{ padding:'20px 22px' }}>
                  <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:16 }}>
                    📂 Top Expense Categories
                  </p>
                  {catBreak.length === 0 ? (
                    <p style={{ color:'var(--text-muted)', fontSize:'0.82rem', textAlign:'center', padding:'16px 0' }}>No expense data yet</p>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      {catBreak.map((c, i) => {
                        const maxTotal = catBreak[0]?.total || 1;
                        const pct = Math.round((c.total / maxTotal) * 100);
                        return (
                          <div key={c.category}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, alignItems:'center' }}>
                              <span style={{ fontSize:'0.82rem', fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
                                <span style={{ width:8, height:8, borderRadius:'50%', background: CATEGORY_COLORS[i % CATEGORY_COLORS.length], display:'inline-block' }} />
                                {c.category}
                              </span>
                              <span style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:600 }}>{fmtShort(c.total)}</span>
                            </div>
                            <div className="progress-bar-bg">
                              <div className="progress-bar" style={{ width:`${pct}%`, background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Spending Goals */}
                <div className="card" style={{ padding:'20px 22px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                      🎯 Monthly Spending Goals
                    </p>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setEditGoal({ category: expenseCategories[0] || '', value: '' }); setShowGoalForm(true); }}
                    >
                      + Set Goal
                    </button>
                  </div>

                  {/* Goal edit form */}
                  {showGoalForm && (
                    <div style={{ marginBottom:14, padding:'12px 14px', background:'rgba(99,102,241,0.07)', borderRadius:'var(--radius-md)', border:'1px solid rgba(99,102,241,0.15)' }}>
                      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                        <select
                          className="input"
                          style={{ flex:1, fontSize:'0.82rem', padding:'6px 10px' }}
                          value={editGoal?.category || ''}
                          onChange={(e) => setEditGoal((g) => ({ ...g, category: e.target.value }))}
                        >
                          {expenseCategories.length
                            ? expenseCategories.map((c) => <option key={c} value={c}>{c}</option>)
                            : <option value="">Add transactions first</option>
                          }
                        </select>
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <input
                          className="input"
                          type="number"
                          min="1"
                          placeholder="Monthly budget $"
                          value={editGoal?.value || ''}
                          onChange={(e) => setEditGoal((g) => ({ ...g, value: e.target.value }))}
                          style={{ flex:1, fontSize:'0.82rem', padding:'6px 10px' }}
                        />
                        <button className="btn btn-primary btn-sm" onClick={saveGoal}>Save</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowGoalForm(false)}>✕</button>
                      </div>
                    </div>
                  )}

                  {Object.keys(goals).length === 0 && !showGoalForm ? (
                    <p style={{ color:'var(--text-muted)', fontSize:'0.82rem', textAlign:'center', padding:'12px 0' }}>
                      No goals set. Click "+ Set Goal" to start budgeting.
                    </p>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {Object.entries(goals).map(([cat, budget]) => {
                        const actual = catBreak.find((c) => c.category === cat);
                        const spent  = parseFloat(actual?.total || 0);
                        const pct    = Math.min(100, Math.round((spent / budget) * 100));
                        const over   = spent > budget;
                        return (
                          <div key={cat}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                              <span style={{ fontSize:'0.8rem', fontWeight:600 }}>{cat}</span>
                              <span style={{ fontSize:'0.76rem', color: over ? 'var(--expense)' : 'var(--text-muted)' }}>
                                {fmtShort(spent)} / {fmtShort(budget)} {over ? '⚠️' : ''}
                              </span>
                            </div>
                            <div className="progress-bar-bg">
                              <div className="progress-bar" style={{ width:`${pct}%`, background: over ? 'var(--expense)' : pct > 75 ? 'var(--warning)' : 'var(--income)' }} />
                            </div>
                            <div style={{ display:'flex', justifyContent:'space-between', marginTop:2 }}>
                              <span style={{ fontSize:'0.68rem', color: over ? 'var(--expense)' : 'var(--text-muted)' }}>
                                {pct}% used
                              </span>
                              <button
                                style={{ fontSize:'0.65rem', color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer' }}
                                onClick={() => { const g = { ...goals }; delete g[cat]; setGoals(g); saveGoals(g); }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ── Recent Activity ───────────────────────── */}
            <div className="card" style={{ padding:'24px 0', overflow:'hidden' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 24px', marginBottom:16 }}>
                <h3>Recent Activity</h3>
                <a href="/transactions" style={{ fontSize:'0.8rem', color:'var(--primary-light)', textDecoration:'none', fontWeight:600 }}>View all →</a>
              </div>
              {recent.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon">💳</span>
                  <p>No transactions yet. <a href="/transactions" style={{ color:'var(--primary-light)' }}>Add one!</a></p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th><th>Category</th><th>Description</th><th>Type</th><th style={{ textAlign:'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((tx) => (
                        <tr key={tx.id} className={tx.type === 'income' ? 'row-income' : 'row-expense'}>
                          <td style={{ color:'var(--text-secondary)', whiteSpace:'nowrap' }}>{tx.date?.split('T')[0]}</td>
                          <td><span style={{ fontWeight:600 }}>{tx.category}</span></td>
                          <td style={{ color:'var(--text-secondary)', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tx.description || '—'}</td>
                          <td><span className={`badge badge-${tx.type}`}>{tx.type}</span></td>
                          <td style={{ textAlign:'right', fontWeight:800, color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)', whiteSpace:'nowrap' }}>
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
