import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../api/api.js';

/* ── Floating orb ────────────────────────────────────────── */
const Orb = ({ size, top, left, color, delay = 0 }) => (
  <div style={{
    position: 'absolute', borderRadius: '50%',
    width: size, height: size, top, left,
    background: color, filter: 'blur(90px)',
    opacity: 0.16,
    animation: `floatOrb 9s ease-in-out ${delay}s infinite alternate`,
    pointerEvents: 'none',
  }} />
);

/* ── Password strength ───────────────────────────────────── */
const getStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8)               score++;
  if (pw.length >= 12)              score++;
  if (/[A-Z]/.test(pw))            score++;
  if (/[0-9]/.test(pw))            score++;
  if (/[^A-Za-z0-9]/.test(pw))    score++;
  return score;
};
const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
const strengthColor = ['', '#f43f5e', '#f59e0b', '#eab308', '#10b981', '#06b6d4'];

const benefits = [
  { icon: '🚀', text: 'Up and running in under 60 seconds' },
  { icon: '🔒', text: 'Your data is encrypted at rest and in transit' },
  { icon: '📊', text: 'Beautiful analytics from day one' },
  { icon: '🔔', text: 'Real-time notifications on every transaction' },
  { icon: '🌍', text: 'Access from anywhere, any device' },
];

const testimonial = {
  quote: '"FinanceFlow gave me a crystal-clear picture of where my money goes every month."',
  name:  'Sarah K.',
  role:  'Freelance Designer',
};

