import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../api/api.js';

export default function Register() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ name: '', email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await auth.register(form);
      localStorage.setItem('ff_token', data.data.token);
      localStorage.setItem('ff_user',  JSON.stringify(data.data.user));
      navigate('/dashboard');
    } catch (err) {
      const msg     = err.response?.data?.error || 'Registration failed.';
      const details = err.response?.data?.details;
      setError(details ? details.map((d) => d.message).join(', ') : msg);
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

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Start your financial journey today</p>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="input-group">
            <label htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              className="input"
              type="text"
              name="name"
              placeholder="Jane Doe"
              value={form.name}
              onChange={onChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              className="input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={onChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="input"
              type="password"
              name="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={onChange}
              required
              minLength={8}
            />
          </div>
          <button
            id="register-submit"
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={loading}
            style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
          >
            {loading ? (
              <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating account…</>
            ) : (
              '✨ Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: 24 }}>
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
