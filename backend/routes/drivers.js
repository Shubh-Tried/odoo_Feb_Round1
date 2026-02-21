const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', requireRole(['Manager', 'Dispatcher', 'Safety Officer']), driverController.getAllDrivers);
router.post('/', requireRole(['Manager']), driverController.addDriver);
router.put('/:id', requireRole(['Manager']), driverController.updateDriver);
router.delete('/:id', requireRole(['Manager']), driverController.deleteDriver);
router.patch('/:id/status', requireRole(['Manager', 'Dispatcher', 'Safety Officer']), driverController.changeStatus);

module.exports = router;
