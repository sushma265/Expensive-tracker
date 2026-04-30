const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

router.use(protect);

// @GET /api/budget
router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const m = parseInt(month) || currentDate.getMonth() + 1;
    const y = parseInt(year) || currentDate.getFullYear();

    const budgets = await Budget.find({ user: req.user._id, month: m, year: y });

    // Get actual spending per category
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0);

    const spending = await Expense.aggregate([
      { $match: { user: req.user._id, type: 'expense', date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    const spendingMap = spending.reduce((acc, s) => {
      acc[s._id] = s.total;
      return acc;
    }, {});

    const budgetsWithSpending = budgets.map(b => ({
      ...b.toObject(),
      spent: spendingMap[b.category] || 0,
      remaining: b.amount - (spendingMap[b.category] || 0),
      percentage: Math.round(((spendingMap[b.category] || 0) / b.amount) * 100)
    }));

    res.json({ success: true, data: budgetsWithSpending });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/budget
router.post('/', async (req, res) => {
  try {
    const { category, amount, period, month, year, alertThreshold } = req.body;
    const currentDate = new Date();

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category, month: month || currentDate.getMonth() + 1, year: year || currentDate.getFullYear() },
      { amount, period, alertThreshold },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, data: budget });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/budget/:id
router.delete('/:id', async (req, res) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Budget deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
