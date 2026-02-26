const router = require('express').Router();
const ctrl = require('../controllers/batchController');
const { authenticate, authorize } = require('../middleware/auth');
const auditLog = require('../middleware/auditLogger');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.post('/', authorize('Admin', 'Sales'), auditLog('Batch', 'CREATE'), ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', authorize('Admin', 'Sales'), auditLog('Batch', 'UPDATE'), ctrl.update);
router.delete('/:id', authorize('Admin'), auditLog('Batch', 'DELETE'), ctrl.remove);

module.exports = router;
