import { NavLink, useNavigate } from 'react-router-dom';

const NAV = [
  { to: '/dashboard',    icon: '📊', label: 'Dashboard' },
  { to: '/transactions', icon: '💳', label: 'Transactions' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem('ff_user') || '{}');

  const logout = () => {
    localStorage.removeItem('ff_token');
    localStorage.removeItem('ff_user');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">💰</div>
        <span className="sidebar-logo-text">FinanceFlow</span>
      </div>

      {NAV.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}

      <div className="nav-spacer" />

      <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', marginBottom: 12 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Signed in as</div>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.name || user.email}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: 2 }}>{user.role}</div>
      </div>

      <button id="logout-btn" className="nav-item btn-danger" onClick={logout}>
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </aside>
  );
}
