import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// MRI file upload configuration
const mriStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadDir, 'mri', req.user?.claims?.sub || 'anonymous');
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const filename = `${timestamp}_${sanitizedName}`;
    cb(null, filename);
  }
});

// File filter for MRI uploads
const mriFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/dicom',
    'image/dicom'
  ];
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.dcm', '.dicom'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only DICOM, JPEG, PNG, and PDF files are allowed.'));
  }
};

// MRI upload middleware
export const uploadMRI = multer({
  storage: mriStorage,
  fileFilter: mriFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  }
}).single('mri_file');

// Profile image upload configuration
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadDir, 'profiles');
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.claims?.sub || 'anonymous';
    const fileExtension = path.extname(file.originalname);
    const filename = `${userId}_profile${fileExtension}`;
    cb(null, filename);
  }
});

// Profile image filter
const profileFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF files are allowed.'));
  }
};

// Profile image upload middleware
export const uploadProfile = multer({
  storage: profileStorage,
  fileFilter: profileFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  }
}).single('profile_image');

// Error handling middleware for upload errors
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File too large. Maximum size is 50MB for MRI files and 5MB for profile images.' 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: 'Too many files. Only one file is allowed.' 
      });
    }
    return res.status(400).json({ 
      message: `Upload error: ${error.message}` 
    });
  }
  
  if (error.message) {
    return res.status(400).json({ 
      message: error.message 
    });
  }
  
  next(error);
};
