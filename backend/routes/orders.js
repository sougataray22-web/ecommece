const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/orderController');
const { protect, approvedVendorOnly } = require('../middleware/auth');

// ── IMPORTANT: /vendor/analytics MUST come before /:id ───────────────────────
router.get('/vendor/analytics', protect, approvedVendorOnly, ctrl.getVendorAnalytics);

router.post('/',                              protect, ctrl.createOrder);
router.get ('/',                              protect, ctrl.getOrders);
router.get ('/:id',                           protect, ctrl.getOrder);
router.patch('/:orderId/sub/:subOrderId',     protect, approvedVendorOnly, ctrl.updateSubOrderStatus);

module.exports = router;
