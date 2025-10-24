const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

/**
 * Payment Proof Upload Service
 * Handles file uploads for payment proofs
 */

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || './uploads/payment-proofs';

// Create upload directory if it doesn't exist
const ensureUploadDir = async () => {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

ensureUploadDir();

// Configure storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-invoiceNumber-originalname
    const invoiceNumber = req.body.invoiceNumber || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}-${invoiceNumber}${ext}`;
    cb(null, filename);
  }
});

// File filter - only allow images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG) and PDF files are allowed'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: fileFilter
});

/**
 * Middleware for single file upload
 */
const uploadPaymentProof = upload.single('paymentProof');

/**
 * Delete a payment proof file
 * @param {String} filePath - Path to file
 */
const deletePaymentProof = async (filePath) => {
  try {
    if (filePath) {
      const fullPath = path.join(process.cwd(), filePath);
      await fs.unlink(fullPath);
      console.log('Deleted file:', filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error.message);
  }
};

/**
 * Get file URL from file path
 * @param {String} filename - Filename
 * @returns {String} File URL
 */
const getFileUrl = (filename) => {
  if (!filename) return null;
  return `/uploads/payment-proofs/${filename}`;
};

module.exports = {
  uploadPaymentProof,
  deletePaymentProof,
  getFileUrl
};
