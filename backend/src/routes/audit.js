const router = require('express').Router();
const ctrl = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('Admin', 'Finance', 'Compliance'));

router.get('/', ctrl.getAll);
router.get('/:entityType/:entityId', ctrl.getByEntity);

module.exports = router;
