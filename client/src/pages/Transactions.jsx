import { useEffect, useState, useCallback } from 'react';
import Navbar          from '../components/Navbar.jsx';
import TransactionForm from '../components/TransactionForm.jsx';
import api             from '../api/axios.js';

const fmt  = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().split('T')[0];

const initFilters = { type: '', category: '', startDate: '', endDate: '' };

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [pagination,   setPagination]   = useState({ page: 1, pages: 1, total: 0 });
  const [filters,      setFilters]      = useState(initFilters);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(null); // null | 'create' | tx object (edit)
  const [deleting,     setDeleting]     = useState(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (filters.type)      params.append('type',      filters.type);
      if (filters.category)  params.append('category',  filters.category);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate)   params.append('endDate',   filters.endDate);
      const { data } = await api.get(`/api/v1/transactions?${params}`);
      setTransactions(data.data || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Fetch transactions error', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const onFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((f) => ({ ...f, [name]: value }));
  };
  const clearFilters = () => setFilters(initFilters);

  // ── Create ────────────────────────────────────────────
  const onCreate = async (body) => {
    await api.post('/api/v1/transactions', body);
    fetchData(1);
  };

  // ── Update ────────────────────────────────────────────
  const onUpdate = async (body) => {
    await api.put(`/api/v1/transactions/${modal.id}`, body);
    fetchData(pagination.page);
  };

  // ── Delete ────────────────────────────────────────────
  const onDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    setDeleting(id);
    try {
      await api.delete(`/api/v1/transactions/${id}`);
      fetchData(pagination.page);
    } finally {
      setDeleting(null);
    }
  };

  const editInitial = modal && modal !== 'create'
    ? { type: modal.type, amount: String(modal.amount), category: modal.category, description: modal.description || '', date: modal.date?.split('T')[0] || today() }
    : undefined;

  return (
    <div className="layout">
      <Navbar />
      <main className="main-content fade-in">
        {/* ── Header ────────────────────────────────── */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Transactions</h1>
            <p>{pagination.total} transaction{pagination.total !== 1 ? 's' : ''} found</p>
          </div>
          <button id="add-transaction-btn" className="btn btn-primary" onClick={() => setModal('create')}>
            + New Transaction
          </button>
        </div>

        {/* ── Filters ───────────────────────────────── */}
        <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
          <div className="filter-bar">
            <select
              className="input"
              name="type"
              value={filters.type}
              onChange={onFilterChange}
              style={{ maxWidth: 140 }}
              id="filter-type"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input
              className="input"
              name="category"
              placeholder="Category…"
              value={filters.category}
              onChange={onFilterChange}
              id="filter-category"
            />
            <input
              className="input"
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={onFilterChange}
              id="filter-start"
            />
            <input
              className="input"
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={onFilterChange}
              id="filter-end"
            />
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear</button>
          </div>
        </div>

        {/* ── Table ─────────────────────────────────── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <span style={{ fontSize: 48 }}>💳</span>
              <p>No transactions found. Add your first one!</p>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{tx.date?.split('T')[0]}</td>
                        <td><span style={{ fontWeight: 500 }}>{tx.category}</span></td>
                        <td style={{ color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td><span className={`badge badge-${tx.type}`}>{tx.type}</span></td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)', whiteSpace: 'nowrap' }}>
                          {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ marginRight: 6 }}
                            onClick={() => setModal(tx)}
                            id={`edit-tx-${tx.id}`}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => onDelete(tx.id)}
                            disabled={deleting === tx.id}
                            id={`delete-tx-${tx.id}`}
                          >
                            {deleting === tx.id ? '…' : '🗑️'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ─────────────────────── */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchData(pagination.page - 1)}
                    id="prev-page-btn"
                  >
                    ← Prev
                  </button>

                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - pagination.page) <= 2)
                    .map((p) => (
                      <button
                        key={p}
                        className={`page-btn ${p === pagination.page ? 'current' : ''}`}
                        onClick={() => fetchData(p)}
                        id={`page-btn-${p}`}
                      >
                        {p}
                      </button>
                    ))
                  }

                  <button
                    className="page-btn"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => fetchData(pagination.page + 1)}
                    id="next-page-btn"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ── Modal ──────────────────────────────────── */}
      {modal && (
        <TransactionForm
          initial={editInitial}
          onSave={modal === 'create' ? onCreate : onUpdate}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
