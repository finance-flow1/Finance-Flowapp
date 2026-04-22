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
    setForm((f) => ({ ...f, [name]: name === 'amount' ? value : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { setError('Amount must be a positive number.'); return; }
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
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isEditing ? 'Edit Transaction' : 'New Transaction'}</h3>
          <button className="modal-close" id="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label>Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
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
                      ? t === 'income' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'
                      : 'var(--glass-border)'}`,
                  }}
                >
                  {t === 'income' ? '📈 Income' : '📉 Expense'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label htmlFor="tx-amount">Amount ($)</label>
              <input id="tx-amount" className="input" type="number" name="amount" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={onChange} required />
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
            <input id="tx-description" className="input" type="text" name="description" placeholder="Short note…" value={form.description} onChange={onChange} maxLength={500} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button id="tx-save-btn" type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Saving…' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
