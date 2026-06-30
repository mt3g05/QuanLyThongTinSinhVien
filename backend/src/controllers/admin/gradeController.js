// src/controllers/admin/gradeController.js
const { query, queryOne, insert, transaction } = require('../../config/database');
const ApiResponse = require('../../utils/apiResponse');
const { getPagination, getPagingData } = require('../../utils/pagination');
const { getLetterGrade, calculateAverage } = require('../../utils/helpers');
const ExcelJS = require('exceljs');

// @desc    Get all grades with filters
// @route   GET /api/admin/grades
const getAllGrades = async (req, res) => {
  try {
    const { page, limit, search, course_id, class_id, semester, status, department_id, cohort_id, major_id, letter_grade } = req.query;
    const { currentPage, pageSize, offset } = getPagination(page, limit);

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (s.full_name LIKE ? OR s.student_code LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (course_id) {
      whereClause += ' AND g.course_id = ?';
      params.push(course_id);
    }

    if (class_id) {
      whereClause += ' AND s.class_id = ?';
      params.push(class_id);
    }

    if (semester) {
      whereClause += ' AND g.semester = ?';
      params.push(semester);
    }

    if (status && status !== 'all') {
      whereClause += ' AND g.status = ?';
      params.push(status);
    }

    if (department_id) {
      whereClause += ' AND s.department_id = ?';
      params.push(department_id);
    }

    if (cohort_id) {
      whereClause += ' AND s.cohort_id = ?';
      params.push(cohort_id);
    }

    if (major_id) {
      whereClause += ' AND s.major_id = ?';
      params.push(major_id);
    }

    if (letter_grade && letter_grade !== 'all') {
      whereClause += ' AND g.letter_grade = ?';
      params.push(letter_grade);
    }

    const countResult = await queryOne(
      `SELECT COUNT(*) as total 
       FROM grades g
       LEFT JOIN students s ON g.student_id = s.id
       ${whereClause}`,
      params
    );

    const grades = await query(
      `SELECT g.*,
              s.student_code, s.full_name as student_name,
              c.course_code, c.name as course_name, c.credits,
              cl.class_code
       FROM grades g
       LEFT JOIN students s ON g.student_id = s.id
       LEFT JOIN courses c ON g.course_id = c.id
       LEFT JOIN classes cl ON s.class_id = cl.id
       ${whereClause}
       ORDER BY g.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const pagination = getPagingData(countResult.total, currentPage, pageSize);

    return ApiResponse.paginated(res, grades, pagination);
  } catch (error) {
    console.error('Get all grades error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy bảng điểm');
  }
};

// @desc    Get grade by ID
// @route   GET /api/admin/grades/:id
const getGradeById = async (req, res) => {
  try {
    const { id } = req.params;

    const grade = await queryOne(
      `SELECT g.*,
              s.student_code, s.full_name as student_name, s.email,
              c.course_code, c.name as course_name, c.credits,
              cl.class_code, cl.name as class_name
       FROM grades g
       LEFT JOIN students s ON g.student_id = s.id
       LEFT JOIN courses c ON g.course_id = c.id
       LEFT JOIN classes cl ON s.class_id = cl.id
       WHERE g.id = ?`,
      [id]
    );

    if (!grade) {
      return ApiResponse.notFound(res, 'Không tìm thấy bảng điểm');
    }

    return ApiResponse.success(res, grade);
  } catch (error) {
    console.error('Get grade by ID error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy chi tiết điểm');
  }
};

// @desc    Create/Input grade
// @route   POST /api/admin/grades
const createGrade = async (req, res) => {
  try {
    const { student_id, course_id, semester, attendance_score, midterm_score, final_score } = req.body;

    // Check if grade already exists
    const existing = await queryOne(
      'SELECT id FROM grades WHERE student_id = ? AND course_id = ? AND semester = ?',
      [student_id, course_id, semester]
    );

    if (existing) {
      return ApiResponse.badRequest(res, 'Điểm cho sinh viên này trong môn học và học kỳ này đã tồn tại');
    }

    // Calculate average and letter grade
    let average_score = null;
    let letter_grade = null;
    let gpa_score = null;

    if (midterm_score !== null && final_score !== null) {
      average_score = calculateAverage(midterm_score, final_score);
      const gradeInfo = getLetterGrade(average_score);
      letter_grade = gradeInfo.letter;
      gpa_score = gradeInfo.gpa;
    }

    const result = await insert(
      `INSERT INTO grades (
        student_id, course_id, semester, attendance_score,
        midterm_score, final_score, average_score,
        letter_grade, gpa_score, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student_id, course_id, semester,
        attendance_score || null,
        midterm_score || null,
        final_score || null,
        average_score,
        letter_grade,
        gpa_score,
        'Chờ duyệt'
      ]
    );

    return ApiResponse.created(res, { id: result.insertId }, 'Nhập điểm thành công');

  } catch (error) {
    console.error('Create grade error:', error);
    return ApiResponse.error(res, 'Lỗi khi nhập điểm');
  }
};

// @desc    Update grade
// @route   PUT /api/admin/grades/:id
const updateGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendance_score, midterm_score, final_score } = req.body;

    const grade = await queryOne('SELECT * FROM grades WHERE id = ?', [id]);
    if (!grade) {
      return ApiResponse.notFound(res, 'Không tìm thấy bảng điểm');
    }

    // Recalculate
    const mid = midterm_score !== undefined ? midterm_score : grade.midterm_score;
    const fin = final_score !== undefined ? final_score : grade.final_score;

    let average_score = grade.average_score;
    let letter_grade = grade.letter_grade;
    let gpa_score = grade.gpa_score;

    if (mid !== null && fin !== null) {
      average_score = calculateAverage(mid, fin);
      const gradeInfo = getLetterGrade(average_score);
      letter_grade = gradeInfo.letter;
      gpa_score = gradeInfo.gpa;
    }

    await transaction(async (connection) => {
      await connection.execute(
        `UPDATE grades SET 
          attendance_score = ?, midterm_score = ?, final_score = ?,
          average_score = ?, letter_grade = ?, gpa_score = ?,
          status = 'Chờ duyệt'
         WHERE id = ?`,
        [
          attendance_score !== undefined ? attendance_score : grade.attendance_score,
          mid, fin, average_score, letter_grade, gpa_score, id
        ]
      );

    });

    return ApiResponse.success(res, null, 'Cập nhật điểm thành công');
  } catch (error) {
    console.error('Update grade error:', error);
    return ApiResponse.error(res, 'Lỗi khi cập nhật điểm');
  }
};

