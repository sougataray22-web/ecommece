const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Order   = require('../models/Order');
const Product = require('../models/Product');
const { protect, ownerOnly } = require('../middleware/auth');
const { success, error }     = require('../utils/response');

router.use(protect, ownerOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [customers, vendors, products, orders, revenueAgg] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'vendor' }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
    ]);
    success(res, { stats: { customers, vendors, products, orders, totalRevenue: revenueAgg[0]?.total || 0 } });
  } catch (err) {
    error(res, err.message, 500);
  }
});

// GET /api/admin/vendors
router.get('/vendors', async (req, res) => {
  try {
    const { page = 1, limit = 20, isApproved } = req.query;
    const filter = { role: 'vendor' };
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
    const total   = await User.countDocuments(filter);
    const vendors = await User.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit));
    success(res, { vendors, total });
  } catch (err) {
    error(res, err.message, 500);
  }
});

// PATCH /api/admin/vendors/:id/toggle
router.patch('/vendors/:id/toggle', async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);
    if (!vendor || vendor.role !== 'vendor') return error(res, 'Vendor not found.', 404);
    vendor.isActive = !vendor.isActive;
    await vendor.save();
    success(res, { vendor }, `Vendor ${vendor.isActive ? 'activated' : 'deactivated'}.`);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus } = req.query;
    const filter = {};
    if (status)        filter.status        = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    const total  = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    success(res, { orders, total });
  } catch (err) {
    error(res, err.message, 500);
  }
});

// GET /api/admin/products
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total    = await Product.countDocuments();
    const products = await Product.find()
      .populate('vendor',   'name businessName')
      .populate('category', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean({ virtuals: true });
    success(res, { products, total });
  } catch (err) {
    error(res, err.message, 500);
  }
});

module.exports = router;
