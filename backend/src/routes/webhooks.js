const router = require('express').Router();
const ctrl = require('../controllers/webhookController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('Admin'));

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/test', ctrl.test);

module.exports = router;
