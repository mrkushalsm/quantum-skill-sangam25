const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = ['uploads/profiles', 'uploads/documents', 'uploads/marketplace', 'uploads/others'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Initialize upload directories
createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    
    if (file.fieldname === 'profilePicture') {
      folder += 'profiles/';
    } else if (file.fieldname === 'documents' || file.fieldname === 'attachments') {
      folder += 'documents/';
    } else if (file.fieldname === 'marketplaceImages') {
      folder += 'marketplace/';
    } else {
      folder += 'others/';
    }
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    profilePicture: ['image/jpeg', 'image/jpg', 'image/png'],
    documents: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    attachments: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    marketplaceImages: ['image/jpeg', 'image/jpg', 'image/png']
  };

  const allowedMimeTypes = allowedTypes[file.fieldname] || allowedTypes.documents;

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${file.fieldname}. Allowed types: ${allowedMimeTypes.join(', ')}`), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: fileFilter
});

// Middleware for different upload scenarios
const uploadSingle = (fieldName) => upload.single(fieldName);
const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);
const uploadFields = (fields) => upload.fields(fields);

// Specific upload middlewares
const uploadProfilePicture = upload.single('profilePicture');
const uploadDocument = upload.single('document');
const uploadDocuments = upload.array('documents', 5);
const uploadMarketplaceImages = upload.array('marketplaceImages', 5);
const uploadGrievanceAttachment = upload.array('attachments', 3);

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size allowed is 5MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};

// Optional upload error handler (doesn't stop execution if no error)
const optionalUploadError = (req, res, next) => {
  next();
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadProfilePicture,
  uploadDocument,
  uploadDocuments,
  uploadMarketplaceImages,
  uploadGrievanceAttachment,
  handleUploadError,
  optionalUploadError
};
