const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/kycController');
const { protect, vendorOnly, ownerOnly } = require('../middleware/auth');
const { uploadKyc } = require('../config/cloudinary');

// Vendor
router.post('/submit',      protect, vendorOnly, uploadKyc, ctrl.submitKYC);
router.get ('/my-kyc',      protect, vendorOnly, ctrl.getMyKYC);

// Owner
router.get  ('/all',        protect, ownerOnly, ctrl.getAllKYC);
router.get  ('/:id',        protect, ownerOnly, ctrl.getKYCById);
router.patch('/:id/review', protect, ownerOnly, ctrl.reviewKYC);

module.exports = router;
