// src/controllers/student/gradeController.js
const { query, queryOne } = require('../../config/database');
const ApiResponse = require('../../utils/apiResponse');
const { getAcademicClassification, calculateGPA } = require('../../utils/helpers');

// Helper
const getStudentId = async (userId) => {
  const student = await queryOne('SELECT id FROM students WHERE user_id = ?', [userId]);
  return student ? student.id : null;
};

// @desc    Get grade overview (GPA, credits, classification)
// @route   GET /api/student/grades
const getGradeOverview = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông tin sinh viên');
    }

    // Get real cumulative GPA dynamically from approved grades
    const realStats = await queryOne(
      `SELECT (SUM(max_gpa * credits) / NULLIF(SUM(credits), 0)) as avg_gpa, SUM(CASE WHEN max_gpa > 0 THEN credits ELSE 0 END) as total_credits
       FROM (
         SELECT g.course_id, c.credits, MAX(g.gpa_score) as max_gpa
         FROM grades g
         LEFT JOIN courses c ON g.course_id = c.id
         WHERE g.student_id = ? AND g.status = 'Đã duyệt' AND g.gpa_score IS NOT NULL
         GROUP BY g.course_id, c.credits
       ) as best_grades`,
      [studentId]
    );

    const studentGpa = realStats?.avg_gpa ? parseFloat(realStats.avg_gpa).toFixed(2) : 0;
    const studentTotalCredits = realStats?.total_credits || 0;

    // Get current semester GPA
    const currentSemester = await queryOne('SELECT code FROM semesters WHERE is_current = true');
    let currentGPA = 0;

    if (currentSemester) {
      const semesterGrades = await query(
        `SELECT g.gpa_score, c.credits
         FROM grades g
         LEFT JOIN courses c ON g.course_id = c.id
         WHERE g.student_id = ? AND g.semester = ? AND g.status = 'Đã duyệt'`,
        [studentId, currentSemester.code]
      );
      currentGPA = calculateGPA(semesterGrades);
    }

    // Get all semesters the student has grades
    const semesters = await query(
      `SELECT DISTINCT semester FROM grades 
       WHERE student_id = ? AND status = 'Đã duyệt'
       ORDER BY semester ASC`,
      [studentId]
    );

    return ApiResponse.success(res, {
      cumulativeGPA: studentGpa,
      totalCredits: studentTotalCredits,
      classification: getAcademicClassification(studentGpa),
      currentSemesterGPA: currentGPA,
      semesters: semesters.map(s => s.semester)
    });
  } catch (error) {
    console.error('Grade overview error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy tổng quan điểm');
  }
};

// @desc    Get grades by semester
// @route   GET /api/student/grades/semester/:semesterCode
const getGradesBySemester = async (req, res) => {
  try {
    const { semesterCode } = req.params;
    const studentId = await getStudentId(req.user.id);
    if (!studentId) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông tin sinh viên');
    }

    const grades = await query(
      `SELECT g.*, c.course_code, c.name as course_name, c.credits
       FROM grades g
       LEFT JOIN courses c ON g.course_id = c.id
       WHERE g.student_id = ? AND g.semester = ? AND g.status = 'Đã duyệt'
       ORDER BY c.course_code ASC`,
      [studentId, semesterCode]
    );

    // Calculate semester GPA
    const totalCredits = grades.reduce((sum, g) => sum + (g.credits || 0), 0);
    const semesterGPA = calculateGPA(grades.map(g => ({ gpa_score: g.gpa_score, credits: g.credits })));

    return ApiResponse.success(res, {
      semester: semesterCode,
      grades,
      summary: {
        totalCourses: grades.length,
        totalCredits,
        semesterGPA
      }
    });
  } catch (error) {
    console.error('Grades by semester error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy điểm theo học kỳ');
  }
};

// @desc    Get all grades (all semesters)
// @route   GET /api/student/grades/all
const getAllGrades = async (req, res) => {
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
       ORDER BY g.semester ASC, c.course_code ASC`,
      [studentId]
    );

    // Group by semester
    const grouped = {};
    grades.forEach(g => {
      if (!grouped[g.semester]) {
        grouped[g.semester] = [];
      }
      grouped[g.semester].push(g);
    });

    return ApiResponse.success(res, grouped);
  } catch (error) {
    console.error('All grades error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy tất cả điểm');
  }
};

// @desc    Get GPA scale reference
// @route   GET /api/student/grades/gpa-scale
const getGPAScale = async (req, res) => {
  try {
    const { GRADE_SCALE } = require('../../utils/constants');
    return ApiResponse.success(res, GRADE_SCALE);
  } catch (error) {
    return ApiResponse.error(res, 'Lỗi khi lấy thang điểm');
  }
};

module.exports = {
  getGradeOverview,
  getGradesBySemester,
  getAllGrades,
  getGPAScale
};