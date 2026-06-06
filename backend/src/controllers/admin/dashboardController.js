// src/controllers/admin/dashboardController.js
const { query, queryOne } = require('../../config/database');
const ApiResponse = require('../../utils/apiResponse');

// @desc    Get online users count (student, instructor)
// @route   GET /api/admin/dashboard/online-users
const getOnlineUsersCount = async (req, res) => {
  try {
    const onlineStudents = await queryOne(
      "SELECT COUNT(*) as count FROM users WHERE role = 'student' AND last_login >= DATE_SUB(NOW(), INTERVAL 30 MINUTE) AND is_active = true"
    );
    // [FIX BUG-020] Sửa role 'teacher' → 'instructor' đúng với schema DB
    const onlineInstructors = await queryOne(
      "SELECT COUNT(*) as count FROM users WHERE role = 'instructor' AND last_login >= DATE_SUB(NOW(), INTERVAL 30 MINUTE) AND is_active = true"
    );

    return ApiResponse.success(res, {
      students: onlineStudents.count || 0,
      teachers: onlineInstructors.count || 0
    });
  } catch (error) {
    console.error('Online users error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy số lượng người dùng online');
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
const getStats = async (req, res) => {
  try {
    // Total students
    const totalStudents = await queryOne(
      "SELECT COUNT(*) as count FROM students WHERE status = 'Đang học'"
    );

    // Total instructors
    const totalInstructors = await queryOne(
      "SELECT COUNT(*) as count FROM instructors WHERE status = 'Đang dạy'"
    );

    // Total courses this semester
    const totalCourses = await queryOne(
      "SELECT COUNT(*) as count FROM courses WHERE status = 'Đang mở'"
    );

    // Average GPA
    const avgGPA = await queryOne(
      "SELECT AVG(gpa) as avg_gpa FROM students WHERE status = 'Đang học' AND gpa > 0"
    );

    // Graduation rate (approximate)
    const graduated = await queryOne(
      "SELECT COUNT(*) as count FROM students WHERE status = 'Đã tốt nghiệp'"
    );
    const totalEver = await queryOne(
      "SELECT COUNT(*) as count FROM students"
    );

    const graduationRate = totalEver.count > 0
      ? ((graduated.count / totalEver.count) * 100).toFixed(1)
      : 0;

    // Online users (active in last 30 minutes - simplified)
    const onlineUsers = await queryOne(
      "SELECT COUNT(*) as count FROM users WHERE last_login >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)"
    );

    return ApiResponse.success(res, {
      totalStudents: totalStudents.count,
      totalInstructors: totalInstructors.count,
      totalCourses: totalCourses.count,
      avgGPA: avgGPA.avg_gpa ? parseFloat(avgGPA.avg_gpa).toFixed(2) : '0.00',
      graduationRate: parseFloat(graduationRate),
      onlineUsers: onlineUsers.count,
      uptime: 98.5
    }, 'Lấy thống kê dashboard thành công');

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy thống kê');
  }
};

// @desc    Get recent students
// @route   GET /api/admin/dashboard/recent-students
const getRecentStudents = async (req, res) => {
  try {
    const students = await query(
      `SELECT s.id, s.student_code, s.full_name, s.status, s.enrollment_date,
              c.class_code, c.name as class_name,
              m.name as major_name
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN majors m ON s.major_id = m.id
       ORDER BY s.created_at DESC
       LIMIT 5`
    );

    return ApiResponse.success(res, students);
  } catch (error) {
    console.error('Recent students error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy danh sách sinh viên mới');
  }
};

// @desc    Get upcoming events
// @route   GET /api/admin/dashboard/events
const getEvents = async (req, res) => {
  try {
    const events = await query(
      `SELECT * FROM events 
       WHERE event_date >= CURDATE() 
       ORDER BY event_date ASC 
       LIMIT 5`
    );

    return ApiResponse.success(res, events);
  } catch (error) {
    // [FIX BUG-021] Graceful fallback: bảng events chưa tồn tại → trả mảng rỗng thay vì crash 500
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return ApiResponse.success(res, [], 'Chưa có sự kiện nào');
    }
    console.error('Events error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy sự kiện');
  }
};

// @desc    Get student distribution by department
// @route   GET /api/admin/dashboard/distribution
const getDistribution = async (req, res) => {
  try {
    const distribution = await query(
      `SELECT d.name as department_name, d.code as department_code,
              COUNT(s.id) as student_count
       FROM departments d
       LEFT JOIN students s ON s.department_id = d.id AND s.status = 'Đang học'
       GROUP BY d.id, d.name, d.code
       ORDER BY student_count DESC`
    );

    // Calculate percentages
    const total = distribution.reduce((sum, d) => sum + d.student_count, 0);
    const result = distribution.map(d => ({
      ...d,
      percentage: total > 0 ? ((d.student_count / total) * 100).toFixed(1) : 0
    }));

    return ApiResponse.success(res, result);
  } catch (error) {
    console.error('Distribution error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy phân bố sinh viên');
  }
};

// @desc    Get pending requests
// @route   GET /api/admin/dashboard/pending-requests
const getPendingRequests = async (req, res) => {
  try {
    const requests = await query(
      `SELECT r.*, s.full_name as student_name
       FROM requests r
       LEFT JOIN students s ON r.student_id = s.id
       WHERE r.status = 'Chờ xử lý'
       ORDER BY r.created_at DESC
       LIMIT 5`
    );

    return ApiResponse.success(res, requests);
  } catch (error) {
    console.error('Pending requests error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy yêu cầu chờ xử lý');
  }
};

module.exports = {
  getStats,
  getRecentStudents,
  getEvents,
  getDistribution,
  getPendingRequests,
  getOnlineUsersCount
};