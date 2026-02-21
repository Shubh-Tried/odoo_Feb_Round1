const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', requireRole(['Manager', 'Financial Analyst']), expenseController.getAllExpenses);
router.post('/', requireRole(['Manager', 'Dispatcher']), expenseController.logExpense);

module.exports = router;
