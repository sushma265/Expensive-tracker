import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { MdTrendingUp, MdTrendingDown, MdAccountBalance, MdReceipt, MdAdd, MdArrowForward } from 'react-icons/md';
import { getDashboardSummary, getCategoryBreakdown, getMonthlyTrend, getRecentExpenses } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import ExpenseModal from '../components/ExpenseModal';
import { format } from 'date-fns';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const CATEGORY_COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#10b981','#14b8a6','#3b82f6','#f97316','#84cc16','#06b6d4','#a855f7'];

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [trend, setTrend] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, b, t, r] = await Promise.all([
        getDashboardSummary(), getCategoryBreakdown(),
        getMonthlyTrend(), getRecentExpenses()
      ]);
      setSummary(s.data.data);
      setBreakdown(b.data.data);
      setTrend(t.data.data);
      setRecent(r.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const currencySymbol = user?.currency === 'INR' ? '₹' : user?.currency === 'EUR' ? '€' : user?.currency === 'GBP' ? '£' : '$';
  const fmt = (n) => `${currencySymbol}${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const barData = {
    labels: trend.map(t => `${t.month} ${t.year}`),
    datasets: [
      { label: 'Income', data: trend.map(t => t.income), backgroundColor: 'rgba(16,185,129,0.8)', borderRadius: 6 },
      { label: 'Expense', data: trend.map(t => t.expense), backgroundColor: 'rgba(99,102,241,0.8)', borderRadius: 6 }
    ]
  };

  const doughnutData = {
    labels: breakdown.map(b => b.category),
    datasets: [{
      data: breakdown.map(b => b.total),
      backgroundColor: CATEGORY_COLORS,
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  if (loading) return (
    <div className="page-loading">
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  return (
    <div className="dashboard animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]} 👋</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <MdAdd /> Add Transaction
        </button>
      </div>

      <div className="stats-grid">
        <StatCard title="Total Income" value={fmt(summary?.income)} icon={<MdTrendingUp />} change={summary?.incomeChange} changeLabel="vs last month" color="green" />
        <StatCard title="Total Expenses" value={fmt(summary?.expenses)} icon={<MdTrendingDown />} change={summary?.expensesChange} changeLabel="vs last month" color="red" />
        <StatCard title="Balance" value={fmt(summary?.balance)} icon={<MdAccountBalance />} color="primary" subtitle="Income - Expenses" />
        <StatCard title="Transactions" value={summary?.transactionCount || 0} icon={<MdReceipt />} color="orange" subtitle="This month" />
      </div>

      <div className="charts-grid">
        <div className="card chart-card">
          <h3 className="card-title">Monthly Overview</h3>
          <div className="chart-container">
            {trend.length > 0 ? <Bar data={barData} options={chartOptions} /> : <div className="no-data">No data yet</div>}
          </div>
        </div>

        <div className="card chart-card chart-card--small">
          <h3 className="card-title">Spending by Category</h3>
          <div className="chart-container chart-container--donut">
            {breakdown.length > 0 ? (
              <>
                <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 12 } } } }} />
              </>
            ) : <div className="no-data">No expenses this month</div>}
          </div>
        </div>
      </div>

      <div className="card recent-card">
        <div className="card-header-row">
          <h3 className="card-title">Recent Transactions</h3>
          <Link to="/expenses" className="btn btn-ghost" style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}>
            View All <MdArrowForward />
          </Link>
        </div>
        <div className="recent-list">
          {recent.length === 0 ? (
            <div className="no-data">No transactions yet. Add your first one!</div>
          ) : recent.map(e => (
            <div key={e._id} className="recent-item">
              <div className="recent-item__left">
                <div className="recent-item__icon">{e.type === 'income' ? '💰' : '💸'}</div>
                <div>
                  <div className="recent-item__title">{e.title}</div>
                  <div className="recent-item__meta">{e.category} • {format(new Date(e.date), 'MMM d, yyyy')}</div>
                </div>
              </div>
              <span className={e.type === 'income' ? 'amount-income' : 'amount-expense'}>
                {e.type === 'income' ? '+' : '-'}{fmt(e.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {showModal && <ExpenseModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchData(); }} />}
    </div>
  );
};

export default Dashboard;
