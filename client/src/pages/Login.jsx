import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../api/api.js';

export default function Login() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await auth.login(form);
      localStorage.setItem('ff_token', data.data.token);
      localStorage.setItem('ff_user',  JSON.stringify(data.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card slide-up">
        <div className="auth-logo">
          <div className="auth-logo-icon">💰</div>
          <span className="auth-logo-text">FinanceFlow</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to manage your finances</p>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="input-group">
            <label htmlFor="login-email">Email Address</label>
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
            />
          </div>
          <div className="input-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="input"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={onChange}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            id="login-submit"
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={loading}
            style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
          >
            {loading ? (
              <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in…</>
            ) : (
              '🚀 Sign In'
            )}
          </button>
        </form>

        <div className="auth-divider" style={{ margin: '20px 0 0' }}>
          <span>or</span>
        </div>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">Create one free</Link>
        </div>

        <div className="auth-demo">
          <span>🔑</span>
          <div>
            <strong>Demo admin:</strong>{' '}
            <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
              admin@finance.com / Admin123!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
