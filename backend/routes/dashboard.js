const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

router.use(protect);

// @GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const m = parseInt(month) || currentDate.getMonth() + 1;
    const y = parseInt(year) || currentDate.getFullYear();
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0);

    const [summary, prevMonth] = await Promise.all([
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: new Date(y, m - 2, 1), $lte: new Date(y, m - 1, 0) } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } }
      ])
    ]);

    const income = summary.find(s => s._id === 'income')?.total || 0;
    const expenses = summary.find(s => s._id === 'expense')?.total || 0;
    const prevIncome = prevMonth.find(s => s._id === 'income')?.total || 0;
    const prevExpenses = prevMonth.find(s => s._id === 'expense')?.total || 0;

    res.json({
      success: true,
      data: {
        income, expenses,
        balance: income - expenses,
        incomeChange: prevIncome ? ((income - prevIncome) / prevIncome * 100).toFixed(1) : 0,
        expensesChange: prevExpenses ? ((expenses - prevExpenses) / prevExpenses * 100).toFixed(1) : 0,
        transactionCount: summary.reduce((a, s) => a + s.count, 0)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/dashboard/category-breakdown
router.get('/category-breakdown', async (req, res) => {
  try {
    const { month, year, type = 'expense' } = req.query;
    const currentDate = new Date();
    const m = parseInt(month) || currentDate.getMonth() + 1;
    const y = parseInt(year) || currentDate.getFullYear();
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0);

    const breakdown = await Expense.aggregate([
      { $match: { user: req.user._id, type, date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    const total = breakdown.reduce((sum, b) => sum + b.total, 0);
    const data = breakdown.map(b => ({
      category: b._id,
      total: b.total,
      count: b.count,
      percentage: total ? ((b.total / total) * 100).toFixed(1) : 0
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/dashboard/monthly-trend
router.get('/monthly-trend', async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months) + 1);
    startDate.setDate(1);

    const trend = await Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthMap = {};

    trend.forEach(t => {
      const key = `${t._id.year}-${t._id.month}`;
      if (!monthMap[key]) monthMap[key] = { month: monthNames[t._id.month - 1], year: t._id.year, income: 0, expense: 0 };
      monthMap[key][t._id.type] = t.total;
    });

    res.json({ success: true, data: Object.values(monthMap) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/dashboard/recent
router.get('/recent', async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(5);
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
