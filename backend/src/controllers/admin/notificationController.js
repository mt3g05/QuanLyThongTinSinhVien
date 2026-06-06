// src/controllers/admin/notificationController.js
const { query, queryOne, insert } = require('../../config/database');
const ApiResponse = require('../../utils/apiResponse');
const { getPagination, getPagingData } = require('../../utils/pagination');

// @desc    Get all notifications with pagination and filter
// @route   GET /api/admin/notifications
const getAllNotifications = async (req, res) => {
  try {
    const { page, limit, search, type, priority } = req.query;
    const { currentPage, pageSize, offset } = getPagination(page, limit);

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      // [FIX BUG-015] Tìm kiếm theo cả title lẫn content
      whereClause += ' AND (n.title LIKE ? OR n.content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type && type !== 'all') {
      whereClause += ' AND n.type = ?';
      params.push(type);
    }

    if (priority && priority !== 'all') {
      whereClause += ' AND n.priority = ?';
      params.push(priority);
    }

    // Count total
    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM notifications n ${whereClause}`,
      params
    );

    // Get notifications with author info
    const notifications = await query(
      `SELECT n.*, u.username as created_by_name
       FROM notifications n
       LEFT JOIN users u ON n.created_by = u.id
       ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    // Get read counts for each notification (how many users have read it)
    if (notifications.length > 0) {
      const notificationIds = notifications.map(n => n.id);
      const readCounts = await query(
        `SELECT notification_id, COUNT(*) as read_count 
         FROM notification_reads 
         WHERE notification_id IN (?) 
         GROUP BY notification_id`,
        [notificationIds]
      );
      
      const readMap = {};
      readCounts.forEach(r => { readMap[r.notification_id] = r.read_count; });
      
      notifications.forEach(n => {
        n.read_count = readMap[n.id] || 0;
      });
    }

    const pagination = getPagingData(countResult.total, currentPage, pageSize);
    return ApiResponse.paginated(res, notifications, pagination);
  } catch (error) {
    console.error('Get notifications error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy danh sách thông báo');
  }
};

// @desc    Create notification
// @route   POST /api/admin/notifications
const createNotification = async (req, res) => {
  try {
    const { title, content, type, priority, target_role } = req.body;

    if (!title || !content) {
      return ApiResponse.badRequest(res, 'Vui lòng nhập đủ tiêu đề và nội dung');
    }

    const result = await insert(
      `INSERT INTO notifications (title, content, type, priority, target_role, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title, 
        content, 
        type || 'Thông báo chung', 
        priority || 'Thường', 
        target_role || 'all', 
        req.user.id
      ]
    );

    return ApiResponse.created(res, { id: result.insertId }, 'Tạo thông báo thành công');
  } catch (error) {
    console.error('Create notification error:', error);
    return ApiResponse.error(res, 'Lỗi khi tạo thông báo');
  }
};

// @desc    Delete notification
// @route   DELETE /api/admin/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await queryOne('SELECT id FROM notifications WHERE id = ?', [id]);
    if (!notification) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông báo');
    }

    // Related notification_reads should cascade delete because of FOREIGN KEY ON DELETE CASCADE
    await insert('DELETE FROM notifications WHERE id = ?', [id]);

    return ApiResponse.success(res, null, 'Xóa thông báo thành công');
  } catch (error) {
    console.error('Delete notification error:', error);
    return ApiResponse.error(res, 'Lỗi khi xóa thông báo');
  }
};

// @desc    Update notification
// @route   PUT /api/admin/notifications/:id
const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, priority, target_role } = req.body;

    if (!title || !content) {
      return ApiResponse.badRequest(res, 'Vui lòng nhập đủ tiêu đề và nội dung');
    }

    const notification = await queryOne('SELECT id FROM notifications WHERE id = ?', [id]);
    if (!notification) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông báo');
    }

    await insert(
      `UPDATE notifications SET title = ?, content = ?, type = ?, priority = ?, target_role = ? WHERE id = ?`,
      [title, content, type || 'Thông báo chung', priority || 'Thường', target_role || 'all', id]
    );

    return ApiResponse.success(res, null, 'Cập nhật thông báo thành công');
  } catch (error) {
    console.error('Update notification error:', error);
    return ApiResponse.error(res, 'Lỗi khi cập nhật thông báo');
  }
};

// @desc    Get notification stats
// @route   GET /api/admin/notifications/stats
const getStats = async (req, res) => {
  try {
    const total = await queryOne('SELECT COUNT(*) as count FROM notifications');
    const important = await queryOne("SELECT COUNT(*) as count FROM notifications WHERE priority = 'Quan trọng'");
    const types = await query(
      `SELECT type, COUNT(*) as count FROM notifications GROUP BY type`
    );

    return ApiResponse.success(res, {
      total: total.count,
      important: important.count,
      types
    });
  } catch (error) {
    console.error('Notification stats error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy thống kê thông báo');
  }
};

module.exports = {
  getAllNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  getStats
};
