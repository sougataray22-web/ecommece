const express   = require('express');
const router    = express.Router();
const Category  = require('../models/Category');
const { protect, ownerOnly } = require('../middleware/auth');
const { uploadCategory } = require('../config/cloudinary');
const { success, error }  = require('../utils/response');

// GET /api/categories  (public)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('position');
    success(res, { categories });
  } catch (err) {
    error(res, err.message, 500);
  }
});

// POST /api/categories  (owner)
router.post('/', protect, ownerOnly, uploadCategory.single('image'), async (req, res) => {
  try {
    const { name, description, parent, position } = req.body;
    if (!name) return error(res, 'Name is required.', 400);
    const category = await Category.create({
      name, description,
      parent:   parent   || null,
      position: Number(position) || 0,
      image:    req.file?.path,
      publicId: req.file?.filename,
    });
    success(res, { category }, 'Category created.', 201);
  } catch (err) {
    error(res, err.message, 500);
  }
});

// PATCH /api/categories/:id  (owner)
router.patch('/:id', protect, ownerOnly, uploadCategory.single('image'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) { updates.image = req.file.path; updates.publicId = req.file.filename; }
    const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    success(res, { category }, 'Category updated.');
  } catch (err) {
    error(res, err.message, 500);
  }
});

// DELETE /api/categories/:id  (owner)
router.delete('/:id', protect, ownerOnly, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    success(res, {}, 'Category deleted.');
  } catch (err) {
    error(res, err.message, 500);
  }
});

module.exports = router;
