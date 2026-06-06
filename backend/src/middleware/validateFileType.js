// src/middleware/validateFileType.js
// [NEW BUG-024] Middleware kiểm tra magic bytes của file upload
// Chống bypass: đổi tên file .exe thành .jpg không qua được kiểm tra này

const fs = require('fs');
const ApiResponse = require('../utils/apiResponse');

// Map magic bytes (file signature) của các định dạng ảnh hợp lệ
const IMAGE_SIGNATURES = [
  { ext: 'jpg',  bytes: [0xFF, 0xD8, 0xFF] },           // JPEG
  { ext: 'png',  bytes: [0x89, 0x50, 0x4E, 0x47] },     // PNG
  { ext: 'gif',  bytes: [0x47, 0x49, 0x46, 0x38] },     // GIF
  { ext: 'webp', bytes: [0x52, 0x49, 0x46, 0x46] },     // WEBP (RIFF)
];

/**
 * Đọc magic bytes từ file buffer và kiểm tra có phải ảnh hợp lệ không
 * @param {Buffer} buffer - Buffer của file
 * @returns {boolean} - true nếu là ảnh hợp lệ
 */
function isValidImage(buffer) {
  for (const sig of IMAGE_SIGNATURES) {
    const match = sig.bytes.every((byte, i) => buffer[i] === byte);
    if (match) return true;
  }
  return false;
}

/**
 * Middleware validate magic bytes cho file ảnh upload
 * Sử dụng sau multer middleware: upload.single('avatar'), validateImageFile, controller
 */
const validateImageFile = (req, res, next) => {
  if (!req.file) return next();

  try {
    const buffer = fs.readFileSync(req.file.path);

    if (!isValidImage(buffer)) {
      // Xóa file ngay lập tức để không chiếm storage
      try { fs.unlinkSync(req.file.path); } catch {}
      return ApiResponse.badRequest(
        res,
        'File không hợp lệ. Chỉ chấp nhận ảnh thực sự: JPG, PNG, GIF, WEBP'
      );
    }

    next();
  } catch (err) {
    // Xóa file nếu có lỗi
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    console.error('validateImageFile error:', err);
    return ApiResponse.error(res, 'Lỗi khi kiểm tra tính hợp lệ của file');
  }
};

module.exports = { validateImageFile };
