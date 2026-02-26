const router = require('express').Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const productCtrl = require('../controllers/productController');
const customerCtrl = require('../controllers/customerController');
const orderCtrl = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Import routes
router.post('/import/products', authorize('Admin', 'Sales'), upload.single('file'), productCtrl.importCSV);
router.post('/import/customers', authorize('Admin', 'Sales'), upload.single('file'), customerCtrl.importCSV);

// Export routes
router.get('/export/products', productCtrl.exportCSV);
router.get('/export/customers', customerCtrl.exportCSV);
router.get('/export/orders', orderCtrl.exportCSV);

module.exports = router;
