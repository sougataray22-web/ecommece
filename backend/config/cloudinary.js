const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Storage factory ──────────────────────────────────────────────────────────
const makeStorage = (folder, formats = ['jpg', 'jpeg', 'png', 'webp']) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: formats,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    },
  });

// ─── KYC: dynamic folder based on field name ──────────────────────────────────
const kycStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: file.fieldname === 'livePhoto'
      ? 'ecommerce/kyc/photos'
      : 'ecommerce/kyc/documents',
    allowed_formats: file.fieldname === 'livePhoto'
      ? ['jpg', 'jpeg', 'png', 'webp']
      : ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ quality: 'auto' }],
  }),
});

// ─── Multer instances ─────────────────────────────────────────────────────────
const uploadProduct  = multer({ storage: makeStorage('ecommerce/products'),  limits: { fileSize: 5  * 1024 * 1024 } });
const uploadBanner   = multer({ storage: makeStorage('ecommerce/banners'),   limits: { fileSize: 10 * 1024 * 1024 } });
const uploadCategory = multer({ storage: makeStorage('ecommerce/categories'),limits: { fileSize: 2  * 1024 * 1024 } });

// KYC uses fields() so we export it pre-configured
const uploadKyc = multer({
  storage: kycStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'aadharFront', maxCount: 1 },
  { name: 'aadharBack',  maxCount: 1 },
  { name: 'livePhoto',   maxCount: 1 },
]);

// ─── Delete helper ────────────────────────────────────────────────────────────
const deleteFromCloudinary = async (urlOrPublicId) => {
  try {
    let publicId = urlOrPublicId;
    if (urlOrPublicId && urlOrPublicId.startsWith('http')) {
      const parts = urlOrPublicId.split('/upload/');
      if (parts[1]) {
        publicId = parts[1].replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
      }
    }
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

module.exports = {
  cloudinary,
  uploadProduct,
  uploadBanner,
  uploadCategory,
  uploadKyc,
  deleteFromCloudinary,
};
