const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/bannerController');
const { protect, ownerOnly } = require('../middleware/auth');
const { uploadBanner } = require('../config/cloudinary');

// ── /reorder must be before /:id ─────────────────────────────────────────────
router.get  ('/',          ctrl.getBanners);                                       // public
router.get  ('/admin',     protect, ownerOnly, ctrl.getAllBanners);
router.post ('/',          protect, ownerOnly, uploadBanner.single('image'), ctrl.createBanner);
router.patch('/reorder',   protect, ownerOnly, ctrl.reorderBanners);
router.patch('/:id',       protect, ownerOnly, uploadBanner.single('image'), ctrl.updateBanner);
router.delete('/:id',      protect, ownerOnly, ctrl.deleteBanner);

module.exports = router;
