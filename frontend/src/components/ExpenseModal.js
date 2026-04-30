import React, { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import { createExpense, updateExpense, getCategories } from '../utils/api';
import toast from 'react-hot-toast';
import './Modal.css';

const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'upi', 'other'];

const ExpenseModal = ({ onClose, onSaved, expense }) => {
  const [form, setForm] = useState({
    title: '', amount: '', type: 'expense', category: '',
    description: '', date: new Date().toISOString().split('T')[0],
    paymentMethod: 'other', tags: ''
  });
  const [categories, setCategories] = useState({ expense: [], income: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCategories().then(r => setCategories(r.data.data));
    if (expense) {
      setForm({
        title: expense.title,
        amount: expense.amount,
        type: expense.type,
        category: expense.category,
        description: expense.description || '',
        date: expense.date?.split('T')[0] || new Date().toISOString().split('T')[0],
        paymentMethod: expense.paymentMethod || 'other',
        tags: expense.tags?.join(', ') || ''
      });
    }
  }, [expense]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.category) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
      if (expense) {
        await updateExpense(expense._id, payload);
        toast.success('Transaction updated!');
      } else {
        await createExpense(payload);
        toast.success('Transaction added!');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const currentCategories = categories[form.type] || [];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-in">
        <div className="modal-header">
          <h2>{expense ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button className="modal-close" onClick={onClose}><MdClose /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Type Toggle */}
          <div className="type-toggle">
            {['expense', 'income'].map(t => (
              <button key={t} type="button"
                className={`type-btn ${form.type === t ? 'active ' + t : ''}`}
                onClick={() => setForm(f => ({ ...f, type: t, category: '' }))}>
                {t === 'expense' ? '💸 Expense' : '💰 Income'}
              </button>
            ))}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Title *</label>
              <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Grocery shopping" required />
            </div>
            <div className="form-group">
              <label>Amount *</label>
              <input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={handleChange} placeholder="0.00" required />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select name="category" value={form.category} onChange={handleChange} required>
                <option value="">Select category</option>
                {currentCategories.map(c => (
                  <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input name="date" type="date" value={form.date} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. work, personal" />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Optional note..." rows={2} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {expense ? 'Update' : 'Add'} Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseModal;
