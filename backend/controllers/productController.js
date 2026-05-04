const Product  = require('../models/Product');
const { deleteFromCloudinary } = require('../config/cloudinary');
const { success, error } = require('../utils/response');

// GET /api/products  (public)
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, vendor, search, minPrice, maxPrice, sort = '-createdAt', featured } = req.query;
    const filter = { isActive: true };
    if (category)         filter.category   = category;
    if (vendor)           filter.vendor     = vendor;
    if (featured === 'true') filter.isFeatured = true;
    if (search)           filter.$text      = { $search: search };
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }

    const total    = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('vendor',   'name businessName avatar')
      .populate('category', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean({ virtuals: true });

    success(res, { products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    error(res, err.message, 500);
  }
};

// GET /api/products/:slug  (public)
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('vendor',   'name businessName avatar')
      .populate('category', 'name slug')
      .lean({ virtuals: true });
    if (!product) return error(res, 'Product not found.', 404);
    success(res, { product });
  } catch (err) {
    error(res, err.message, 500);
  }
};

// GET /api/products/vendor/:id  (vendor - get own product by ID for edit)
exports.getVendorProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('vendor',   'name businessName')
      .lean({ virtuals: true });

    if (!product) return error(res, 'Product not found.', 404);

    // Vendor can only view their own products
    if (req.user.role !== 'owner' && String(product.vendor._id || product.vendor) !== String(req.user._id))
      return error(res, 'Not authorized.', 403);

    success(res, { product });
  } catch (err) {
    error(res, err.message, 500);
  }
};

// GET /api/products/vendor/mine  (approved vendor)
exports.getVendorProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = { vendor: req.user._id };
    if (search) filter.$text = { $search: search };

    const total    = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean({ virtuals: true });

    success(res, { products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    error(res, err.message, 500);
  }
};

// POST /api/products/vendor  (approved vendor)
exports.createProduct = async (req, res) => {
  try {
    const imageUrls = (req.files || []).map((f) => f.path);
    if (!imageUrls.length) return error(res, 'At least one product image is required.', 400);

    const {
      name, description, brand, category, subCategory, tags,
      basePrice, baseMrp, baseStock, variationAxes, variations,
      weight, freeShipping, shippingCharges, metaTitle, metaDescription,
    } = req.body;

    if (!name)     return error(res, 'Product name is required.', 400);
    if (!category) return error(res, 'Category is required.', 400);

    const product = await Product.create({
      vendor: req.user._id,
      name, description, brand, category, subCategory,
      tags:          tags          ? JSON.parse(tags)          : [],
      variationAxes: variationAxes ? JSON.parse(variationAxes) : [],
      variations:    variations    ? JSON.parse(variations)    : [],
      images:        imageUrls,
      basePrice:     Number(basePrice)     || 0,
      baseMrp:       Number(baseMrp)       || 0,
      baseStock:     Number(baseStock)     || 0,
      weight:        weight ? Number(weight) : undefined,
      freeShipping:  freeShipping === 'true',
      shippingCharges: Number(shippingCharges) || 0,
      metaTitle, metaDescription,
    });

    success(res, { product }, 'Product created.', 201);
  } catch (err) {
    console.error('createProduct:', err);
    error(res, err.message, 500);
  }
};

// PATCH /api/products/vendor/:id  (vendor or owner)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return error(res, 'Product not found.', 404);
    if (req.user.role !== 'owner' && String(product.vendor) !== String(req.user._id))
      return error(res, 'Not authorized.', 403);

    const updates = { ...req.body };
    if (req.files?.length) {
      updates.images = [...(product.images || []), ...req.files.map((f) => f.path)];
    }
    if (updates.variations)    updates.variations    = JSON.parse(updates.variations);
    if (updates.variationAxes) updates.variationAxes = JSON.parse(updates.variationAxes);
    if (updates.tags)          updates.tags          = JSON.parse(updates.tags);

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true,
    });
    success(res, { product: updated }, 'Product updated.');
  } catch (err) {
    error(res, err.message, 500);
  }
};

// DELETE /api/products/vendor/:id  (vendor or owner)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return error(res, 'Product not found.', 404);
    if (req.user.role !== 'owner' && String(product.vendor) !== String(req.user._id))
      return error(res, 'Not authorized.', 403);

    await Promise.allSettled(product.images.map((url) => deleteFromCloudinary(url)));
    await product.deleteOne();
    success(res, {}, 'Product deleted.');
  } catch (err) {
    error(res, err.message, 500);
  }
};

// DELETE /api/products/vendor/:id/image
exports.deleteProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return error(res, 'Product not found.', 404);
    if (req.user.role !== 'owner' && String(product.vendor) !== String(req.user._id))
      return error(res, 'Not authorized.', 403);
    if (product.images.length <= 1)
      return error(res, 'Product must have at least one image.', 400);

    const { imageUrl } = req.body;
    await deleteFromCloudinary(imageUrl);
    product.images = product.images.filter((img) => img !== imageUrl);
    await product.save();
    success(res, { images: product.images }, 'Image deleted.');
  } catch (err) {
    error(res, err.message, 500);
  }
};
