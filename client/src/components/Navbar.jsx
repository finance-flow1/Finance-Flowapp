import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { notifications as notifAPI } from '../api/api.js';

const typeIcon = (t) => ({ success:'✅', warning:'⚠️', error:'🔴', info:'ℹ️' }[t] || 'ℹ️');

export default function Navbar() {
  const navigate  = useNavigate();
  const user      = JSON.parse(localStorage.getItem('ff_user') || '{}');
  const isAdmin   = user.role === 'admin';
  const notifRef  = useRef(null);

  const [notifs,      setNotifs]      = useState([]);
  const [showNotifs,  setShowNotifs]  = useState(false);

  const unread = notifs.filter((n) => !n.read).length;

  /* ── fetch notifications ───────────────────────────── */
  const fetchNotifs = async () => {
    try {
      const res = await notifAPI.list();
      setNotifs(res.data.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30_000); // poll every 30 s
    return () => clearInterval(id);
  }, []);

  /* ── close dropdown on outside click ───────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── mark one notification read ────────────────────── */
  const markRead = async (id) => {
    try {
      await notifAPI.markRead(id);
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (_) {}
  };

  /* ── mark all read ──────────────────────────────────── */
  const markAllRead = async () => {
    try {
      await notifAPI.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (_) {}
  };

  /* ── logout ─────────────────────────────────────────── */
  const logout = () => {
    localStorage.removeItem('ff_token');
    localStorage.removeItem('ff_user');
    navigate('/login');
  };

  const navCls = ({ isActive }) => `nav-item${isActive ? ' active' : ''}`;

  return (
    <aside className="sidebar">
      {/* ── Logo ──────────────────────────────────────── */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">💰</div>
        <span className="sidebar-logo-text">FinanceFlow</span>
      </div>

      {/* ── Navigation (role-split) ────────────────────── */}
      {isAdmin ? (
        <>
          <div className="nav-section-title">Administration</div>
          <NavLink to="/admin" className={navCls}>
            <span className="nav-icon">🛡️</span>
            <span>Admin Panel</span>
          </NavLink>
        </>
      ) : (
        <>
          <div className="nav-section-title">Main</div>
          <NavLink to="/dashboard" className={navCls}>
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/transactions" className={navCls}>
            <span className="nav-icon">💳</span>
            <span>Transactions</span>
          </NavLink>
        </>
      )}

      <div className="nav-spacer" />

      {/* ── Notification bell ─────────────────────────── */}
      <div ref={notifRef} style={{ position: 'relative' }}>
        <button
          id="notif-bell-btn"
          className="nav-item"
          onClick={() => setShowNotifs((v) => !v)}
          style={{ width: '100%', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="nav-icon">🔔</span>
            <span>Notifications</span>
          </div>
          {unread > 0 && (
            <span style={{
              background: 'var(--expense)',
              color: '#fff',
              borderRadius: '50%',
              width: 20, height: 20,
              fontSize: '0.68rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* ── Dropdown panel ────────────────────────────── */}
        {showNotifs && (
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 4px)',
            left: 0,
            width: 300,
            background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            maxHeight: 340,
            overflowY: 'auto',
            zIndex: 9999,
          }}>
            {/* header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky', top: 0,
              background: 'var(--bg-surface)',
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>🔔 Notifications</span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  style={{ fontSize:'0.72rem', color:'var(--primary-light)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* items */}
            {notifs.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                🔕 No notifications yet
              </div>
            ) : (
              notifs.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  id={`notif-${n.id}`}
                  onClick={() => !n.read && markRead(n.id)}
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--glass-border)',
                    cursor: n.read ? 'default' : 'pointer',
                    background: n.read ? 'transparent' : 'rgba(139,92,246,0.07)',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: n.read ? 400 : 600, marginBottom: 2 }}>
                        {typeIcon(n.type)} {n.title}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{n.message}</div>
                    </div>
                    {!n.read && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 5 }} />
                    )}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── User card ─────────────────────────────────── */}
      <div className="user-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="user-avatar">
            {(user.name || user.email || '?')[0].toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div className="user-card-name">{user.name || 'User'}</div>
            <div className="user-card-email">{user.email}</div>
          </div>
        </div>
        <div className="user-card-role">
          <span className={`badge badge-${user.role === 'admin' ? 'admin' : 'user'}`}>
            {user.role}
          </span>
        </div>
      </div>

      <button id="logout-btn" className="nav-item btn-danger" onClick={logout}>
        <span className="nav-icon">🚪</span>
        <span>Sign Out</span>
      </button>
    </aside>
  );
}