// @desc    Approve grade
// @route   PUT /api/admin/grades/:id/approve
const approveGrade = async (req, res) => {
  try {
    const { id } = req.params;

    const grade = await queryOne('SELECT * FROM grades WHERE id = ?', [id]);
    if (!grade) {
      return ApiResponse.notFound(res, 'Không tìm thấy bảng điểm');
    }

    await transaction(async (connection) => {
      await connection.execute(
        `UPDATE grades SET status = 'Đã duyệt', approved_by = ?, approved_at = NOW() WHERE id = ?`,
        [req.user.id, id]
      );
      await updateStudentGPA(grade.student_id, connection);
    });

    return ApiResponse.success(res, null, 'Duyệt điểm thành công');
  } catch (error) {
    console.error('Approve grade error:', error);
    return ApiResponse.error(res, 'Lỗi khi duyệt điểm');
  }
};

// @desc    Reject grade
// @route   PUT /api/admin/grades/:id/reject
const rejectGrade = async (req, res) => {
  try {
    const { id } = req.params;

    const grade = await queryOne('SELECT * FROM grades WHERE id = ?', [id]);
    if (!grade) {
      return ApiResponse.notFound(res, 'Không tìm thấy bảng điểm');
    }

    await insert(
      `UPDATE grades SET status = 'Từ chối', approved_by = ?, approved_at = NOW() WHERE id = ?`,
      [req.user.id, id]
    );

    return ApiResponse.success(res, null, 'Từ chối điểm thành công');
  } catch (error) {
    console.error('Reject grade error:', error);
    return ApiResponse.error(res, 'Lỗi khi từ chối điểm');
  }
};

// @desc    Approve all pending grades for a course/semester
// @route   PUT /api/admin/grades/approve-all
const approveAll = async (req, res) => {
  try {
    const { course_id, semester } = req.body;

    let whereClause = "WHERE status = 'Chờ duyệt'";
    let params = [];

    if (course_id) {
      whereClause += ' AND course_id = ?';
      params.push(course_id);
    }

    if (semester) {
      whereClause += ' AND semester = ?';
      params.push(semester);
    }

    const affectedStudents = await query(
      `SELECT DISTINCT student_id FROM grades ${whereClause}`,
      params
    );

    if (affectedStudents.length === 0) {
      return ApiResponse.success(res, { approvedCount: 0 }, 'Không có điểm nào chờ duyệt');
    }

    const result = await transaction(async (connection) => {
      const [updateResult] = await connection.execute(
        `UPDATE grades SET status = 'Đã duyệt', approved_by = ?, approved_at = NOW() ${whereClause}`,
        [req.user.id, ...params]
      );

      for (const student of affectedStudents) {
        await updateStudentGPA(student.student_id, connection);
      }
      return updateResult;
    });

    return ApiResponse.success(res, {
      approvedCount: result.affectedRows
    }, `Đã duyệt ${result.affectedRows} bảng điểm`);
  } catch (error) {
    console.error('Approve all error:', error);
    return ApiResponse.error(res, 'Lỗi khi duyệt tất cả điểm');
  }
};

