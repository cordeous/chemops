const router = require('express').Router();
const ctrl = require('../controllers/invoiceController');
const { authenticate, authorize } = require('../middleware/auth');
const auditLog = require('../middleware/auditLogger');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.post('/', authorize('Admin', 'Finance'), auditLog('Invoice', 'CREATE'), ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id/status', authorize('Admin', 'Finance'), auditLog('Invoice', 'STATUS_CHANGE'), ctrl.updateStatus);
router.get('/:id/pdf', ctrl.downloadPDF);

module.exports = router;
