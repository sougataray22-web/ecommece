const Banner = require('../models/Banner');
const { deleteFromCloudinary } = require('../config/cloudinary');
const { success, error } = require('../utils/response');

// GET /api/banners  (public — active only)
exports.getBanners = async (req, res) => {
  try {
    const now = new Date();
    const banners = await Banner.find({
      isActive: true,
      $or: [{ startDate: { $exists: false } }, { startDate: { $lte: now } }],
    }).sort('position');
    success(res, { banners });
  } catch (err) {
    error(res, err.message, 500);
  }
};

// GET /api/banners/admin  (owner)
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort('position').populate('createdBy', 'name email');
    success(res, { banners });
  } catch (err) {
    error(res, err.message, 500);
  }
};

// POST /api/banners  (owner)
exports.createBanner = async (req, res) => {
  try {
    if (!req.file) return error(res, 'Banner image is required.', 400);
    const { title, subtitle, targetType, targetId, targetUrl, position, isActive, startDate, endDate } = req.body;
    if (!title) return error(res, 'Title is required.', 400);

    const banner = await Banner.create({
      title, subtitle,
      imageUrl:   req.file.path,
      publicId:   req.file.filename,
      targetType: targetType || 'none',
      targetId, targetUrl,
      position:  Number(position) || 0,
      isActive:  isActive === true || isActive === 'true' || isActive === undefined ? true : isActive !== 'false',
      startDate: startDate ? new Date(startDate) : undefined,
      endDate:   endDate   ? new Date(endDate)   : undefined,
      createdBy: req.user._id,
    });

    success(res, { banner }, 'Banner created.', 201);
  } catch (err) {
    error(res, err.message, 500);
  }
};

// PATCH /api/banners/:id  (owner)
exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return error(res, 'Banner not found.', 404);

    const updates = { ...req.body };
    if (req.file) {
      if (banner.publicId) await deleteFromCloudinary(banner.publicId);
      updates.imageUrl = req.file.path;
      updates.publicId = req.file.filename;
    }
    if (updates.position) updates.position = Number(updates.position);
    if (updates.isActive !== undefined) updates.isActive = updates.isActive === true || updates.isActive === 'true';

    const updated = await Banner.findByIdAndUpdate(req.params.id, updates, { new: true });
    success(res, { banner: updated }, 'Banner updated.');
  } catch (err) {
    error(res, err.message, 500);
  }
};

// DELETE /api/banners/:id  (owner)
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return error(res, 'Banner not found.', 404);
    if (banner.publicId) await deleteFromCloudinary(banner.publicId);
    await banner.deleteOne();
    success(res, {}, 'Banner deleted.');
  } catch (err) {
    error(res, err.message, 500);
  }
};

// PATCH /api/banners/reorder  (owner)
exports.reorderBanners = async (req, res) => {
  try {
    const { order } = req.body; // [{ id, position }]
    await Promise.all(order.map(({ id, position }) =>
      Banner.findByIdAndUpdate(id, { position })
    ));
    success(res, {}, 'Banners reordered.');
  } catch (err) {
    error(res, err.message, 500);
  }
};
