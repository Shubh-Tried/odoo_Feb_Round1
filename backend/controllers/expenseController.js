const { Expense, Vehicle } = require('../models');

exports.getAllExpenses = async (req, res) => {
    try {
        const expenses = await Expense.findAll({ include: [Vehicle] });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.logExpense = async (req, res) => {
    try {
        const expense = await Expense.create(req.body);
        res.status(201).json(expense);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
