const VendorKYC = require('../models/VendorKYC');
const User      = require('../models/User');
const { deleteFromCloudinary } = require('../config/cloudinary');
const { sendVendorApprovalEmail } = require('../utils/otp');
const { success, error } = require('../utils/response');

// POST /api/kyc/submit  (vendor)
exports.submitKYC = async (req, res) => {
  try {
    const vendorId = req.user._id;

    const aadharFrontFile = req.files?.aadharFront?.[0];
    const aadharBackFile  = req.files?.aadharBack?.[0];
    const livePhotoFile   = req.files?.livePhoto?.[0];

    if (!aadharFrontFile) return error(res, 'Aadhar front image is required.', 400);
    if (!livePhotoFile)   return error(res, 'Live photo is required.', 400);

    const {
      aadharNumber, bankAccountNumber, bankIfscCode, bankAccountName,
      bankName, businessName, businessAddress, gstNumber, panNumber,
    } = req.body;

    if (!aadharNumber || !bankAccountNumber || !bankIfscCode ||
        !bankAccountName || !businessName || !businessAddress)
      return error(res, 'All required fields must be provided.', 400);

    let kyc = await VendorKYC.findOne({ vendor: vendorId });

    if (kyc) {
      // Delete old Cloudinary assets
      if (kyc.aadharFront) await deleteFromCloudinary(kyc.aadharFront);
      if (kyc.aadharBack)  await deleteFromCloudinary(kyc.aadharBack);
      if (kyc.livePhoto)   await deleteFromCloudinary(kyc.livePhoto);

      Object.assign(kyc, {
        aadharNumber,
        aadharFront: aadharFrontFile.path,
        aadharBack:  aadharBackFile?.path,
        livePhoto:   livePhotoFile.path,
        bankAccountNumber, bankIfscCode, bankAccountName, bankName,
        businessName, businessAddress, gstNumber, panNumber,
        status: 'pending',
        rejectionReason: undefined,
        submissionCount: kyc.submissionCount + 1,
      });
      await kyc.save();
    } else {
      kyc = await VendorKYC.create({
        vendor: vendorId,
        aadharNumber,
        aadharFront:  aadharFrontFile.path,
        aadharBack:   aadharBackFile?.path,
        livePhoto:    livePhotoFile.path,
        bankAccountNumber, bankIfscCode, bankAccountName, bankName,
        businessName, businessAddress, gstNumber, panNumber,
      });
    }

    await User.findByIdAndUpdate(vendorId, {
      kycSubmitted: true,
      businessName,
      isApproved: false,
    });

    success(res, { kyc }, 'KYC submitted. Awaiting owner approval.', 201);
  } catch (err) {
    console.error('submitKYC error:', err);
    error(res, err.message, 500);
  }
};

// GET /api/kyc/my-kyc  (vendor)
exports.getMyKYC = async (req, res) => {
  try {
    const kyc = await VendorKYC.findOne({ vendor: req.user._id });
    if (!kyc) return error(res, 'No KYC submitted yet.', 404);
    success(res, { kyc });
  } catch (err) {
    error(res, err.message, 500);
  }
};

// GET /api/kyc/:id  (owner)
exports.getKYCById = async (req, res) => {
  try {
    const kyc = await VendorKYC.findById(req.params.id)
      .populate('vendor',     'name email phone createdAt')
      .populate('reviewedBy', 'name email');
    if (!kyc) return error(res, 'KYC not found.', 404);
    success(res, { kyc });
  } catch (err) {
    error(res, err.message, 500);
  }
};

// GET /api/kyc/all  (owner)
exports.getAllKYC = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const filter = status !== 'all' ? { status } : {};
    const total  = await VendorKYC.countDocuments(filter);
    const kycs   = await VendorKYC.find(filter)
      .populate('vendor', 'name email phone createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    success(res, { kycs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    error(res, err.message, 500);
  }
};

// PATCH /api/kyc/:id/review  (owner)
exports.reviewKYC = async (req, res) => {
  try {
    const { action, reason } = req.body;
    if (!['approve', 'reject'].includes(action))
      return error(res, 'action must be approve or reject.', 400);

    const kyc = await VendorKYC.findById(req.params.id)
      .populate('vendor', 'name email phone');
    if (!kyc) return error(res, 'KYC not found.', 404);

    const approved       = action === 'approve';
    kyc.status           = approved ? 'approved' : 'rejected';
    kyc.rejectionReason  = approved ? undefined : reason;
    kyc.reviewedBy       = req.user._id;
    kyc.reviewedAt       = new Date();
    await kyc.save();

    await User.findByIdAndUpdate(kyc.vendor._id, {
      isApproved:   approved,
      businessName: kyc.businessName,
    });

    if (kyc.vendor.email) {
      await sendVendorApprovalEmail(
        kyc.vendor.email,
        kyc.vendor.name || 'Vendor',
        approved,
        reason
      );
    }

    success(res, { kyc }, `KYC ${approved ? 'approved' : 'rejected'}.`);
  } catch (err) {
    error(res, err.message, 500);
  }
};
