const { query, insert, queryOne } = require('../../config/database');
const ApiResponse = require('../../utils/apiResponse');

// Helper
const getStudentId = async (userId) => {
  const student = await queryOne('SELECT id FROM students WHERE user_id = ?', [userId]);
  return student ? student.id : null;
};

// @desc    Get available courses for registration
// @route   GET /api/student/courses/available
const getAvailableCourses = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id); // Extracted from token by middleware
    if (!studentId) return ApiResponse.unauthorized(res, 'Không tìm thấy thông tin sinh viên');

    // Get current student's department and major to potentially filter, though we just show all open courses
    const courses = await query(
      `SELECT c.id, c.course_code, c.name, c.credits, c.max_students, c.current_students, c.status,
              c.type, c.semester,
              d.name as department_name, 
              i.full_name as instructor_name,
              s.room, s.day_of_week, s.start_time, s.end_time
       FROM courses c
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN instructors i ON c.instructor_id = i.id
       LEFT JOIN schedules s ON s.course_id = c.id
       WHERE c.status = 'Đang mở'
       ORDER BY c.created_at DESC`
    );

    return ApiResponse.success(res, courses);
  } catch (error) {
    console.error('Get available courses error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy danh sách môn học');
  }
};

// @desc    Get my registered courses
// @route   GET /api/student/courses/my-registrations
const getMyRegistrations = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) return ApiResponse.unauthorized(res, 'Không tìm thấy thông tin sinh viên');

    const registrations = await query(
      `SELECT r.id as registration_id, r.status as registration_status, r.registered_at, r.semester as registration_semester,
              c.id as course_id, c.course_code, c.name, c.credits, c.status as course_status,
              i.full_name as instructor_name,
              s.room, s.day_of_week, s.start_time, s.end_time
       FROM registrations r
       JOIN courses c ON r.course_id = c.id
       LEFT JOIN instructors i ON c.instructor_id = i.id
       LEFT JOIN schedules s ON s.course_id = c.id
       WHERE r.student_id = ?
       ORDER BY r.registered_at DESC`,
      [studentId]
    );

    return ApiResponse.success(res, registrations);
  } catch (error) {
    console.error('Get my registrations error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy danh sách môn đã đăng ký');
  }
};

// @desc    Register for a course
// @route   POST /api/student/courses/register/:courseId
const registerCourse = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) return ApiResponse.unauthorized(res, 'Không tìm thấy thông tin sinh viên');
    const courseId = req.params.courseId;

    // Check if course exists and is open
    const courses = await query('SELECT * FROM courses WHERE id = ?', [courseId]);
    if (courses.length === 0) {
      return ApiResponse.notFound(res, 'Không tìm thấy môn học');
    }
    
    const course = courses[0];
    if (course.status !== 'Đang mở') {
      return ApiResponse.badRequest(res, 'Môn học này không mở đăng ký');
    }
    
    if (course.current_students >= course.max_students) {
      return ApiResponse.badRequest(res, 'Lớp học phần đã đủ số lượng');
    }

    // Check if already registered
    const existing = await query('SELECT * FROM registrations WHERE student_id = ? AND course_id = ?', [studentId, courseId]);
    if (existing.length > 0) {
      if (existing[0].status === 'Đã hủy') {
        // Re-register
        await query(
          'UPDATE registrations SET status = "Đã đăng ký", registered_at = CURRENT_TIMESTAMP WHERE id = ?',
          [existing[0].id]
        );
        await query(
          'UPDATE courses SET current_students = current_students + 1 WHERE id = ?',
          [courseId]
        );
        return ApiResponse.success(res, null, 'Đăng ký thành công');
      }
      return ApiResponse.badRequest(res, 'Bạn đã đăng ký môn học này rồi');
    }

    // New registration
    // We should get a schedule_id if exists
    const schedules = await query('SELECT id FROM schedules WHERE course_id = ? LIMIT 1', [courseId]);
    const scheduleId = schedules.length > 0 ? schedules[0].id : null;
    const semester = course.semester || 'HK1'; // Default or get from course

    await insert(
      'INSERT INTO registrations (student_id, course_id, schedule_id, semester, status) VALUES (?, ?, ?, ?, "Đã đăng ký")',
      [studentId, courseId, scheduleId, semester]
    );

    await query(
      'UPDATE courses SET current_students = current_students + 1 WHERE id = ?',
      [courseId]
    );

    return ApiResponse.success(res, null, 'Đăng ký thành công');
  } catch (error) {
    console.error('Register course error:', error);
    return ApiResponse.error(res, 'Lỗi khi đăng ký môn học');
  }
};

// @desc    Cancel a course registration
// @route   POST /api/student/courses/cancel/:courseId
const cancelRegistration = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) return ApiResponse.unauthorized(res, 'Không tìm thấy thông tin sinh viên');
    const courseId = req.params.courseId;

    // Check existing
    const existing = await query('SELECT * FROM registrations WHERE student_id = ? AND course_id = ?', [studentId, courseId]);
    if (existing.length === 0 || existing[0].status === 'Đã hủy') {
      return ApiResponse.badRequest(res, 'Bạn chưa đăng ký môn học này');
    }

    const courses = await query('SELECT status FROM courses WHERE id = ?', [courseId]);
    if (courses.length > 0 && courses[0].status !== 'Đang mở') {
        return ApiResponse.badRequest(res, 'Không thể hủy khi thời gian đăng ký đã kết thúc');
    }

    await query(
      'UPDATE registrations SET status = "Đã hủy" WHERE id = ?',
      [existing[0].id]
    );

    await query(
      'UPDATE courses SET current_students = GREATEST(0, current_students - 1) WHERE id = ?',
      [courseId]
    );

    return ApiResponse.success(res, null, 'Hủy đăng ký thành công');
  } catch (error) {
    console.error('Cancel registration error:', error);
    return ApiResponse.error(res, 'Lỗi khi hủy đăng ký môn học');
  }
};

module.exports = {
  getAvailableCourses,
  getMyRegistrations,
  registerCourse,
  cancelRegistration
};
