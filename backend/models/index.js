const sequelize = require('../config/db');
const User = require('./User');
const Vehicle = require('./Vehicle');
const Driver = require('./Driver');
const Trip = require('./Trip');
const Maintenance = require('./Maintenance');
const Expense = require('./Expense');

// Relationships
Vehicle.hasMany(Trip, { foreignKey: 'vehicle_id', sourceKey: 'id', onDelete: 'CASCADE' });
Trip.belongsTo(Vehicle, { foreignKey: 'vehicle_id', targetKey: 'id' });

Driver.hasMany(Trip, { foreignKey: 'driver_id', sourceKey: 'id', onDelete: 'CASCADE' });
Trip.belongsTo(Driver, { foreignKey: 'driver_id', targetKey: 'id' });

Vehicle.hasMany(Maintenance, { foreignKey: 'vehicle_id', sourceKey: 'id', onDelete: 'CASCADE' });
Maintenance.belongsTo(Vehicle, { foreignKey: 'vehicle_id', targetKey: 'id' });

Vehicle.hasMany(Expense, { foreignKey: 'vehicle_id', sourceKey: 'id', onDelete: 'CASCADE' });
Expense.belongsTo(Vehicle, { foreignKey: 'vehicle_id', targetKey: 'id' });

module.exports = {
    sequelize,
    User,
    Vehicle,
    Driver,
    Trip,
    Maintenance,
    Expense
};
