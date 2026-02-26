const router = require('express').Router();
const ctrl = require('../controllers/customerController');
const { authenticate, authorize } = require('../middleware/auth');
const auditLog = require('../middleware/auditLogger');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.get('/export', ctrl.exportCSV);
router.post('/import', authorize('Admin', 'Sales'), upload.single('file'), ctrl.importCSV);

router.get('/', ctrl.getAll);
router.post('/', authorize('Admin', 'Sales'), auditLog('Customer', 'CREATE'), ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', authorize('Admin', 'Sales', 'Compliance'), auditLog('Customer', 'UPDATE'), ctrl.update);
router.delete('/:id', authorize('Admin'), auditLog('Customer', 'DELETE'), ctrl.remove);

module.exports = router;
