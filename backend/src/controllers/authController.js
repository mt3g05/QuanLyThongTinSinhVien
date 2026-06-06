// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne, insert } = require('../config/database');
const ApiResponse = require('../utils/apiResponse');

// Generate tokens
const generateAccessToken = (user, rememberMe) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: rememberMe ? '30d' : '1d' }
  );
};

const generateRefreshToken = (user, rememberMe) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: rememberMe ? '60d' : '7d' }
  );
};

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    // Find user
    const user = await queryOne(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      return ApiResponse.unauthorized(res, 'Tên đăng nhập hoặc mật khẩu không đúng');
    }

    // Check if account is active
    if (!user.is_active) {
      return ApiResponse.unauthorized(res, 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên');
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return ApiResponse.unauthorized(res, 'Tên đăng nhập hoặc mật khẩu không đúng');
    }

    // Force password change for student/instructor's first login
    const isDefaultPassword = await bcrypt.compare(user.username + '@Ptit', user.password);
    if ((user.role === 'student' || user.role === 'instructor') && isDefaultPassword) {
      const tempToken = jwt.sign(
        { id: user.id, username: user.username, role: user.role, isTemp: true },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
      
      return res.status(200).json({
        success: true,
        message: 'Vui lòng đổi mật khẩu trong lần đăng nhập đầu tiên',
        data: {
          requirePasswordChange: true,
          tempToken,
          user: { username: user.username, role: user.role }
        }
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user, rememberMe);
    const refreshToken = generateRefreshToken(user, rememberMe);

    // Save refresh token to database
    await insert(
      'UPDATE users SET refresh_token = ?, last_login = NOW() WHERE id = ?',
      [refreshToken, user.id]
    );

    // Get additional user info based on role
    let userInfo = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    if (user.role === 'student') {
      const student = await queryOne(
        'SELECT id, student_code, full_name, avatar, email FROM students WHERE user_id = ?',
        [user.id]
      );
      if (student) {
        userInfo = { ...userInfo, ...student, studentId: student.id };
      }
    } else if (user.role === 'instructor') {
      const instructor = await queryOne(
        'SELECT id, instructor_code, full_name, avatar, email FROM instructors WHERE user_id = ?',
        [user.id]
      );
      if (instructor) {
        userInfo = { ...userInfo, ...instructor, instructorId: instructor.id };
      }
    } else if (user.role === 'admin') {
      userInfo.full_name = 'Admin PTIT';
      userInfo.email = 'admin@ptit.edu.vn';
    }

    // Set cookie
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return ApiResponse.success(res, {
      user: userInfo,
      accessToken,
      refreshToken
    }, 'Đăng nhập thành công');

  } catch (error) {
    console.error('Login error:', error);
    return ApiResponse.error(res, 'Lỗi server khi đăng nhập');
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Clear refresh token in database
    if (req.user) {
      await insert(
        'UPDATE users SET refresh_token = NULL WHERE id = ?',
        [req.user.id]
      );
    }

    // Clear cookie
    res.clearCookie('token');

    return ApiResponse.success(res, null, 'Đăng xuất thành công');
  } catch (error) {
    console.error('Logout error:', error);
    return ApiResponse.error(res, 'Lỗi server khi đăng xuất');
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return ApiResponse.unauthorized(res, 'Refresh token không được cung cấp');
    }

    // Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Find user and check refresh token
    const user = await queryOne(
      'SELECT * FROM users WHERE id = ? AND refresh_token = ?',
      [decoded.id, token]
    );

    if (!user) {
      return ApiResponse.unauthorized(res, 'Refresh token không hợp lệ');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update refresh token in database
    await insert(
      'UPDATE users SET refresh_token = ? WHERE id = ?',
      [newRefreshToken, user.id]
    );

    // Set new cookie
    res.cookie('token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return ApiResponse.success(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    }, 'Token đã được làm mới');

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Refresh token đã hết hạn, vui lòng đăng nhập lại');
    }
    return ApiResponse.unauthorized(res, 'Refresh token không hợp lệ');
  }
};

// @desc    Get current user info
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await queryOne(
      'SELECT id, username, role, last_login, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return ApiResponse.notFound(res, 'Không tìm thấy tài khoản');
    }

    let userInfo = { ...user };

    if (user.role === 'student') {
      const student = await queryOne(
        `SELECT s.*, d.name as department_name, m.name as major_name, c.class_code, c.name as class_name
         FROM students s
         LEFT JOIN departments d ON s.department_id = d.id
         LEFT JOIN majors m ON s.major_id = m.id
         LEFT JOIN classes c ON s.class_id = c.id
         WHERE s.user_id = ?`,
        [user.id]
      );
      if (student) {
        userInfo = { ...userInfo, student };
      }
    }

    return ApiResponse.success(res, userInfo, 'Lấy thông tin tài khoản thành công');
  } catch (error) {
    console.error('GetMe error:', error);
    return ApiResponse.error(res, 'Lỗi server');
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await queryOne(
      'SELECT id, password FROM users WHERE id = ?',
      [req.user.id]
    );

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return ApiResponse.badRequest(res, 'Mật khẩu hiện tại không đúng');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await insert(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, user.id]
    );

    return ApiResponse.success(res, null, 'Đổi mật khẩu thành công');
  } catch (error) {
    console.error('Change password error:', error);
    return ApiResponse.error(res, 'Lỗi server khi đổi mật khẩu');
  }
};

// @desc    Force change password on first login
// @route   POST /api/auth/force-change-password
// @access  Public (with temp token)
const forceChangePassword = async (req, res) => {
  try {
    const { tempToken, newPassword } = req.body;

    if (!tempToken || !newPassword) {
      return ApiResponse.badRequest(res, 'Vui lòng cung cấp đầy đủ thông tin');
    }

    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      if (!decoded.isTemp) {
        return ApiResponse.unauthorized(res, 'Token không hợp lệ cho chức năng này');
      }
    } catch (err) {
      return ApiResponse.unauthorized(res, 'Phiên đổi mật khẩu đã hết hạn hoặc không hợp lệ');
    }

    // Validate new password (at least 8 chars, letter, number, special char)
    const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      return ApiResponse.badRequest(res, 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái, số và ký tự đặc biệt');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in db
    await insert(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, decoded.id]
    );

    // After changing password, automatically log them in
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [decoded.id]);
    
    if (!user || !user.is_active) {
      return ApiResponse.unauthorized(res, 'Tài khoản không hợp lệ hoặc đã bị khóa');
    }

    // Generate real tokens
    const accessToken = generateAccessToken(user, false);
    const refreshToken = generateRefreshToken(user, false);

    // Save refresh token to database
    await insert(
      'UPDATE users SET refresh_token = ?, last_login = NOW() WHERE id = ?',
      [refreshToken, user.id]
    );

    // Get additional user info based on role
    let userInfo = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    if (user.role === 'student') {
      const student = await queryOne(
        'SELECT id, student_code, full_name, avatar, email FROM students WHERE user_id = ?',
        [user.id]
      );
      if (student) {
        userInfo = { ...userInfo, ...student, studentId: student.id };
      }
    }

    // Set cookie
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return ApiResponse.success(res, {
      user: userInfo,
      accessToken,
      refreshToken
    }, 'Đổi mật khẩu và đăng nhập thành công');

  } catch (error) {
    console.error('Force change password error:', error);
    return ApiResponse.error(res, 'Lỗi server khi đổi mật khẩu');
  }
};

module.exports = {
  login,
  logout,
  refreshToken,
  getMe,
  changePassword,
  forceChangePassword
};