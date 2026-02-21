const { Driver } = require('../models');

exports.getAllDrivers = async (req, res) => {
    try {
        const drivers = await Driver.findAll();
        res.json(drivers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addDriver = async (req, res) => {
    try {
        const driver = await Driver.create(req.body);
        res.status(201).json(driver);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.updateDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await Driver.update(req.body, { where: { id } });
        if (!updated) return res.status(404).json({ error: 'Driver not found' });
        const updatedDriver = await Driver.findByPk(id);
        res.json(updatedDriver);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Driver.destroy({ where: { id } });
        if (!deleted) return res.status(404).json({ error: 'Driver not found' });
        res.json({ message: 'Driver deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.changeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const [updated] = await Driver.update({ status }, { where: { id } });
        if (!updated) return res.status(404).json({ error: 'Driver not found' });
        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
