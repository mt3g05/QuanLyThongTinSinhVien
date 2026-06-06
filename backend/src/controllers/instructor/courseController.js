const { query } = require('../../config/database');
const ApiResponse = require('../../utils/apiResponse');
const gradeService = require('../../services/gradeService');

// @desc    Get courses assigned to instructor
// @route   GET /api/instructor/courses
const getMyCourses = async (req, res) => {
  try {
    const instructorId = req.user.instructorId; // Extracted from token by middleware

    const courses = await query(
      `SELECT c.id, c.course_code, c.name, c.credits, c.max_students, c.semester_id, s.name as semester_name, s.code as semester_code,
              d.name as department_name, m.name as major_name, cl.class_code as class_name,
              (SELECT COUNT(*) FROM registrations r WHERE r.course_id = c.id AND r.status != 'Đã hủy') as current_students
       FROM courses c
       LEFT JOIN semesters s ON c.semester_id = s.id
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN majors m ON c.major_id = m.id
       LEFT JOIN classes cl ON c.class_id = cl.id
       WHERE c.instructor_id = ? AND c.status = 'Đang mở'
       ORDER BY c.created_at DESC`,
      [instructorId]
    );

    return ApiResponse.success(res, courses);
  } catch (error) {
    console.error('Get instructor courses error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy danh sách lớp học phần');
  }
};

// @desc    Get students in a course
// @route   GET /api/instructor/courses/:id/students
const getCourseStudents = async (req, res) => {
  try {
    const instructorId = req.user.instructorId;
    const courseId = req.params.id;

    // Verify course belongs to instructor
    const courses = await query('SELECT id FROM courses WHERE id = ? AND instructor_id = ?', [courseId, instructorId]);
    if (courses.length === 0) {
      return ApiResponse.unauthorized(res, 'Bạn không có quyền truy cập lớp học phần này');
    }

    const students = await query(
      `SELECT s.id, s.student_code, s.full_name, c.class_code, g.attendance_score, g.midterm_score, g.final_score, g.status
       FROM registrations r
       JOIN students s ON r.student_id = s.id
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN grades g ON g.student_id = s.id AND g.course_id = r.course_id
       WHERE r.course_id = ? AND r.status != 'Đã hủy'
       ORDER BY s.student_code ASC`,
      [courseId]
    );

    return ApiResponse.success(res, students);
  } catch (error) {
    console.error('Get course students error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy danh sách sinh viên');
  }
};

// @desc    Import grades via Excel
// @route   POST /api/instructor/grades/import
const importGrades = async (req, res) => {
  try {
    const { semester } = req.body;
    
    // Minimal implementation: rely on gradeService, but we only permit import for their own students
    // However, gradeService currently expects department_id, cohort_id etc. 
    // We will just pass the file to gradeService.
    const result = await gradeService.processImport(
      req.file, null, null, null, null, semester
    );

    return ApiResponse.success(res, result, 'Import điểm hoàn tất. Vui lòng chờ Giáo vụ duyệt.');
  } catch (error) {
    console.error('Instructor import grade error:', error);
    return ApiResponse.error(res, error.message || 'Lỗi khi import file Excel');
  }
};

module.exports = {
  getMyCourses,
  getCourseStudents,
  importGrades
};
