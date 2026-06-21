import multer from 'multer';
import { config } from '../config/env';
import { AppError } from '../utils/AppError';

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  if (file.mimetype !== 'application/pdf') {
    return cb(new AppError('Only PDF files are allowed', 415, 'INVALID_FILE_TYPE'));
  }
  cb(null, true);
}

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSizeMb * 1024 * 1024,
    files: 10,
  },
});
