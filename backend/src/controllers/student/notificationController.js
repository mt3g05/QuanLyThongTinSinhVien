// src/controllers/student/notificationController.js
const { query, queryOne, insert } = require('../../config/database');
const ApiResponse = require('../../utils/apiResponse');

// @desc    Get all notifications for student
// @route   GET /api/student/notifications
const getNotifications = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let baseWhere = "WHERE n.target_role IN ('all', 'student') AND (nr.is_deleted IS NULL OR nr.is_deleted = 0)";
    let params = [req.user.id];

    if (type && type !== 'all') {
      baseWhere += ' AND n.type = ?';
      params.push(type);
    }

    // Count total
    const countResult = await queryOne(
      `SELECT COUNT(n.id) as total FROM notifications n 
       LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = ?
       ${baseWhere}`,
      params
    );

    // Get notifications with read status
    const notifications = await query(
      `SELECT n.*,
              CASE WHEN nr.id IS NOT NULL THEN 1 ELSE 0 END as is_read,
              nr.read_at
       FROM notifications n
       LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = ?
       ${baseWhere}
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // Count unread
    const unread = await queryOne(
      `SELECT COUNT(n.id) as count
       FROM notifications n
       LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = ?
       ${baseWhere} AND nr.id IS NULL`,
      params
    );

    return ApiResponse.success(res, {
      notifications,
      total: countResult.total,
      unread: unread.count
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy thông báo');
  }
};

// @desc    Mark notification as read
// @route   PUT /api/student/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if notification exists
    const notification = await queryOne('SELECT id FROM notifications WHERE id = ?', [id]);
    if (!notification) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông báo');
    }

    // Insert read record (ignore if already exists)
    await insert(
      `INSERT IGNORE INTO notification_reads (notification_id, user_id) VALUES (?, ?)`,
      [id, req.user.id]
    );

    return ApiResponse.success(res, null, 'Đã đánh dấu đã đọc');
  } catch (error) {
    console.error('Mark as read error:', error);
    return ApiResponse.error(res, 'Lỗi khi đánh dấu đã đọc');
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/student/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    // Get all unread notification IDs
    const unreadNotifications = await query(
      `SELECT n.id
       FROM notifications n
       LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = ?
       WHERE n.target_role IN ('all', 'student') AND (nr.is_deleted IS NULL OR nr.is_deleted = 0) AND nr.id IS NULL`,
      [req.user.id]
    );

    if (unreadNotifications.length > 0) {
      const placeholders = unreadNotifications.map(() => '(?, ?)').join(', ');
      const params = [];
      unreadNotifications.forEach(n => {
        params.push(n.id, req.user.id);
      });
      await insert(
        `INSERT IGNORE INTO notification_reads (notification_id, user_id) VALUES ${placeholders}`,
        params
      );
    }

    return ApiResponse.success(res, null, 'Đã đánh dấu tất cả đã đọc');
  } catch (error) {
    console.error('Mark all as read error:', error);
    return ApiResponse.error(res, 'Lỗi khi đánh dấu tất cả đã đọc');
  }
};

// @desc    Delete notification (hide for user)
// @route   DELETE /api/student/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if notification_reads exists
    const existing = await queryOne(
      'SELECT id FROM notification_reads WHERE notification_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (existing) {
      await query(
        'UPDATE notification_reads SET is_deleted = 1 WHERE id = ?',
        [existing.id]
      );
    } else {
      await query(
        'INSERT INTO notification_reads (notification_id, user_id, is_deleted) VALUES (?, ?, 1)',
        [id, req.user.id]
      );
    }

    return ApiResponse.success(res, null, 'Đã xóa thông báo');
  } catch (error) {
    console.error('Delete notification error:', error);
    return ApiResponse.error(res, 'Lỗi khi xóa thông báo');
  }
};

// @desc    Get unread count
// @route   GET /api/student/notifications/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const result = await queryOne(
      `SELECT COUNT(*) as count
       FROM notifications n
       LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = ?
       WHERE n.target_role IN ('all', 'student') AND (nr.is_deleted IS NULL OR nr.is_deleted = 0) AND nr.id IS NULL`,
      [req.user.id]
    );

    return ApiResponse.success(res, { count: result.count });
  } catch (error) {
    console.error('Unread count error:', error);
    return ApiResponse.error(res, 'Lỗi khi đếm thông báo chưa đọc');
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};