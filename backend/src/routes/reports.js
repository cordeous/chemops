const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/sales', ctrl.salesPerformance);
router.get('/revenue', ctrl.revenue);
router.get('/top-customers', ctrl.topCustomers);
router.get('/inventory-turnover', ctrl.inventoryTurnover);
router.get('/margins', ctrl.productMargins);
router.get('/expiration-risk', ctrl.expirationRisk);
router.get('/hazmat-sales', ctrl.hazmatSales);
router.get('/outstanding-receivables', ctrl.outstandingReceivables);

module.exports = router;
