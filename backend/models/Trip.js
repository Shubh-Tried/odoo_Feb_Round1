const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Trip = sequelize.define('Trip', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    trip_id: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    cargo_weight: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Draft', 'Dispatched', 'Completed', 'Cancelled'),
        defaultValue: 'Draft'
    },
    start_location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    end_location: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = Trip;
