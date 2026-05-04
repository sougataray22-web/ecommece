const mongoose = require('mongoose');

const VariationSchema = new mongoose.Schema({
  sku:        { type: String, required: true },
  attributes: { type: Map, of: String },
  price:      { type: Number, required: true, min: 0 },
  mrp:        { type: Number, min: 0 },
  stock:      { type: Number, default: 0, min: 0 },
  images:     [String],
});

const ProductSchema = new mongoose.Schema(
  {
    vendor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },

    name:        { type: String, required: true, trim: true },
    slug:        { type: String, unique: true, lowercase: true },
    description: { type: String, required: true },
    brand:       { type: String, trim: true },
    subCategory: { type: String },
    tags:        [String],

    basePrice: { type: Number, min: 0, default: 0 },
    baseMrp:   { type: Number, min: 0, default: 0 },
    baseStock: { type: Number, min: 0, default: 0 },

    variationAxes: [String],
    variations:    [VariationSchema],

    images: { type: [String], required: true },

    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount:   { type: Number, default: 0 },

    weight:          { type: Number },
    freeShipping:    { type: Boolean, default: false },
    shippingCharges: { type: Number, default: 0 },

    isActive:   { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },

    metaTitle:       String,
    metaDescription: String,
  },
  { timestamps: true }
);

ProductSchema.index({ vendor: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ slug: 1 });
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ isActive: 1, isFeatured: 1 });

ProductSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug =
      this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
      '-' + Date.now();
  }
  next();
});

ProductSchema.virtual('effectivePrice').get(function () {
  if (this.variations && this.variations.length > 0) {
    return Math.min(...this.variations.map((v) => v.price));
  }
  return this.basePrice;
});

ProductSchema.virtual('totalStock').get(function () {
  if (this.variations && this.variations.length > 0) {
    return this.variations.reduce((s, v) => s + v.stock, 0);
  }
  return this.baseStock;
});

ProductSchema.set('toJSON',   { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', ProductSchema);
