const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/authController');
const { protect }= require('../middleware/auth');
const rateLimit  = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { ok: false, message: 'Too many OTP requests. Please wait 15 minutes.' },
});

router.post('/send-otp',  otpLimiter, ctrl.sendOtp);
router.post('/verify-otp',            ctrl.verifyOtp);
router.get ('/me',        protect,    ctrl.getMe);
router.patch('/profile',  protect,    ctrl.updateProfile);
router.post('/address',   protect,    ctrl.addAddress);

module.exports = router;