// @desc    Get grade statistics
// @route   GET /api/admin/grades/stats
const getGradeStats = async (req, res) => {
  try {
    const total = await queryOne('SELECT COUNT(*) as count FROM grades');
    const approved = await queryOne("SELECT COUNT(*) as count FROM grades WHERE status = 'Đã duyệt'");
    const pending = await queryOne("SELECT COUNT(*) as count FROM grades WHERE status = 'Chờ duyệt'");
    const rejected = await queryOne("SELECT COUNT(*) as count FROM grades WHERE status = 'Từ chối'");

    const avgGPA = await queryOne(
      "SELECT AVG(gpa_score) as avg_gpa FROM grades WHERE status = 'Đã duyệt' AND gpa_score > 0"
    );

    return ApiResponse.success(res, {
      total: total.count,
      approved: approved.count,
      pending: pending.count,
      rejected: rejected.count,
      avgGPA: avgGPA.avg_gpa ? parseFloat(avgGPA.avg_gpa).toFixed(2) : '0.00'
    });
  } catch (error) {
    console.error('Grade stats error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy thống kê điểm');
  }
};

// @desc    Get grade distribution
// @route   GET /api/admin/grades/distribution
const getGradeDistribution = async (req, res) => {
  try {
    const distribution = await query(
      `SELECT letter_grade, COUNT(*) as count
       FROM grades
       WHERE status = 'Đã duyệt' AND letter_grade IS NOT NULL
       GROUP BY letter_grade
       ORDER BY FIELD(letter_grade, 'A+', 'A', 'B+', 'B', 'C+', 'D', 'F')`
    );

    return ApiResponse.success(res, distribution);
  } catch (error) {
    console.error('Grade distribution error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy phân bố điểm');
  }
};

// @desc    Get GPA trends over semesters
// @route   GET /api/admin/grades/gpa-trends
const getGPATrends = async (req, res) => {
  try {
    const trends = await query(
      `SELECT semester, AVG(gpa_score) as avg_gpa, COUNT(*) as total_grades
       FROM grades
       WHERE status = 'Đã duyệt' AND gpa_score > 0
       GROUP BY semester
       ORDER BY semester ASC`
    );

    return ApiResponse.success(res, trends);
  } catch (error) {
    console.error('GPA trends error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy xu hướng GPA');
  }
};

// @desc    Delete grade
// @route   DELETE /api/admin/grades/:id
const deleteGrade = async (req, res) => {
  try {
    const { id } = req.params;

    const grade = await queryOne('SELECT * FROM grades WHERE id = ?', [id]);
    if (!grade) {
      return ApiResponse.notFound(res, 'Không tìm thấy bảng điểm');
    }

    await insert('DELETE FROM grades WHERE id = ?', [id]);

    if (grade.status === 'Đã duyệt') {
      await updateStudentGPA(grade.student_id);
    }

    return ApiResponse.success(res, null, 'Xóa bảng điểm thành công');
  } catch (error) {
    console.error('Delete grade error:', error);
    return ApiResponse.error(res, 'Lỗi khi xóa bảng điểm');
  }
};

// @desc    Get form options for grades (students & courses)
// @route   GET /api/admin/grades/options/form-data
const getGradeFormOptions = async (req, res) => {
  try {
    const students = await query(`
      SELECT s.id, s.student_code, s.full_name, s.department_id, s.major_id, s.class_id 
      FROM students s 
      ORDER BY s.student_code ASC
    `);
    const courses = await query('SELECT id, course_code, name FROM courses ORDER BY course_code ASC');
    const classes = await query('SELECT id, class_code, name, major_id FROM classes ORDER BY class_code ASC');

    return ApiResponse.success(res, { students, courses, classes });
  } catch (error) {
    console.error('Get grade form options error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy dữ liệu form');
  }
};

// Helper: Update student's cumulative GPA
const updateStudentGPA = async (studentId, connection = null) => {
  try {
    let result;
    const sqlSelect = `SELECT AVG(g.gpa_score) as avg_gpa, SUM(c.credits) as total_credits
                       FROM grades g
                       LEFT JOIN courses c ON g.course_id = c.id
                       WHERE g.student_id = ? AND g.status = 'Đã duyệt' AND g.gpa_score > 0`;

    if (connection) {
      const [rows] = await connection.execute(sqlSelect, [studentId]);
      result = rows[0];
    } else {
      result = await queryOne(sqlSelect, [studentId]);
    }

    if (result) {
      const gpa = result.avg_gpa ? parseFloat(result.avg_gpa).toFixed(2) : 0;
      const credits = result.total_credits || 0;
      const sqlUpdate = 'UPDATE students SET gpa = ?, total_credits = ? WHERE id = ?';

      if (connection) {
        await connection.execute(sqlUpdate, [gpa, credits, studentId]);
      } else {
        await insert(sqlUpdate, [gpa, credits, studentId]);
      }
    }
  } catch (error) {
    console.error('Update student GPA error:', error);
  }
};

