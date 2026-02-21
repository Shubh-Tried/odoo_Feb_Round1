const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', requireRole(['Manager', 'Dispatcher']), vehicleController.getAllVehicles);
router.post('/', requireRole(['Manager']), vehicleController.addVehicle);
router.put('/:id', requireRole(['Manager']), vehicleController.updateVehicle);
router.delete('/:id', requireRole(['Manager']), vehicleController.deleteVehicle);
router.patch('/:id/status', requireRole(['Manager', 'Dispatcher']), vehicleController.changeStatus);

module.exports = router;
