const mongoose = require('mongoose');

const VendorKYCSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    aadharNumber: { type: String, required: true },
    aadharFront:  { type: String, required: true },
    aadharBack:   { type: String },
    livePhoto:    { type: String, required: true },

    bankAccountNumber: { type: String, required: true },
    bankIfscCode:      { type: String, required: true },
    bankAccountName:   { type: String, required: true },
    bankName:          { type: String },

    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String },
    reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt:  { type: Date },

    businessName:    { type: String, required: true },
    businessAddress: { type: String, required: true },
    gstNumber: { type: String },
    panNumber:  { type: String },

    submissionCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

VendorKYCSchema.index({ vendor: 1 });
VendorKYCSchema.index({ status: 1 });

module.exports = mongoose.model('VendorKYC', VendorKYCSchema);
