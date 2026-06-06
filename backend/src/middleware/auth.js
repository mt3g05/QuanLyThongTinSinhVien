// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { queryOne } = require('../config/database');
const ApiResponse = require('../utils/apiResponse');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Get token from header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return ApiResponse.unauthorized(res, 'Vui lòng đăng nhập để truy cập');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await queryOne(
      'SELECT id, username, role, is_active FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      return ApiResponse.unauthorized(res, 'Tài khoản không tồn tại');
    }

    if (!user.is_active) {
      return ApiResponse.unauthorized(res, 'Tài khoản đã bị khóa');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    if (user.role === 'instructor') {
      const instructor = await queryOne('SELECT id FROM instructors WHERE user_id = ?', [user.id]);
      if (instructor) {
        req.user.instructorId = instructor.id;
      }
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Phiên đăng nhập đã hết hạn');
    }
    return ApiResponse.unauthorized(res, 'Token không hợp lệ');
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Vui lòng đăng nhập');
    }

    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, 'Bạn không có quyền truy cập chức năng này');
    }

    next();
  };
};

module.exports = { authenticate, authorize };