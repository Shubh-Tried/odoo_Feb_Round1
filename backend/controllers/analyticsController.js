const { Vehicle, Trip, Expense } = require('../models');

exports.getDashboardAnalytics = async (req, res) => {
    try {
        const vehicles = await Vehicle.findAll();
        const trips = await Trip.findAll();
        const expenses = await Expense.findAll();

        // 1. Vehicle Utilization Rate
        const totalVehicles = vehicles.length;
        const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
        const utilizationRate = totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0;

        // 2. Operational Cost per Vehicle & Total Cost
        let totalCost = 0;
        const costPerVehicleMap = {};
        expenses.forEach(exp => {
            totalCost += exp.cost;
            costPerVehicleMap[exp.vehicle_id] = (costPerVehicleMap[exp.vehicle_id] || 0) + exp.cost;
        });

        // 3. Fuel efficiency (simplified mock calculation based on odometer & liters)
        let totalLiters = 0;
        expenses.forEach(e => totalLiters += e.liters);
        let totalOdometer = 0;
        vehicles.forEach(v => totalOdometer += v.odometer);
        const avgFuelEfficiency = totalLiters > 0 ? totalOdometer / totalLiters : 0;

        // 4. ROI (Mock Data - Assume average revenue per trip is $1500)
        const revenue = trips.length * 1500;
        const roi = totalCost > 0 ? ((revenue - totalCost) / totalCost) * 100 : 0;

        res.json({
            utilizationRate: utilizationRate.toFixed(2) + '%',
            totalActiveFleet: `${activeVehicles} / ${totalVehicles}`,
            totalOperationalCost: `$${totalCost.toFixed(2)}`,
            avgFuelEfficiency: `${avgFuelEfficiency.toFixed(2)} mpg`, // Or km/L depending on locale
            estimatedROI: `${roi.toFixed(2)}%`,
            costPerVehicleData: costPerVehicleMap
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
