import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../api/api.js';

/* ── decorative floating orbs ───────────────────────────── */
const Orb = ({ size, top, left, color, delay = 0 }) => (
  <div style={{
    position: 'absolute', borderRadius: '50%',
    width: size, height: size, top, left,
    background: color, filter: 'blur(80px)',
    opacity: 0.18,
    animation: `floatOrb 8s ease-in-out ${delay}s infinite alternate`,
    pointerEvents: 'none',
  }} />
);

const features = [
  { icon: '📊', title: 'Smart Analytics',      desc: 'Visual income vs expense charts across 12 months' },
  { icon: '💳', title: 'Transaction Tracking', desc: 'Create, filter and manage all your financial records' },
  { icon: '🔔', title: 'Live Notifications',   desc: 'Instant alerts every time a transaction is recorded' },
  { icon: '🛡️', title: 'Secure by Design',     desc: 'JWT auth, bcrypt hashing, and role-based access' },
];

const stats = [
  { value: '99.9%', label: 'Uptime' },
  { value: '256-bit', label: 'Encryption' },
  { value: '< 50ms', label: 'API latency' },
];

export default function Login() {
  const navigate  = useNavigate();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await auth.login(form);
      const user = data.data.user;
      localStorage.setItem('ff_token', data.data.token);
      localStorage.setItem('ff_user',  JSON.stringify(user));
      // Role-aware redirect: admin → /admin, user → /dashboard
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* floating-orb animation */}
      <style>{`
        @keyframes floatOrb {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(30px, -40px) scale(1.12); }
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .login-split { display: flex; min-height: 100vh; }

        /* ── LEFT PANEL ── */
        .login-left {
          flex: 1.15; position: relative; overflow: hidden;
          background: linear-gradient(145deg, #060b18 0%, #0b1228 40%, #080d1e 100%);
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 52px 56px;
        }
        .login-brand { display: flex; align-items: center; gap: 14px; }
        .login-brand-icon {
          width: 46px; height: 46px; border-radius: 14px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; box-shadow: 0 4px 20px rgba(99,102,241,0.4);
        }
        .login-brand-name { font-size: 1.25rem; font-weight: 800; color: #e2e8f0; }
        .login-hero { margin: 60px 0 40px; }
        .login-hero h2 {
          font-size: 2.6rem; font-weight: 900; line-height: 1.15;
          letter-spacing: -0.05em; color: #fff; margin-bottom: 16px;
          background: linear-gradient(135deg, #e2e8f0 0%, #818cf8 50%, #a78bfa 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .login-hero p { font-size: 1rem; color: #64748b; max-width: 380px; line-height: 1.65; }
        .feature-list { display: flex; flex-direction: column; gap: 14px; margin-bottom: 48px; }
        .feature-item {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 14px 18px; border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.2s ease;
        }
        .feature-item:hover { background: rgba(99,102,241,0.07); border-color: rgba(99,102,241,0.2); }
        .feature-icon {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.2);
          display: flex; align-items: center; justify-content: center; font-size: 17px;
        }
        .feature-title { font-size: 0.875rem; font-weight: 700; color: #e2e8f0; margin-bottom: 2px; }
        .feature-desc  { font-size: 0.78rem;  color: #475569; line-height: 1.4; }
        .stats-row { display: flex; gap: 32px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.06); }
        .stat-box  { }
        .stat-num  { font-size: 1.4rem; font-weight: 900; color: #818cf8; letter-spacing: -0.04em; }
        .stat-lbl  { font-size: 0.72rem; color: #475569; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

        /* ── RIGHT PANEL ── */
        .login-right {
          width: 460px; flex-shrink: 0;
          background: rgba(9,14,26,0.98);
          border-left: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: center;
          padding: 48px 40px;
        }
        .login-form-wrap { width: 100%; max-width: 360px; }
        .login-form-title {
          font-size: 1.75rem; font-weight: 800; letter-spacing: -0.04em;
          color: #e2e8f0; margin-bottom: 6px;
        }
        .login-form-sub { font-size: 0.875rem; color: #475569; margin-bottom: 32px; }
        .pw-wrap { position: relative; }
        .pw-wrap .input { padding-right: 44px; }
        .pw-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #475569; font-size: 1rem; padding: 4px;
          transition: color 0.2s; line-height: 1;
        }
        .pw-toggle:hover { color: #818cf8; }
        .login-submit {
          width: 100%; padding: 14px; border: none; border-radius: 10px;
          font-size: 0.95rem; font-weight: 700; cursor: pointer; margin-top: 8px;
          font-family: inherit; letter-spacing: 0.01em;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff; box-shadow: 0 4px 24px rgba(99,102,241,0.4);
          transition: all 0.2s ease; display: flex; align-items: center;
          justify-content: center; gap: 8px;
        }
        .login-submit:hover:not(:disabled) {
          transform: translateY(-2px); box-shadow: 0 8px 32px rgba(99,102,241,0.5);
        }
        .login-submit:active:not(:disabled) { transform: translateY(0); }
        .login-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .divider-line {
          display: flex; align-items: center; gap: 12px; margin: 24px 0;
        }
        .divider-line::before, .divider-line::after {
          content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.06);
        }
        .divider-line span { font-size: 0.72rem; color: #334155; font-weight: 600; }
        .login-footer { text-align: center; font-size: 0.85rem; color: #475569; }
        .login-footer a { color: #818cf8; text-decoration: none; font-weight: 600; }
        .login-footer a:hover { text-decoration: underline; }
        .demo-box {
          margin-top: 20px; padding: 14px 16px; border-radius: 10px;
          background: rgba(99,102,241,0.07); border: 1px solid rgba(99,102,241,0.15);
          font-size: 0.78rem; color: #64748b;
        }
        .demo-box strong { color: #818cf8; }
        .demo-row { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
        .demo-creds {
          font-family: 'Courier New', monospace; font-size: 0.76rem;
          color: #94a3b8; letter-spacing: 0.02em;
        }
        .error-box {
          background: rgba(244,63,94,0.1); color: #f43f5e;
          border: 1px solid rgba(244,63,94,0.25); border-radius: 8px;
          padding: 10px 14px; font-size: 0.84rem; margin-bottom: 16px;
          display: flex; align-items: center; gap: 8px;
          animation: shake 0.3s ease;
        }
        @media (max-width: 900px) {
          .login-left { display: none; }
          .login-right { width: 100%; border-left: none; }
        }
      `}</style>

      <div className="login-split">

        {/* ═══════════════ LEFT PANEL ═══════════════ */}
        <div className="login-left">
          {/* decorative orbs */}
          <Orb size="420px" top="-80px"  left="-80px" color="#6366f1" delay={0} />
          <Orb size="300px" top="40%"    left="50%"   color="#8b5cf6" delay={2} />
          <Orb size="280px" top="70%"    left="-40px" color="#06b6d4" delay={4} />

          {/* brand */}
          <div className="login-brand" style={{ position: 'relative', zIndex: 1 }}>
            <div className="login-brand-icon">💰</div>
            <span className="login-brand-name">FinanceFlow</span>
          </div>

          {/* hero */}
          <div className="login-hero" style={{ position: 'relative', zIndex: 1 }}>
            <h2>Take control of<br />your finances</h2>
            <p>A full-stack personal finance platform built for clarity, speed, and security.</p>
          </div>

          {/* features */}
          <div className="feature-list" style={{ position: 'relative', zIndex: 1 }}>
            {features.map((f) => (
              <div key={f.title} className="feature-item">
                <div className="feature-icon">{f.icon}</div>
                <div>
                  <div className="feature-title">{f.title}</div>
                  <div className="feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* stats */}
          <div className="stats-row" style={{ position: 'relative', zIndex: 1 }}>
            {stats.map((s) => (
              <div key={s.label} className="stat-box">
                <div className="stat-num">{s.value}</div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════ RIGHT PANEL ═══════════════ */}
        <div className="login-right">
          <div className="login-form-wrap slide-up">
            <p className="login-form-title">Welcome back 👋</p>
            <p className="login-form-sub">Sign in to your account to continue</p>

            {error && (
              <div className="error-box">⚠️ {error}</div>
            )}

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div className="input-group">
                <label htmlFor="login-email">Email address</label>
                <input
                  id="login-email"
                  className="input"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={onChange}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label htmlFor="login-password">Password</label>
                <div className="pw-wrap">
                  <input
                    id="login-password"
                    className="input"
                    type={showPw ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={onChange}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    onClick={() => setShowPw((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    Signing in…
                  </>
                ) : '🚀 Sign In'}
              </button>
            </form>

            <div className="divider-line"><span>or</span></div>

            <div className="login-footer">
              Don't have an account?{' '}
              <Link to="/register">Create one free →</Link>
            </div>

            {/* demo credentials box */}
            <div className="demo-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span>🔑</span>
                <strong>Demo credentials</strong>
              </div>
              <div className="demo-row">
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Admin account</span>
                <span className="demo-creds">admin@finance.com / Admin123!</span>
              </div>
              <div className="demo-row" style={{ marginTop: 4 }}>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Regular user</span>
                <Link to="/register" style={{ fontSize: '0.76rem', color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>
                  Register →
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
