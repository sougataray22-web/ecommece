const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-session',  protect, ctrl.createPaymentSession);
router.get ('/verify/:orderId', protect, ctrl.verifyPayment);
router.post('/webhook',                  ctrl.webhook); // No auth — HMAC verified inside

module.exports = router;
