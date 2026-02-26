const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const auditLog = require('../middleware/auditLogger');

router.use(authenticate);

router.get('/export', ctrl.exportCSV);
router.get('/', ctrl.getAll);
router.post('/', authorize('Admin', 'Sales'), auditLog('Order', 'CREATE'), ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', authorize('Admin', 'Sales'), auditLog('Order', 'UPDATE'), ctrl.update);
router.put('/:id/status', authorize('Admin', 'Sales', 'Finance'), auditLog('Order', 'STATUS_CHANGE'), ctrl.updateStatus);

module.exports = router;
