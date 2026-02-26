const router = require('express').Router();
const ctrl = require('../controllers/complianceController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/sds-tracker', ctrl.sdsTracker);
router.get('/regulatory-export', authorize('Admin', 'Compliance'), ctrl.regulatoryExport);
router.put('/customers/:id/status', authorize('Admin', 'Compliance'), ctrl.updateCustomerComplianceStatus);

module.exports = router;
