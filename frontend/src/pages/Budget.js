import React, { useState, useEffect } from 'react';
import { MdAdd, MdDelete, MdWarning } from 'react-icons/md';
import { getBudgets, createBudget, deleteBudget, getCategories } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Budget.css';

const Budget = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: '', amount: '', alertThreshold: 80 });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const currencySymbol = user?.currency === 'INR' ? '₹' : user?.currency === 'EUR' ? '€' : user?.currency === 'GBP' ? '£' : '$';
  const fmt = (n) => `${currencySymbol}${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const { data } = await getBudgets({ month: selectedMonth, year: selectedYear });
      setBudgets(data.data);
    } catch { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBudgets(); }, [selectedMonth, selectedYear]);
  useEffect(() => { getCategories().then(r => setCategories(r.data.data.expense || [])); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.category || !form.amount) { toast.error('Fill all fields'); return; }
    try {
      await createBudget({ ...form, amount: parseFloat(form.amount), month: selectedMonth, year: selectedYear });
      toast.success('Budget saved!');
      setShowForm(false);
      setForm({ category: '', amount: '', alertThreshold: 80 });
      fetchBudgets();
    } catch { toast.error('Failed to save budget'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this budget?')) return;
    try { await deleteBudget(id); toast.success('Budget deleted!'); fetchBudgets(); }
    catch { toast.error('Failed to delete'); }
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="budget-page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Budget</h1>
          <p className="page-subtitle">Set and track spending limits</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} style={{ width: 'auto' }}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{ width: 'auto' }}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowForm(f => !f)}>
            <MdAdd /> {showForm ? 'Cancel' : 'Add Budget'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card budget-form animate-in">
          <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-display)', fontSize: '1rem' }}>Set Budget</h3>
          <form onSubmit={handleSubmit} className="budget-form-grid">
            <div className="form-group">
              <label>Category *</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Budget Amount *</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" min="0.01" step="0.01" required />
            </div>
            <div className="form-group">
              <label>Alert at (%)</label>
              <input type="number" value={form.alertThreshold} onChange={e => setForm(f => ({ ...f, alertThreshold: e.target.value }))} min="1" max="100" />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Budget</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
      ) : budgets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💰</div>
          <p>No budgets set for this month.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowForm(true)}><MdAdd /> Add Budget</button>
        </div>
      ) : (
        <div className="budget-grid">
          {budgets.map(b => {
            const pct = Math.min(b.percentage, 100);
            const isOver = b.percentage >= 100;
            const isWarning = b.percentage >= b.alertThreshold && !isOver;
            return (
              <div key={b._id} className={`card budget-card ${isOver ? 'budget-card--over' : isWarning ? 'budget-card--warning' : ''}`}>
                <div className="budget-card__header">
                  <span className="budget-cat">{b.category}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {(isOver || isWarning) && <MdWarning className={isOver ? 'warn-icon over' : 'warn-icon warning'} />}
                    <button className="action-btn delete" onClick={() => handleDelete(b._id)}><MdDelete /></button>
                  </div>
                </div>
                <div className="budget-amounts">
                  <span className="budget-spent">{fmt(b.spent)} <span className="budget-of">spent</span></span>
                  <span className="budget-total">of {fmt(b.amount)}</span>
                </div>
                <div className="budget-bar-bg">
                  <div className="budget-bar-fill" style={{
                    width: `${pct}%`,
                    background: isOver ? 'var(--accent-red)' : isWarning ? 'var(--accent-orange)' : 'var(--accent-primary)'
                  }} />
                </div>
                <div className="budget-footer">
                  <span className={`budget-pct ${isOver ? 'over' : isWarning ? 'warning' : ''}`}>{b.percentage}% used</span>
                  <span className="budget-remaining">{b.remaining >= 0 ? fmt(b.remaining) + ' left' : fmt(Math.abs(b.remaining)) + ' over'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Budget;
