import { useEffect, useState, useCallback } from 'react';
import Navbar          from '../components/Navbar.jsx';
import TransactionForm from '../components/TransactionForm.jsx';
import { transactions } from '../api/api.js';

const fmt  = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().split('T')[0];

const initFilters = { type: '', category: '', startDate: '', endDate: '' };

export default function Transactions() {
  const [data,         setData]         = useState([]);
  const [pagination,   setPagination]   = useState({ page: 1, pages: 1, total: 0 });
  const [filters,      setFilters]      = useState(initFilters);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(null); // null | 'create' | tx object (edit)
  const [deleting,     setDeleting]     = useState(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters };
      const res = await transactions.list(params);
      setData(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
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

  const onCreate = async (body) => {
    await transactions.create(body);
    fetchData(1);
  };

  const onUpdate = async (body) => {
    await transactions.update(modal.id, body);
    fetchData(pagination.page);
  };

  const onDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    setDeleting(id);
    try {
      await transactions.remove(id);
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
        <div className="page-header-row">
          <div className="page-header">
            <h1>Transactions</h1>
            <p>Monitor and manage your financial records</p>
          </div>
          <button id="add-transaction-btn" className="btn btn-primary btn-lg" onClick={() => setModal('create')}>
            ✨ New Transaction
          </button>
        </div>

        {/* ── Filters ───────────────────────────────── */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
          <div className="filter-bar">
            <div className="input-group" style={{ flex: '1 1 120px' }}>
                <select className="input" name="type" value={filters.type} onChange={onFilterChange} id="filter-type">
                    <option value="">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>
            </div>
            <div className="input-group" style={{ flex: '2 1 180px' }}>
                <input className="input" name="category" placeholder="Search category..." value={filters.category} onChange={onFilterChange} id="filter-category" />
            </div>
            <div className="input-group" style={{ flex: '1 1 140px' }}>
                <input className="input" type="date" name="startDate" value={filters.startDate} onChange={onFilterChange} id="filter-start" />
            </div>
            <div className="input-group" style={{ flex: '1 1 140px' }}>
                <input className="input" type="date" name="endDate" value={filters.endDate} onChange={onFilterChange} id="filter-end" />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Reset Filters</button>
          </div>
        </div>

        {/* ── Table ─────────────────────────────────── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /><p className="spinner-text">Syncing transactions...</p></div>
          ) : data.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📄</span>
              <p>No records matching your criteria. Try adjusting filters.</p>
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
                    {data.map((tx) => (
                      <tr key={tx.id} className={tx.type === 'income' ? 'row-income' : 'row-expense'}>
                        <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{tx.date?.split('T')[0]}</td>
                        <td><span style={{ fontWeight: 600 }}>{tx.category}</span></td>
                        <td style={{ color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.description || <span style={{ color: 'var(--text-muted)' }}>No description</span>}
                        </td>
                        <td><span className={`badge badge-${tx.type}`}>{tx.type}</span></td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)', whiteSpace: 'nowrap' }}>
                          {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button className="btn btn-secondary btn-sm" style={{ marginRight: 8 }} onClick={() => setModal(tx)} id={`edit-tx-${tx.id}`}>
                            ✏️
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => onDelete(tx.id)} disabled={deleting === tx.id} id={`delete-tx-${tx.id}`}>
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
                  <button className="page-btn" disabled={pagination.page <= 1} onClick={() => fetchData(pagination.page - 1)} id="prev-page-btn">
                    Previous
                  </button>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - pagination.page) <= 2)
                    .map((p) => (
                      <button key={p} className={`page-btn ${p === pagination.page ? 'current' : ''}`} onClick={() => fetchData(p)} id={`page-btn-${p}`}>
                        {p}
                      </button>
                    ))
                  }
                  <button className="page-btn" disabled={pagination.page >= pagination.pages} onClick={() => fetchData(pagination.page + 1)} id="next-page-btn">
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

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
