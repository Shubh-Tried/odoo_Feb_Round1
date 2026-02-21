const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Vehicle = sequelize.define('Vehicle', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    vehicle_id: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    model: {
        type: DataTypes.STRING,
        allowNull: false
    },
    license_plate: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    max_capacity: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    odometer: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('Available', 'On Trip', 'In Shop', 'Retired'),
        defaultValue: 'Available'
    }
});

module.exports = Vehicle;
