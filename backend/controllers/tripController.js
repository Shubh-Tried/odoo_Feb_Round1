const { Trip, Vehicle, Driver } = require('../models');

exports.getAllTrips = async (req, res) => {
    try {
        const trips = await Trip.findAll({ include: [Vehicle, Driver] });
        res.json(trips);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createTrip = async (req, res) => {
    try {
        const { trip_id, vehicle_id, driver_id, cargo_weight, start_location, end_location } = req.body;

        const vehicle = await Vehicle.findByPk(vehicle_id);
        const driver = await Driver.findByPk(driver_id);

        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
        if (!driver) return res.status(404).json({ error: 'Driver not found' });

        // Business Rules
        if (cargo_weight > vehicle.max_capacity) {
            return res.status(400).json({ error: 'Cargo exceeds vehicle max capacity' });
        }

        if (new Date(driver.license_expiry) < new Date()) {
            return res.status(400).json({ error: 'Driver license is expired' });
        }

        if (vehicle.status !== 'Available') {
            return res.status(400).json({ error: 'Vehicle is not available' });
        }

        if (driver.status !== 'On Duty') {
            return res.status(400).json({ error: 'Driver is not on duty' });
        }

        const trip = await Trip.create({
            trip_id, vehicle_id, driver_id, cargo_weight, start_location, end_location, status: 'Dispatched'
        });

        // Update statuses
        await vehicle.update({ status: 'On Trip' });

        res.status(201).json(trip);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.completeTrip = async (req, res) => {
    try {
        const { id } = req.params;
        const trip = await Trip.findByPk(id);
        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        await trip.update({ status: 'Completed' });

        // Free the vehicle (assuming driver stays On Duty)
        const vehicle = await Vehicle.findByPk(trip.vehicle_id);
        if (vehicle) await vehicle.update({ status: 'Available' });

        res.json({ message: 'Trip completed successfully', trip });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