// @desc    Import grades from excel
// @route   POST /api/admin/grades/import
const importGrades = async (req, res) => {
  try {
    const { department_id, cohort_id, major_id, class_id, semester } = req.body;
    if (!req.file) return ApiResponse.error(res, 'Vui lòng đính kèm file Excel hoặc CSV');

    let successCount = 0;
    let errorCount = 0;
    let errors = [];

    let cQuery = 'SELECT id, student_code FROM students WHERE 1=1';
    let params = [];
    if (class_id) { cQuery += ' AND class_id = ?'; params.push(class_id); }
    else if (major_id) { cQuery += ' AND major_id = ?'; params.push(major_id); }
    else if (department_id) { cQuery += ' AND department_id = ?'; params.push(department_id); }
    else if (cohort_id) { cQuery += ' AND cohort_id = ?'; params.push(cohort_id); }

    const students = await query(cQuery, params);
    const studentMap = {};
    students.forEach(s => studentMap[s.student_code.toLowerCase()] = s.id);

    const courses = await query('SELECT id, course_code FROM courses');
    const courseMap = {};
    courses.forEach(c => courseMap[c.course_code.toLowerCase()] = c.id);

    const isCSV = req.file.originalname.toLowerCase().endsWith('.csv') || req.file.mimetype === 'text/csv';
    const rows = [];

    if (isCSV) {
      // Parse CSV
      const text = req.file.buffer.toString('utf-8').replace(/^\uFEFF/, ''); // strip BOM
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      lines.slice(1).forEach((line, idx) => {
        const cells = line.split(',');
        rows.push({
          rowNumber: idx + 2,
          sCode: cells[0]?.trim(),
          cCode: cells[1]?.trim(),
          att: parseFloat(cells[2]),
          mid: parseFloat(cells[3]),
          fin: parseFloat(cells[4])
        });
      });
    } else {
      // Parse Excel
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) return ApiResponse.error(res, 'File Excel không có dữ liệu');

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          rows.push({
            rowNumber,
            sCode: row.getCell(1).value?.toString().trim(),
            cCode: row.getCell(2).value?.toString().trim(),
            att: parseFloat(row.getCell(3).value),
            mid: parseFloat(row.getCell(4).value),
            fin: parseFloat(row.getCell(5).value)
          });
        }
      });
    }

    for (const r of rows) {
      if (!r.sCode || !r.cCode) {
        errorCount++;
        continue;
      }
      const studentId = studentMap[r.sCode.toLowerCase()];
      const courseId = courseMap[r.cCode.toLowerCase()];

      if (!studentId || !courseId) {
        errorCount++;
        errors.push(`Dòng ${r.rowNumber}: Không tìm thấy SV (${r.sCode}) hoặc Môn học (${r.cCode}) trong bối cảnh lớp/ngành đã chọn`);
        continue;
      }

      let average_score = null;
      let letter_grade = null;
      let gpa_score = null;

      if (!isNaN(r.mid) && !isNaN(r.fin)) {
        average_score = calculateAverage(r.mid, r.fin);
        const gradeInfo = getLetterGrade(average_score);
        letter_grade = gradeInfo.letter;
        gpa_score = gradeInfo.gpa;
      }

      try {
        await insert(
          `INSERT INTO grades (student_id, course_id, semester, attendance_score, midterm_score, final_score, average_score, letter_grade, gpa_score, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Chờ duyệt')
           ON DUPLICATE KEY UPDATE 
           attendance_score=VALUES(attendance_score), midterm_score=VALUES(midterm_score), final_score=VALUES(final_score),
           average_score=VALUES(average_score), letter_grade=VALUES(letter_grade), gpa_score=VALUES(gpa_score), status='Chờ duyệt'`,
          [studentId, courseId, semester, 
           isNaN(r.att) ? null : r.att, 
           isNaN(r.mid) ? null : r.mid, 
           isNaN(r.fin) ? null : r.fin, 
           average_score, letter_grade, gpa_score]
        );
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push(`Dòng ${r.rowNumber}: Lỗi lưu dữ liệu`);
      }
    }

    return ApiResponse.success(res, { successCount, errorCount, errors }, 'Import hoàn tất');
  } catch (error) {
    console.error('Import grade error:', error);
    return ApiResponse.error(res, 'Lỗi khi import file Excel');
  }
};

module.exports = {
  getAllGrades,
  getGradeById,
  createGrade,
  updateGrade,
  approveGrade,
  rejectGrade,
  approveAll,
  getGradeStats,
  getGradeDistribution,
  getGPATrends,
  deleteGrade,
  getGradeFormOptions,
  importGrades
};