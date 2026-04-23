import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import Navbar from '../components/Navbar.jsx';
import { users, transactions } from '../api/api.js';

const fmtCur = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(n || 0);
const fmtShort = (n) => {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : 'N/A';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(9,14,26,0.96)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 14px', fontSize:'0.8rem' }}>
      <p style={{ color:'var(--text-muted)', marginBottom:6, fontWeight:700 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.name === 'income' ? 'var(--income)' : p.name === 'expense' ? 'var(--expense)' : 'var(--primary-light)', fontWeight:600 }}>
          {p.name.charAt(0).toUpperCase() + p.name.slice(1)}: {fmtShort(p.value)}
        </p>
      ))}
    </div>
  );
};

const StatusDot = ({ label, color = 'var(--income)' }) => (
  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
    <div style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow:`0 0 6px ${color}`, animation:'pulse 2s ease infinite' }} />
    <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:600 }}>{label}</span>
  </div>
);

export default function Admin() {
  const [userStats,  setUserStats]  = useState(null);
  const [txStats,    setTxStats]    = useState(null);
  const [txMonthly,  setTxMonthly]  = useState([]);
  const [userList,   setUserList]   = useState([]);
  const [pagination, setPagination] = useState({ total:0, page:1, pages:1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);

  const loadData = useCallback(async (currentPage = 1) => {
    setLoading(true);
    setError('');
    try {
      const [uRes, usRes, tsRes] = await Promise.all([
        users.list({ page: currentPage, limit: 12 }),
        users.adminStats(),
        transactions.adminStats(),
      ]);
      setUserList(uRes.data.users || []);
      setPagination(uRes.data.pagination || { total:0, page:1, pages:1 });
      setUserStats(usRes.data.data || {});
      setTxStats(tsRes.data.data?.summary || {});
      setTxMonthly(tsRes.data.data?.monthly || []);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setError('Session expired. Please log in again.');
      else if (status === 403) setError('Admin access required.');
      else setError(err.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(page); }, [loadData, page]);

  const filteredUsers = userList.filter((u) =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const us = userStats || {};
  const ts = txStats   || {};

  const incomeRatio = ts.total_income && ts.total_expense
    ? Math.round((ts.total_income / (parseFloat(ts.total_income) + parseFloat(ts.total_expense))) * 100)
    : 0;

  return (
    <div className="layout">
      <Navbar />
      <main className="main-content fade-in">

        {/* ── Command Centre Header ────────────────────── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32, gap:16, flexWrap:'wrap' }}>
          <div>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:8, marginBottom:10,
              background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)',
              borderRadius:99, padding:'4px 14px',
            }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--income)', boxShadow:'0 0 6px var(--income)', animation:'pulse 2s ease infinite' }} />
              <span style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--primary-light)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                🛡️ Admin Command Centre
              </span>
            </div>
            <h1 style={{ fontSize:'2rem', fontWeight:900, letterSpacing:'-0.04em', marginBottom:4 }}>System Overview</h1>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>Real-time platform metrics and user management</p>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ display:'flex', gap:12, padding:'8px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--glass-border)', borderRadius:'var(--radius-md)' }}>
              <StatusDot label="DB Online"       color="var(--income)" />
              <StatusDot label="MQ Online"       color="var(--income)" />
              <StatusDot label="Services Active" color="var(--income)" />
            </div>
            <button className="btn btn-secondary" id="admin-refresh-btn" onClick={() => loadData(page)} disabled={loading}>
              {loading ? '⏳ Loading…' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {/* ── Error ─────────────────────────────────────── */}
        {error ? (
          <div className="auth-card" style={{ padding:40, textAlign:'center', margin:'40px auto', maxWidth:520 }}>
            <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
            <h3 style={{ marginBottom:12 }}>Data Loading Failed</h3>
            <p style={{ color:'var(--text-secondary)', marginBottom:24, fontSize:'0.9rem' }}>{error}</p>
            <button className="btn btn-primary" onClick={() => loadData(page)}>Try Again</button>
          </div>
        ) : loading ? (
          <div className="spinner-wrap" style={{ minHeight:'60vh' }}>
            <div className="spinner"/>
            <p className="spinner-text">Loading admin metrics…</p>
          </div>
        ) : (
          <>
            {/* ── Platform Stats Row ───────────────────── */}
            <div className="grid-4" style={{ marginBottom:28 }}>
              {[
                { label:'Total Users',    value: us.total_users ?? 0,          icon:'👥', color:'var(--primary-light)', top:'var(--primary)' },
                { label:'New (30 days)',  value: us.new_users_30d ?? 0,         icon:'🆕', color:'var(--income)',        top:'var(--income)' },
                { label:'Total Revenue',  value: fmtShort(ts.total_income),     icon:'📈', color:'var(--income)',        top:'var(--income)' },
                { label:'Total Spending', value: fmtShort(ts.total_expense),    icon:'📉', color:'var(--expense)',       top:'var(--expense)' },
              ].map((s) => (
                <div key={s.label} className="card stat-card card-glow" style={{ borderTop:`4px solid ${s.top}` }}>
                  <span style={{ fontSize:'1.6rem' }}>{s.icon}</span>
                  <span className="stat-label">{s.label}</span>
                  <span className="stat-value" style={{ fontSize:'1.7rem', color:s.color }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* ── Two-column section ───────────────────── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, marginBottom:24, alignItems:'start' }}>

              {/* Monthly Volume Chart */}
              <div className="card chart-card">
                <p className="chart-title">Platform Transaction Volume — Last 6 Months</p>
                {txMonthly.length === 0 ? (
                  <div className="empty-state" style={{ padding:40 }}><span className="empty-state-icon">📊</span><p>No transaction data yet</p></div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={txMonthly} barSize={12} barCategoryGap="30%">
                      <XAxis dataKey="month" tick={{ fill:'#475569', fontSize:10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:'#475569', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.02)' }} />
                      <Bar dataKey="income"  fill="var(--income)"  radius={[4,4,0,0]} />
                      <Bar dataKey="expense" fill="var(--expense)" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                <div style={{ display:'flex', gap:20, justifyContent:'center', marginTop:10 }}>
                  <span style={{ fontSize:'0.74rem', color:'var(--text-muted)' }}><span style={{ color:'var(--income)', fontWeight:700 }}>■</span> Income</span>
                  <span style={{ fontSize:'0.74rem', color:'var(--text-muted)' }}><span style={{ color:'var(--expense)', fontWeight:700 }}>■</span> Expense</span>
                </div>
              </div>

              {/* Right metrics panel */}
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

                {/* Net Balance card */}
                <div className="card" style={{ padding:'20px 22px', borderTop:'4px solid var(--primary)' }}>
                  <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>💰 Net Platform Balance</p>
                  <p style={{ fontSize:'2rem', fontWeight:900, letterSpacing:'-0.04em', color: parseFloat(ts.net_balance) >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                    {fmtCur(ts.net_balance)}
                  </p>
                  <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:4 }}>Across {ts.total_transactions ?? 0} transactions · {ts.active_users ?? 0} active users</p>
                </div>

                {/* Avg ticket */}
                <div className="card" style={{ padding:'16px 22px' }}>
                  <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>📊 Avg Transaction Size</p>
                  <p style={{ fontSize:'1.5rem', fontWeight:900, color:'var(--accent)' }}>{fmtCur(ts.avg_transaction)}</p>
                </div>

                {/* Income/Expense ratio */}
                <div className="card" style={{ padding:'16px 22px' }}>
                  <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>⚖️ Income / Expense Ratio</p>
                  <div className="progress-bar-bg" style={{ marginBottom:8 }}>
                    <div className="progress-bar" style={{ width:`${incomeRatio}%`, background:'linear-gradient(90deg, var(--income), var(--accent))' }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem' }}>
                    <span style={{ color:'var(--income)', fontWeight:600 }}>Income {incomeRatio}%</span>
                    <span style={{ color:'var(--expense)', fontWeight:600 }}>Expense {100 - incomeRatio}%</span>
                  </div>
                </div>

                {/* User breakdown */}
                <div className="card" style={{ padding:'16px 22px' }}>
                  <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>👥 User Breakdown</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {[
                      { label:'Regular Users', value: us.total_regular_users ?? 0, color:'var(--primary-light)' },
                      { label:'Admins',         value: us.total_admins ?? 0,         color:'var(--secondary)' },
                    ].map((r) => (
                      <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{r.label}</span>
                        <span style={{ fontSize:'1rem', fontWeight:800, color:r.color }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* ── User Management Table ────────────────── */}
            <div className="card" style={{ padding:'24px 0', overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', marginBottom:18, gap:16, flexWrap:'wrap' }}>
                <div>
                  <h3 style={{ marginBottom:3 }}>User Directory</h3>
                  <p style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>
                    {pagination.total} users · Page {pagination.page} of {pagination.pages}
                  </p>
                </div>
                <input
                  id="admin-user-search"
                  className="input"
                  style={{ maxWidth:260 }}
                  placeholder="🔍  Search name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
                      <th style={{ textAlign:'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>
                          {search ? `No users matching "${search}"` : 'No users found.'}
                        </td>
                      </tr>
                    ) : filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                            <div className="user-avatar" style={{
                              width:34, height:34, fontSize:'0.8rem',
                              background: u.role === 'admin'
                                ? 'linear-gradient(135deg,var(--primary),var(--secondary))'
                                : 'linear-gradient(135deg,var(--accent),var(--primary))',
                            }}>
                              {(u.name || u.email || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight:700, fontSize:'0.875rem' }}>{u.name || '—'}</div>
                              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>ID #{u.id}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color:'var(--text-secondary)', fontSize:'0.85rem' }}>{u.email}</td>
                        <td>
                          <span className={`badge badge-${u.role === 'admin' ? 'admin' : 'user'}`}>
                            {u.role === 'admin' ? '🛡️ ' : ''}{u.role}
                          </span>
                        </td>
                        <td style={{ color:'var(--text-muted)', fontSize:'0.82rem', whiteSpace:'nowrap' }}>{fmtDate(u.created_at)}</td>
                        <td style={{ textAlign:'center' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                            <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--income)', boxShadow:'0 0 5px var(--income)' }} />
                            <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Active</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.pages > 1 && (
                <div className="pagination">
                  <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Prev</button>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - page) <= 1)
                    .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i-1] > 1) acc.push('…'); acc.push(p); return acc; }, [])
                    .map((p, i) =>
                      p === '…'
                        ? <span key={`e${i}`} style={{ color:'var(--text-muted)', padding:'0 4px' }}>…</span>
                        : <button key={p} className={`page-btn${p === page ? ' current' : ''}`} onClick={() => setPage(p)}>{p}</button>
                    )
                  }
                  <button className="page-btn" disabled={page >= pagination.pages} onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}>Next →</button>
                </div>
              )}
            </div>

            {/* ── Footer system cards ───────────────────── */}
            {(us.oldest_account || us.newest_account) && (
              <div style={{ display:'flex', gap:14, marginTop:20, flexWrap:'wrap' }}>
                <div className="card" style={{ flex:1, padding:'16px 22px', minWidth:180 }}>
                  <div style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>🗓️ First Account</div>
                  <div style={{ fontWeight:600 }}>{fmtDate(us.oldest_account)}</div>
                </div>
                <div className="card" style={{ flex:1, padding:'16px 22px', minWidth:180 }}>
                  <div style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>✨ Latest Account</div>
                  <div style={{ fontWeight:600 }}>{fmtDate(us.newest_account)}</div>
                </div>
                <div className="card" style={{ flex:1, padding:'16px 22px', minWidth:180 }}>
                  <div style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>🔥 Active Traders</div>
                  <div style={{ fontWeight:600, fontSize:'1.3rem', color:'var(--accent)' }}>{ts.active_users ?? 0}</div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
