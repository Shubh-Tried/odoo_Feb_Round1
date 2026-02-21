const { Vehicle } = require('../models');

exports.getAllVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.findAll();
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.create(req.body);
        res.status(201).json(vehicle);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.updateVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await Vehicle.update(req.body, { where: { id } });
        if (!updated) return res.status(404).json({ error: 'Vehicle not found' });
        const updatedVehicle = await Vehicle.findByPk(id);
        res.json(updatedVehicle);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Vehicle.destroy({ where: { id } });
        if (!deleted) return res.status(404).json({ error: 'Vehicle not found' });
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.changeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const [updated] = await Vehicle.update({ status }, { where: { id } });
        if (!updated) return res.status(404).json({ error: 'Vehicle not found' });
        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
