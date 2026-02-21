const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', requireRole(['Manager', 'Dispatcher']), maintenanceController.getAllLogs);
router.post('/', requireRole(['Manager', 'Dispatcher']), maintenanceController.logService);

module.exports = router;