export default function Register() {
  const navigate  = useNavigate();
  const [form,    setForm]    = useState({ name: '', email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [touched, setTouched] = useState(false);

  const strength = useMemo(() => getStrength(form.password), [form.password]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === 'password' && !touched) setTouched(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await auth.register(form);
      localStorage.setItem('ff_token', data.data.token);
      localStorage.setItem('ff_user',  JSON.stringify(data.data.user));
      // New users are always role=user → /dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const details = err.response?.data?.details;
      const msg     = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(details ? details.map((d) => d.message).join(' · ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes floatOrb {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(-30px, 40px) scale(1.1); }
        }
        .reg-split { display: flex; min-height: 100vh; }

        /* ── LEFT ── */
        .reg-left {
          flex: 1.1; position: relative; overflow: hidden;
          background: linear-gradient(150deg, #06091a 0%, #0a1020 50%, #070c1c 100%);
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 52px 56px;
        }
        .reg-brand { display: flex; align-items: center; gap: 14px; position: relative; z-index: 1; }
        .reg-brand-icon {
          width: 46px; height: 46px; border-radius: 14px;
          background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; box-shadow: 0 4px 20px rgba(139,92,246,0.4);
        }
        .reg-brand-name { font-size: 1.25rem; font-weight: 800; color: #e2e8f0; }

        .reg-hero { margin: 56px 0 36px; position: relative; z-index: 1; }
        .reg-hero h2 {
          font-size: 2.5rem; font-weight: 900; line-height: 1.15;
          letter-spacing: -0.05em; margin-bottom: 14px;
          background: linear-gradient(135deg, #e2e8f0 0%, #a78bfa 50%, #22d3ee 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .reg-hero p { font-size: 0.95rem; color: #64748b; max-width: 360px; line-height: 1.65; }

        .benefit-list { display: flex; flex-direction: column; gap: 10px; position: relative; z-index: 1; }
        .benefit-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 10px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.04);
          transition: all 0.2s;
        }
        .benefit-item:hover { background: rgba(139,92,246,0.07); border-color: rgba(139,92,246,0.18); }
        .benefit-icon {
          width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
          background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.2);
          display: flex; align-items: center; justify-content: center; font-size: 15px;
        }
        .benefit-text { font-size: 0.83rem; color: #94a3b8; }

        .testimonial-box {
          position: relative; z-index: 1;
          padding: 20px 22px; border-radius: 12px;
          background: rgba(139,92,246,0.06);
          border: 1px solid rgba(139,92,246,0.14);
          margin-top: 28px;
        }
        .testimonial-quote { font-size: 0.84rem; color: #94a3b8; line-height: 1.6; font-style: italic; margin-bottom: 12px; }
        .testimonial-author { display: flex; align-items: center; gap: 10px; }
        .testimonial-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.78rem; font-weight: 700; color: #fff; flex-shrink: 0;
        }
        .testimonial-name { font-size: 0.8rem; font-weight: 700; color: #e2e8f0; }
        .testimonial-role { font-size: 0.72rem; color: #475569; }

        /* ── RIGHT ── */
        .reg-right {
          width: 480px; flex-shrink: 0;
          background: rgba(9,14,26,0.98);
          border-left: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: center;
          padding: 48px 40px; overflow-y: auto;
        }
        .reg-form-wrap { width: 100%; max-width: 380px; }
        .reg-form-title {
          font-size: 1.75rem; font-weight: 800; letter-spacing: -0.04em;
          color: #e2e8f0; margin-bottom: 6px;
        }
        .reg-form-sub { font-size: 0.875rem; color: #475569; margin-bottom: 28px; }

        /* strength bar */
        .strength-wrap { margin-top: 8px; }
        .strength-bar-bg {
          height: 4px; border-radius: 99px;
          background: rgba(255,255,255,0.06); overflow: hidden;
        }
        .strength-bar-fill {
          height: 100%; border-radius: 99px; transition: width 0.4s ease, background 0.4s ease;
        }
        .strength-text {
          font-size: 0.72rem; font-weight: 700;
          margin-top: 5px; text-transform: uppercase; letter-spacing: 0.05em;
        }

        /* password toggle */
        .pw-wrap-r  { position: relative; }
        .pw-wrap-r .input { padding-right: 44px; }
        .pw-toggle-r {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #475569; font-size: 1rem; padding: 4px; transition: color 0.2s; line-height: 1;
        }
        .pw-toggle-r:hover { color: #a78bfa; }

        /* submit */
        .reg-submit {
          width: 100%; padding: 14px; border: none; border-radius: 10px;
          font-size: 0.95rem; font-weight: 700; cursor: pointer; margin-top: 8px;
          font-family: inherit;
          background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
          color: #fff; box-shadow: 0 4px 24px rgba(139,92,246,0.35);
          transition: all 0.2s ease; display: flex;
          align-items: center; justify-content: center; gap: 8px;
        }
        .reg-submit:hover:not(:disabled) {
          transform: translateY(-2px); box-shadow: 0 8px 32px rgba(139,92,246,0.45);
        }
        .reg-submit:active:not(:disabled) { transform: translateY(0); }
        .reg-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .reg-error {
          background: rgba(244,63,94,0.1); color: #f43f5e;
          border: 1px solid rgba(244,63,94,0.25); border-radius: 8px;
          padding: 10px 14px; font-size: 0.84rem; margin-bottom: 16px;
          display: flex; align-items: flex-start; gap: 8px;
          animation: shake 0.3s ease;
        }
        .reg-footer { text-align: center; margin-top: 20px; font-size: 0.85rem; color: #475569; }
        .reg-footer a { color: #a78bfa; text-decoration: none; font-weight: 600; }
        .reg-footer a:hover { text-decoration: underline; }
        .terms-note { font-size: 0.72rem; color: #334155; text-align: center; margin-top: 12px; line-height: 1.5; }
        .divider-r { display: flex; align-items: center; gap: 12px; margin: 22px 0; }
        .divider-r::before, .divider-r::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
        .divider-r span { font-size: 0.72rem; color: #334155; font-weight: 600; }

        @media (max-width: 900px) {
          .reg-left  { display: none; }
          .reg-right { width: 100%; border-left: none; }
        }
      `}</style>

      <div className="reg-split">

        {/* ═══════════ LEFT PANEL ═══════════ */}
        <div className="reg-left">
          <Orb size="380px" top="-60px"  left="-60px" color="#8b5cf6" delay={0} />
          <Orb size="300px" top="45%"    left="55%"   color="#06b6d4" delay={3} />
          <Orb size="250px" top="75%"    left="-30px" color="#6366f1" delay={1.5} />

          {/* brand */}
          <div className="reg-brand">
            <div className="reg-brand-icon">💰</div>
            <span className="reg-brand-name">FinanceFlow</span>
          </div>

          {/* hero */}
          <div className="reg-hero">
            <h2>Your money,<br />your story</h2>
            <p>Join FinanceFlow and start building a clear, real-time picture of your financial life — for free.</p>
          </div>

          {/* benefits */}
          <div className="benefit-list">
            {benefits.map((b) => (
              <div key={b.text} className="benefit-item">
                <div className="benefit-icon">{b.icon}</div>
                <span className="benefit-text">{b.text}</span>
              </div>
            ))}
          </div>

          {/* testimonial */}
          <div className="testimonial-box">
            <p className="testimonial-quote">{testimonial.quote}</p>
            <div className="testimonial-author">
              <div className="testimonial-avatar">
                {testimonial.name[0]}
              </div>
              <div>
                <div className="testimonial-name">{testimonial.name}</div>
                <div className="testimonial-role">{testimonial.role}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ RIGHT PANEL ═══════════ */}
        <div className="reg-right">
          <div className="reg-form-wrap slide-up">

            <p className="reg-form-title">Create account ✨</p>
            <p className="reg-form-sub">Free forever. No credit card required.</p>

            {error && (
              <div className="reg-error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Name */}
              <div className="input-group">
                <label htmlFor="reg-name">Full name</label>
                <input
                  id="reg-name"
                  className="input"
                  type="text"
                  name="name"
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={onChange}
                  required
                  autoFocus
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div className="input-group">
                <label htmlFor="reg-email">Email address</label>
                <input
                  id="reg-email"
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

              {/* Password */}
              <div className="input-group">
                <label htmlFor="reg-password">Password</label>
                <div className="pw-wrap-r">
                  <input
                    id="reg-password"
                    className="input"
                    type={showPw ? 'text' : 'password'}
                    name="password"
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={onChange}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="pw-toggle-r"
                    onClick={() => setShowPw((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>

                {/* strength meter */}
                {touched && form.password.length > 0 && (
                  <div className="strength-wrap">
                    <div className="strength-bar-bg">
                      <div
                        className="strength-bar-fill"
                        style={{
                          width:      `${(strength / 5) * 100}%`,
                          background: strengthColor[strength],
                        }}
                      />
                    </div>
                    <p className="strength-text" style={{ color: strengthColor[strength] }}>
                      {strengthLabel[strength]}
                    </p>
                  </div>
                )}
              </div>

              <button
                id="register-submit"
                type="submit"
                className="reg-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    Creating account…
                  </>
                ) : '✨ Create Free Account'}
              </button>
            </form>

            <p className="terms-note">
              By creating an account you agree to our Terms of Service and Privacy Policy.
            </p>

            <div className="divider-r"><span>or</span></div>

            <div className="reg-footer">
              Already have an account?{' '}
              <Link to="/login">Sign in →</Link>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
