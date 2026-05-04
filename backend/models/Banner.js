const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema(
  {
    title:    { type: String, required: true, trim: true },
    subtitle: { type: String },
    imageUrl: { type: String, required: true },
    publicId: { type: String },
    targetType: {
      type: String,
      enum: ['product', 'category', 'url', 'none'],
      default: 'none',
    },
    targetId:  String,
    targetUrl: String,
    position:  { type: Number, default: 0 },
    isActive:  { type: Boolean, default: true },
    startDate: Date,
    endDate:   Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

BannerSchema.index({ isActive: 1, position: 1 });

module.exports = mongoose.model('Banner', BannerSchema);
