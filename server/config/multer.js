import multer from "multer";
import { profileStorage, fileStorage } from "./cloudinary.js";

// Configure multer for profile image uploads
const profileUpload = multer({ 
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.'));
    }
  }
});

// Configure multer for file uploads
const fileUpload = multer({ 
  storage: fileStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export { profileUpload, fileUpload }; 