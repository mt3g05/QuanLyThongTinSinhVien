// src/controllers/student/dashboardController.js
const { query, queryOne } = require('../../config/database');
const ApiResponse = require('../../utils/apiResponse');
const { getAcademicClassification } = require('../../utils/helpers');

// Helper: Get student ID from user
const getStudentId = async (userId) => {
  const student = await queryOne('SELECT id FROM students WHERE user_id = ?', [userId]);
  return student ? student.id : null;
};

// @desc    Get student dashboard overview
// @route   GET /api/student/dashboard
const getDashboard = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông tin sinh viên');
    }

    const student = await queryOne(
      `SELECT s.*, 
              d.name as department_name,
              m.name as major_name, m.total_credits as required_credits,
              c.class_code, c.name as class_name
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN majors m ON s.major_id = m.id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.id = ?`,
      [studentId]
    );

    // Progress
    const progress = student.required_credits > 0
      ? ((student.total_credits / student.required_credits) * 100).toFixed(0)
      : 0;

    return ApiResponse.success(res, {
      student_code: student.student_code,
      full_name: student.full_name,
      avatar: student.avatar,
      class_code: student.class_code,
      class_name: student.class_name,
      department_name: student.department_name,
      major_name: student.major_name,
      gpa: student.gpa,
      total_credits: student.total_credits,
      required_credits: student.required_credits,
      progress: parseInt(progress),
      classification: getAcademicClassification(student.gpa),
      status: student.status
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy thông tin dashboard');
  }
};

// @desc    Get today's schedule
// @route   GET /api/student/dashboard/today
const getTodaySchedule = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông tin sinh viên');
    }

    // Get student's class
    const student = await queryOne('SELECT class_id FROM students WHERE id = ?', [studentId]);

    // Get day of week in Vietnamese
    const days = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const today = days[new Date().getDay()];
    const todayDate = new Date().toISOString().split('T')[0];

    // Get schedules for today
    const schedules = await query(
      `SELECT s.*,
              c.course_code, c.name as course_name, c.credits,
              i.full_name as instructor_name, i.degree, i.academic_rank
       FROM schedules s
       LEFT JOIN courses c ON s.course_id = c.id
       LEFT JOIN instructors i ON s.instructor_id = i.id
       WHERE s.day_of_week = ?
       AND s.class_id = ?
       AND (
         (s.week_start IS NULL AND s.week_end IS NULL)
         OR (s.week_start <= ? AND s.week_end >= ?)
       )
       ORDER BY s.period_start ASC`,
      [today, student.class_id, todayDate, todayDate]
    );

    return ApiResponse.success(res, {
      date: todayDate,
      day_of_week: today,
      schedules
    });
  } catch (error) {
    console.error('Today schedule error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy lịch học hôm nay');
  }
};

// @desc    Get recent notifications for dashboard
// @route   GET /api/student/dashboard/notifications
const getDashboardNotifications = async (req, res) => {
  try {
    const notifications = await query(
      `SELECT n.*, 
              CASE WHEN nr.id IS NOT NULL THEN 1 ELSE 0 END as is_read
       FROM notifications n
       LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = ?
       WHERE n.target_role IN ('all', 'student') AND (nr.is_deleted IS NULL OR nr.is_deleted = 0)
       ORDER BY n.created_at DESC
       LIMIT 3`,
      [req.user.id]
    );

    return ApiResponse.success(res, notifications);
  } catch (error) {
    console.error('Dashboard notifications error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy thông báo');
  }
};

// @desc    Get recent grades for dashboard
// @route   GET /api/student/dashboard/recent-grades
const getRecentGrades = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông tin sinh viên');
    }

    const grades = await query(
      `SELECT g.*, c.course_code, c.name as course_name, c.credits
       FROM grades g
       LEFT JOIN courses c ON g.course_id = c.id
       WHERE g.student_id = ? AND g.status = 'Đã duyệt'
       ORDER BY g.created_at DESC
       LIMIT 5`,
      [studentId]
    );

    return ApiResponse.success(res, grades);
  } catch (error) {
    console.error('Recent grades error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy điểm gần nhất');
  }
};

// @desc    Get dashboard stats (courses, credits, exams, tuition)
// @route   GET /api/student/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông tin sinh viên');
    }

    // [FIX TASK-13] Đếm cả 'Đã xác nhận' vì import điểm set status này
    const currentCourses = await queryOne(
      `SELECT COUNT(*) as count, COALESCE(SUM(c.credits), 0) as total_credits
       FROM registrations r
       LEFT JOIN courses c ON r.course_id = c.id
       WHERE r.student_id = ? AND r.status IN ('Đã đăng ký', 'Đã xác nhận')`,
      [studentId]
    );

    // Upcoming exams (simplified - courses with no final grade yet)
    const upcomingExams = await queryOne(
      `SELECT COUNT(*) as count
       FROM registrations r
       LEFT JOIN grades g ON g.student_id = r.student_id AND g.course_id = r.course_id
       WHERE r.student_id = ? AND r.status = 'Đã đăng ký' AND g.final_score IS NULL`,
      [studentId]
    );

    // Tuition status
    const tuition = await queryOne(
      `SELECT status FROM tuitions 
       WHERE student_id = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [studentId]
    );

    return ApiResponse.success(res, {
      courses: currentCourses.count || 0,
      credits: currentCourses.total_credits || 0,
      upcomingExams: upcomingExams.count || 0,
      tuitionStatus: tuition ? tuition.status : 'Chưa có thông tin'
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy thống kê');
  }
};

module.exports = {
  getDashboard,
  getTodaySchedule,
  getDashboardNotifications,
  getRecentGrades,
  getDashboardStats
};