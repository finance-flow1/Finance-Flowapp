import { NavLink, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('ff_user') || '{}');
  const isAdmin = user.role === 'admin';

  const logout = () => {
    localStorage.removeItem('ff_token');
    localStorage.removeItem('ff_user');
    navigate('/login');
  };

  const navCls = ({ isActive }) => `nav-item${isActive ? ' active' : ''}`;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">💰</div>
        <span className="sidebar-logo-text">FinanceFlow</span>
      </div>

      <div className="nav-section-title">Main</div>

      <NavLink to="/dashboard" className={navCls}>
        <span className="nav-icon">📊</span>
        <span>Dashboard</span>
      </NavLink>

      <NavLink to="/transactions" className={navCls}>
        <span className="nav-icon">💳</span>
        <span>Transactions</span>
      </NavLink>

      {isAdmin && (
        <>
          <div className="nav-section-title" style={{ marginTop: 8 }}>Admin</div>
          <NavLink to="/admin" className={navCls}>
            <span className="nav-icon">🛡️</span>
            <span>Admin Panel</span>
          </NavLink>
        </>
      )}

      <div className="nav-spacer" />

      {/* User card */}
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
