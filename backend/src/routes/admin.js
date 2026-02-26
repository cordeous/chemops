const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('Admin'));

router.get('/users', ctrl.getUsers);
router.post('/users', ctrl.createUser);
router.put('/users/:id', ctrl.updateUser);

router.get('/features', ctrl.getFeatures);
router.put('/features', ctrl.updateFeatures);

router.get('/alerts', ctrl.getAlerts);

module.exports = router;
