import React, { useState, useEffect, useCallback } from 'react';
import { MdAdd, MdSearch, MdFilterList, MdEdit, MdDelete } from 'react-icons/md';
import { getExpenses, deleteExpense, getCategories } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ExpenseModal from '../components/ExpenseModal';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './Expenses.css';

const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [categories, setCategories] = useState({ expense: [], income: [] });
  const [filters, setFilters] = useState({ page: 1, limit: 15, type: '', category: '', search: '', sortBy: 'date', sortOrder: 'desc' });
  const [showFilters, setShowFilters] = useState(false);

  const currencySymbol = user?.currency === 'INR' ? '₹' : user?.currency === 'EUR' ? '€' : user?.currency === 'GBP' ? '£' : '$';
  const fmt = (n) => `${currencySymbol}${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getExpenses(filters);
      setExpenses(data.data);
      setPagination(data.pagination);
    } catch (err) { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { getCategories().then(r => setCategories(r.data.data)); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await deleteExpense(id);
      toast.success('Deleted!');
      fetchExpenses();
    } catch { toast.error('Failed to delete'); }
  };

  const handleEdit = (expense) => { setEditExpense(expense); setShowModal(true); };
  const handleAdd = () => { setEditExpense(null); setShowModal(true); };
  const handleSaved = () => { setShowModal(false); setEditExpense(null); fetchExpenses(); };
  const allCategories = [...(categories.expense || []), ...(categories.income || [])];

  return (
    <div className="expenses-page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{pagination.total || 0} total records</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost" onClick={() => setShowFilters(f => !f)}>
            <MdFilterList /> Filters
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>
            <MdAdd /> Add
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className={`filters-panel card ${showFilters ? 'filters-panel--open' : ''}`}>
        <div className="search-bar">
          <MdSearch className="search-icon" />
          <input placeholder="Search transactions..." value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} />
        </div>
        {showFilters && (
          <div className="filter-controls">
            <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value, page: 1 }))}>
              <option value="">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value, page: 1 }))}>
              <option value="">All Categories</option>
              {allCategories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            <select value={filters.sortOrder} onChange={e => setFilters(f => ({ ...f, sortOrder: e.target.value }))}>
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
            <button className="btn btn-ghost" onClick={() => setFilters({ page: 1, limit: 15, type: '', category: '', search: '', sortBy: 'date', sortOrder: 'desc' })}>
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card table-card">
        {loading ? (
          <div className="table-loading"><div className="spinner" /></div>
        ) : expenses.length === 0 ? (
          <div className="table-empty">
            <div style={{ fontSize: '2.5rem' }}>📊</div>
            <p>No transactions found</p>
            <button className="btn btn-primary" onClick={handleAdd}><MdAdd /> Add First Transaction</button>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="expense-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Payment</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(e => (
                    <tr key={e._id}>
                      <td>
                        <div className="t-title">{e.title}</div>
                        {e.description && <div className="t-desc">{e.description}</div>}
                      </td>
                      <td><span className="t-category">{e.category}</span></td>
                      <td className="t-date">{format(new Date(e.date), 'MMM d, yyyy')}</td>
                      <td className="t-payment">{e.paymentMethod?.replace('_', ' ')}</td>
                      <td><span className={`badge badge-${e.type}`}>{e.type}</span></td>
                      <td className={e.type === 'income' ? 'amount-income' : 'amount-expense'}>
                        {e.type === 'income' ? '+' : '-'}{fmt(e.amount)}
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="action-btn edit" onClick={() => handleEdit(e)} title="Edit"><MdEdit /></button>
                          <button className="action-btn delete" onClick={() => handleDelete(e._id)} title="Delete"><MdDelete /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button className="btn btn-ghost" disabled={filters.page === 1}
                  onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>Prev</button>
                <span className="page-info">Page {filters.page} of {pagination.pages}</span>
                <button className="btn btn-ghost" disabled={filters.page >= pagination.pages}
                  onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && <ExpenseModal expense={editExpense} onClose={() => { setShowModal(false); setEditExpense(null); }} onSaved={handleSaved} />}
    </div>
  );
};

export default Expenses;
