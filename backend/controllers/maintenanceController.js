const { Maintenance, Vehicle } = require('../models');

exports.getAllLogs = async (req, res) => {
    try {
        const logs = await Maintenance.findAll({ include: [Vehicle] });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.logService = async (req, res) => {
    try {
        const { vehicle_id, service_type, date, notes } = req.body;

        const vehicle = await Vehicle.findByPk(vehicle_id);
        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

        const log = await Maintenance.create({ vehicle_id, service_type, date, notes });

        // Auto-set vehicle status to In Shop
        await vehicle.update({ status: 'In Shop' });

        res.status(201).json(log);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
