const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.use(protect);

const DEFAULT_CATEGORIES = {
  expense: [
    { name: 'Food & Dining', icon: '🍔', color: '#FF6B6B' },
    { name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
    { name: 'Shopping', icon: '🛍️', color: '#45B7D1' },
    { name: 'Entertainment', icon: '🎬', color: '#96CEB4' },
    { name: 'Health & Medical', icon: '🏥', color: '#FFEAA7' },
    { name: 'Housing', icon: '🏠', color: '#DDA0DD' },
    { name: 'Utilities', icon: '💡', color: '#98D8C8' },
    { name: 'Education', icon: '📚', color: '#F7DC6F' },
    { name: 'Travel', icon: '✈️', color: '#AED6F1' },
    { name: 'Personal Care', icon: '💅', color: '#F1948A' },
    { name: 'Subscriptions', icon: '📱', color: '#82E0AA' },
    { name: 'Other', icon: '📦', color: '#BDC3C7' }
  ],
  income: [
    { name: 'Salary', icon: '💼', color: '#2ECC71' },
    { name: 'Freelance', icon: '💻', color: '#3498DB' },
    { name: 'Investment', icon: '📈', color: '#9B59B6' },
    { name: 'Business', icon: '🏢', color: '#E67E22' },
    { name: 'Gift', icon: '🎁', color: '#E91E63' },
    { name: 'Other Income', icon: '💰', color: '#1ABC9C' }
  ]
};

// @GET /api/categories
router.get('/', (req, res) => {
  res.json({ success: true, data: DEFAULT_CATEGORIES });
});

module.exports = router;
