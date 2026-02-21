const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.use(verifyToken);
router.get('/dashboard', requireRole(['Manager', 'Financial Analyst', 'Dispatcher']), analyticsController.getDashboardAnalytics);

module.exports = router;
