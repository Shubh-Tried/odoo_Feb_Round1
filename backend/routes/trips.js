const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', requireRole(['Manager', 'Dispatcher']), tripController.getAllTrips);
router.post('/', requireRole(['Manager', 'Dispatcher']), tripController.createTrip);
router.patch('/:id/complete', requireRole(['Manager', 'Dispatcher']), tripController.completeTrip);

module.exports = router;
