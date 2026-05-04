const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/productController');
const { protect, approvedVendorOnly, ownerOnly } = require('../middleware/auth');
const { uploadProduct } = require('../config/cloudinary');

// ── IMPORTANT: specific vendor/admin paths MUST come before /:slug ──────────
// Vendor routes
router.get ('/vendor/mine',        protect, approvedVendorOnly, ctrl.getVendorProducts);
router.get ('/vendor/:id',         protect, approvedVendorOnly, ctrl.getVendorProductById);
router.post('/vendor',             protect, approvedVendorOnly, uploadProduct.array('images', 8), ctrl.createProduct);
router.patch('/vendor/:id',        protect, approvedVendorOnly, uploadProduct.array('images', 8), ctrl.updateProduct);
router.delete('/vendor/:id/image', protect, approvedVendorOnly, ctrl.deleteProductImage);
router.delete('/vendor/:id',       protect, approvedVendorOnly, ctrl.deleteProduct);

// Admin routes
router.delete('/admin/:id',        protect, ownerOnly, ctrl.deleteProduct);

// Public routes — /:slug must be LAST to avoid swallowing /vendor/* paths
router.get('/',      ctrl.getProducts);
router.get('/:slug', ctrl.getProduct);

module.exports = router;
