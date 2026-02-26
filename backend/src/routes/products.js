const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const auditLog = require('../middleware/auditLogger');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);

router.get('/export', ctrl.exportCSV);
router.post('/import', authorize('Admin', 'Sales'), upload.single('file'), ctrl.importCSV);

router.get('/', ctrl.getAll);
router.post('/', authorize('Admin', 'Sales'), auditLog('Product', 'CREATE'), ctrl.create);

router.get('/:id', ctrl.getOne);
router.put('/:id', authorize('Admin', 'Sales'), auditLog('Product', 'UPDATE'), ctrl.update);
router.delete('/:id', authorize('Admin'), auditLog('Product', 'ARCHIVE'), ctrl.archive);
router.get('/:id/batches', ctrl.getBatches);

module.exports = router;
