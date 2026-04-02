const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'vpay/misc';
    if (file.fieldname === 'avatar') folder = 'vpay/avatars';
    if (file.fieldname === 'kyc') folder = 'vpay/kyc';
    return {
      folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
      transformation: file.fieldname === 'avatar' ? [{ width: 400, height: 400, crop: 'fill' }] : [],
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
