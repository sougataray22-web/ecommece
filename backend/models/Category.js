const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, unique: true, lowercase: true },
    description: { type: String },
    image:       { type: String },
    publicId:    { type: String },
    parent:      { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    position:    { type: Number, default: 0 },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

CategorySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

CategorySchema.index({ parent: 1, isActive: 1 });
CategorySchema.index({ slug: 1 });

module.exports = mongoose.model('Category', CategorySchema);
