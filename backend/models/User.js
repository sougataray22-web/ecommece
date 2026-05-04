const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name:  { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true, sparse: true },
    phone: { type: String, trim: true, sparse: true },

    role: { type: String, enum: ['owner', 'vendor', 'customer'], default: 'customer' },

    // Vendor specific
    isApproved:   { type: Boolean, default: false },
    kycSubmitted: { type: Boolean, default: false },
    businessName: { type: String, trim: true },

    // Verification
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },

    // OTP (not returned by default)
    emailOtp:       { type: String, select: false },
    emailOtpExpire: { type: Date,   select: false },
    phoneOtp:       { type: String, select: false },
    phoneOtpExpire: { type: Date,   select: false },

    // Customer addresses
    addresses: [
      {
        label:    String,
        name:     String,
        phone:    String,
        line1:    String,
        line2:    String,
        city:     String,
        state:    String,
        pincode:  String,
        country:  { type: String, default: 'India' },
        isDefault:{ type: Boolean, default: false },
      },
    ],

    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    avatar:   { type: String },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1 });

UserSchema.statics.isOwnerCredential = function (identifier) {
  return (
    identifier === process.env.OWNER_EMAIL ||
    identifier === process.env.OWNER_PHONE
  );
};

module.exports = mongoose.model('User', UserSchema);
