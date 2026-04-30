import React, { useState, useEffect } from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { getCategoryBreakdown, getMonthlyTrend } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Analytics.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement, Filler);

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#10b981','#14b8a6','#3b82f6','#f97316','#84cc16','#06b6d4','#a855f7'];

const Analytics = () => {
  const { user } = useAuth();
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [incomeBreakdown, setIncomeBreakdown] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const currencySymbol = user?.currency === 'INR' ? '₹' : user?.currency === 'EUR' ? '€' : user?.currency === 'GBP' ? '£' : '$';
  const fmt = (n) => `${currencySymbol}${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [eb, ib, t] = await Promise.all([
          getCategoryBreakdown({ month: selectedMonth, year: selectedYear, type: 'expense' }),
          getCategoryBreakdown({ month: selectedMonth, year: selectedYear, type: 'income' }),
          getMonthlyTrend({ months: 12 })
        ]);
        setExpenseBreakdown(eb.data.data);
        setIncomeBreakdown(ib.data.data);
        setTrend(t.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [selectedMonth, selectedYear]);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const years = [2022, 2023, 2024, 2025, 2026];

  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12, padding: 8 } } }
  };

  const lineData = {
    labels: trend.map(t => `${t.month} '${String(t.year).slice(2)}`),
    datasets: [
      {
        label: 'Income',
        data: trend.map(t => t.income),
        borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)',
        tension: 0.4, fill: true, pointRadius: 4
      },
      {
        label: 'Expenses',
        data: trend.map(t => t.expense),
        borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)',
        tension: 0.4, fill: true, pointRadius: 4
      }
    ]
  };

  const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  return (
    <div className="analytics-page animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Insights into your spending patterns</p>
        </div>
        <div className="month-selector">
          <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>12-Month Trend</h3>
        <div style={{ height: 260 }}>
          {trend.length > 0 ? <Line data={lineData} options={lineOptions} /> : <div className="no-data">No data available</div>}
        </div>
      </div>

      <div className="analytics-grid">
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>Expense Breakdown</h3>
          <div style={{ height: 220 }}>
            {expenseBreakdown.length > 0 ? (
              <Doughnut data={{ labels: expenseBreakdown.map(b => b.category), datasets: [{ data: expenseBreakdown.map(b => b.total), backgroundColor: COLORS, borderWidth: 0 }] }} options={doughnutOptions} />
            ) : <div className="no-data">No expenses this month</div>}
          </div>
          <div className="breakdown-list">
            {expenseBreakdown.map((b, i) => (
              <div key={b.category} className="breakdown-item">
                <div className="breakdown-dot" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="breakdown-name">{b.category}</span>
                <span className="breakdown-pct">{b.percentage}%</span>
                <span className="breakdown-amt">{fmt(b.total)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>Income Breakdown</h3>
          <div style={{ height: 220 }}>
            {incomeBreakdown.length > 0 ? (
              <Doughnut data={{ labels: incomeBreakdown.map(b => b.category), datasets: [{ data: incomeBreakdown.map(b => b.total), backgroundColor: COLORS, borderWidth: 0 }] }} options={doughnutOptions} />
            ) : <div className="no-data">No income this month</div>}
          </div>
          <div className="breakdown-list">
            {incomeBreakdown.map((b, i) => (
              <div key={b.category} className="breakdown-item">
                <div className="breakdown-dot" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="breakdown-name">{b.category}</span>
                <span className="breakdown-pct">{b.percentage}%</span>
                <span className="breakdown-amt">{fmt(b.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
