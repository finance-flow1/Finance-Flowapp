import { useState, useEffect } from 'react';

const CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Housing', 'Health', 'Education', 'Other'];

const today = () => new Date().toISOString().split('T')[0];

const empty = { type: 'income', amount: '', category: 'Salary', description: '', date: today() };

export default function TransactionForm({ initial, onSave, onClose }) {
  const [form, setForm]       = useState(initial || empty);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { setForm(initial || empty); }, [initial]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { setError('Please enter a valid positive amount.'); return; }
    setLoading(true);
    try {
      await onSave({ ...form, amount });
      onClose();
    } catch (err) {
      const details = err.response?.data?.details;
      setError(details ? details.map((d) => d.message).join(', ') : err.response?.data?.error || 'Failed to save transaction.');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!initial;

  return (
    <div className="modal-overlay fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal slide-up">
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>{isEditing ? 'Edit Entry' : 'Create Entry'}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isEditing ? 'Modify your record' : 'Add to your ledger'}</p>
          </div>
          <button className="modal-close" id="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 20 }}>{error}</div>}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="input-group">
            <label>Transaction Type</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['income', 'expense'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className="btn"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    background: form.type === t
                      ? t === 'income' ? 'var(--income-bg)' : 'var(--expense-bg)'
                      : 'var(--glass-bg)',
                    color: form.type === t
                      ? t === 'income' ? 'var(--income)' : 'var(--expense)'
                      : 'var(--text-secondary)',
                    border: `1px solid ${form.type === t
                      ? t === 'income' ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)'
                      : 'var(--glass-border)'}`,
                    boxShadow: form.type === t ? `0 4px 12px ${t === 'income' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'}` : 'none'
                  }}
                >
                  {t === 'income' ? '📈 Income' : '📉 Expense'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-2">
            <div className="input-group">
              <label htmlFor="tx-amount">Amount</label>
              <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>$</span>
                  <input id="tx-amount" className="input" style={{ paddingLeft: 28 }} type="number" name="amount" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={onChange} required />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="tx-date">Date</label>
              <input id="tx-date" className="input" type="date" name="date" value={form.date} onChange={onChange} required />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="tx-category">Category</label>
            <select id="tx-category" className="input" name="category" value={form.category} onChange={onChange}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="tx-description">Description (optional)</label>
            <textarea 
              id="tx-description" 
              className="input" 
              name="description" 
              placeholder="What was this for?..." 
              value={form.description} 
              onChange={onChange} 
              maxLength={500}
              style={{ minHeight: 80, resize: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button id="tx-save-btn" type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
              {loading ? (
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              ) : isEditing ? '🚀 Save Changes' : '✨ Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
