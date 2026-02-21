const { sequelize, User, Vehicle, Driver } = require('../models');
const bcrypt = require('bcryptjs');

async function seed() {
    await sequelize.sync({ force: true });
    console.log('Database synced for seeding!');

    // Seed Users
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.bulkCreate([
        { email: 'manager@fleetflow.com', password: hashedPassword, role: 'Manager' },
        { email: 'dispatcher@fleetflow.com', password: hashedPassword, role: 'Dispatcher' },
        { email: 'safety@fleetflow.com', password: hashedPassword, role: 'Safety Officer' },
        { email: 'finance@fleetflow.com', password: hashedPassword, role: 'Financial Analyst' }
    ]);

    // Seed Vehicles
    await Vehicle.bulkCreate([
        { vehicle_id: 'TRK-8492', model: 'Volvo VNL 860', license_plate: 'ABC-1234', max_capacity: 40000, odometer: 142500, status: 'Available' },
        { vehicle_id: 'VAN-1044', model: 'Ford Transit', license_plate: 'XYZ-9876', max_capacity: 5000, odometer: 28400, status: 'In Shop' },
        { vehicle_id: 'TRK-7731', model: 'Freightliner Cascadia', license_plate: 'LMN-4567', max_capacity: 45000, odometer: 210000, status: 'Available' }
    ]);

    // Seed Drivers
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    await Driver.bulkCreate([
        { driver_id: 'DRV-101', name: 'Michael Scott', license_type: 'CDL-A', license_expiry: nextYear, status: 'On Duty', safety_score: 98 },
        { driver_id: 'DRV-102', name: 'Jim Halpert', license_type: 'CDL-B', license_expiry: nextYear, status: 'On Duty', safety_score: 92 },
        { driver_id: 'DRV-103', name: 'Dwight Schrute', license_type: 'CDL-A', license_expiry: nextYear, status: 'Suspended', safety_score: 65 }
    ]);

    console.log('Dummy Data seeded successfully!');
    process.exit();
}

seed().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
