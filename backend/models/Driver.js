const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Driver = sequelize.define('Driver', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    driver_id: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    license_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    license_expiry: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('On Duty', 'Off Duty', 'Suspended'),
        defaultValue: 'On Duty'
    },
    safety_score: {
        type: DataTypes.FLOAT,
        defaultValue: 100
    }
});

module.exports = Driver;
