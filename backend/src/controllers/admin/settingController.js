// src/controllers/admin/settingController.js
const { query, queryOne, insert } = require('../../config/database');
const ApiResponse = require('../../utils/apiResponse');
const bcrypt = require('bcryptjs');

// @desc    Get all settings
// @route   GET /api/admin/settings


<<<<<<< Updated upstream
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return ApiResponse.notFound(res, 'Không tìm thấy người dùng');
    }

    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch) {
      return ApiResponse.badRequest(res, 'Mật khẩu hiện tại không chính xác');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    await insert('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    return ApiResponse.success(res, null, 'Đổi mật khẩu thành công');
  } catch (error) {
    console.error('Change password error:', error);
    return ApiResponse.error(res, 'Lỗi khi đổi mật khẩu');
  }
};
=======
>>>>>>> Stashed changes

const getSettings = async (req, res) => {
  try {
    const settings = await query('SELECT * FROM settings');

    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.setting_key] = s.setting_value;
    });

    return ApiResponse.success(res, settingsObj);
  } catch (error) {
    console.error('Get settings error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy cài đặt');
  }
};

// @desc    Update general settings
// @route   PUT /api/admin/settings/general
const updateGeneral = async (req, res) => {
  try {
    const { system_name, current_semester, language, timezone, credit_price } = req.body;

    const updates = [
      { key: 'system_name', value: system_name },
      { key: 'current_semester', value: current_semester },
      { key: 'language', value: language },
      { key: 'timezone', value: timezone },
      { key: 'credit_price', value: credit_price }
    ];

    for (const { key, value } of updates) {
      if (value !== undefined) {
        await insert(
          `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = ?`,
          [key, value, value]
        );
      }
    }

    // [FIX TASK-11] Đồng bộ current_semester sang bảng semesters
    // (Trước đây có 2 nguồn sự thật: settings table vs semesters.is_current)
    if (current_semester !== undefined) {
      await insert('UPDATE semesters SET is_current = 0');
      // Tìm semester theo code hoặc name
      await insert(
        `UPDATE semesters SET is_current = 1
         WHERE code = ? OR name = ?`,
        [current_semester, current_semester]
      );
    }

    return ApiResponse.success(res, null, 'Cập nhật cài đặt chung thành công');
  } catch (error) {
    console.error('Update general settings error:', error);
    return ApiResponse.error(res, 'Lỗi khi cập nhật cài đặt');
  }
};

// @desc    Update profile
// @route   PUT /api/admin/settings/profile
const updateProfile = async (req, res) => {
  try {
    const { full_name, email, phone } = req.body;

    // For admin, store in settings
    const updates = [
      { key: 'admin_name', value: full_name },
      { key: 'admin_email', value: email },
      { key: 'admin_phone', value: phone }
    ];

    for (const { key, value } of updates) {
      if (value !== undefined) {
        await insert(
          `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = ?`,
          [key, value, value]
        );
      }
    }

    return ApiResponse.success(res, null, 'Cập nhật thông tin tài khoản thành công');
  } catch (error) {
    console.error('Update profile error:', error);
    return ApiResponse.error(res, 'Lỗi khi cập nhật thông tin');
  }
};

// @desc    Update notification settings
// @route   PUT /api/admin/settings/notifications
const updateNotifications = async (req, res) => {
  try {
    const { email_notifications, system_alerts, auto_backup } = req.body;

    const updates = [
      { key: 'email_notifications', value: email_notifications?.toString() },
      { key: 'system_alerts', value: system_alerts?.toString() },
      { key: 'auto_backup', value: auto_backup?.toString() }
    ];

    for (const { key, value } of updates) {
      if (value !== undefined) {
        await insert(
          `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = ?`,
          [key, value, value]
        );
      }
    }

    return ApiResponse.success(res, null, 'Cập nhật cài đặt thông báo thành công');
  } catch (error) {
    console.error('Update notifications error:', error);
    return ApiResponse.error(res, 'Lỗi khi cập nhật thông báo');
  }
};

// @desc    Get system status
// @route   GET /api/admin/settings/system-status
const getSystemStatus = async (req, res) => {
  try {
    const activeSessions = await queryOne('SELECT COUNT(*) as count FROM users WHERE last_login >= NOW() - INTERVAL 30 MINUTE AND is_active = true');
    const dbSize = await queryOne(
      `SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 1) AS size_mb
       FROM information_schema.TABLES
       WHERE table_schema = ?`,
      [process.env.DB_NAME]
    );

    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / (24 * 3600));
    const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptimeStr = `${days} ngày ${hours} giờ ${minutes} phút`;

    return ApiResponse.success(res, {
      version: 'v2.5.1',
      uptime: uptimeStr,
      storage: `${dbSize.size_mb || 0} MB`,
      activeUsers: activeSessions.count,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('System status error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy trạng thái hệ thống');
  }
};

// @desc    Get active sessions
// @route   GET /api/admin/settings/sessions
const getSessions = async (req, res) => {
  try {
    const sessions = await query(
      `SELECT id, username, role, last_login
       FROM users
       WHERE refresh_token IS NOT NULL AND is_active = true
       ORDER BY last_login DESC`
    );

    return ApiResponse.success(res, sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy phiên đăng nhập');
  }
};

// @desc    Revoke a session
// @route   DELETE /api/admin/settings/sessions/:id
const revokeSession = async (req, res) => {
  try {
    const { id } = req.params;

    await insert(
      'UPDATE users SET refresh_token = NULL WHERE id = ?',
      [id]
    );

    return ApiResponse.success(res, null, 'Đã thu hồi phiên đăng nhập');
  } catch (error) {
    console.error('Revoke session error:', error);
    return ApiResponse.error(res, 'Lỗi khi thu hồi phiên');
  }
};

// @desc    Backup database (simplified - trigger info only)
// @route   POST /api/admin/settings/database/backup
const backupDatabase = async (req, res) => {
  try {
    // In production, this would trigger actual backup
    // For now, just record the backup event
    await insert(
      `INSERT INTO settings (setting_key, setting_value) VALUES ('last_backup', NOW())
       ON DUPLICATE KEY UPDATE setting_value = NOW()`
    );

    return ApiResponse.success(res, {
      backup_time: new Date().toISOString(),
      status: 'completed'
    }, 'Sao lưu database thành công');
  } catch (error) {
    console.error('Backup error:', error);
    return ApiResponse.error(res, 'Lỗi khi sao lưu');
  }
};

module.exports = {
  getSettings,
  updateGeneral,
  updateProfile,
  updateNotifications,
  getSystemStatus,
  getSessions,
  revokeSession,
  backupDatabase
};
