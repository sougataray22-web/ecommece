const { verifyToken } = require('../utils/jwt');
const { error }       = require('../utils/response');
const User            = require('../models/User');

// ─── Verify JWT & attach user ─────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
      return error(res, 'Not authenticated. Please login.', 401);

    const token   = auth.split(' ')[1];
    const decoded = verifyToken(token);
    const user    = await User.findById(decoded.id).select(
      '-emailOtp -phoneOtp -emailOtpExpire -phoneOtpExpire'
    );

    if (!user)          return error(res, 'User no longer exists.', 401);
    if (!user.isActive) return error(res, 'Your account has been deactivated.', 403);

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return error(res, 'Session expired. Please login again.', 401);
    return error(res, 'Invalid token.', 401);
  }
};

// ─── Role guards ──────────────────────────────────────────────────────────────
const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return error(res, `Access denied. Required role: ${roles.join(' or ')}.`, 403);
  next();
};

const ownerOnly  = authorizeRoles('owner');
const vendorOnly = authorizeRoles('vendor', 'owner');

// Vendor must be approved (owner bypasses)
const approvedVendorOnly = (req, res, next) => {
  if (req.user.role === 'owner') return next();
  if (req.user.role !== 'vendor')
    return error(res, 'Vendors only.', 403);
  if (!req.user.isApproved)
    return error(res, 'Your vendor account is pending approval.', 403);
  next();
};

module.exports = { protect, ownerOnly, vendorOnly, approvedVendorOnly, authorizeRoles };
