// src/controllers/admin/classController.js
const { query, queryOne, insert, transaction } = require('../../config/database');
const ApiResponse = require('../../utils/apiResponse');
const { getPagination, getPagingData } = require('../../utils/pagination');

// @desc    Get all classes
// @route   GET /api/admin/classes
const getAllClasses = async (req, res) => {
  try {
    const { page, limit, search, department_id, major_id, academic_year, status } = req.query;
    const { currentPage, pageSize, offset } = getPagination(page, limit);

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (cl.name LIKE ? OR cl.class_code LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (department_id) {
      whereClause += ' AND cl.department_id = ?';
      params.push(department_id);
    }

    if (major_id) {
      whereClause += ' AND cl.major_id = ?';
      params.push(major_id);
    }

    if (academic_year) {
      whereClause += ' AND cl.academic_year = ?';
      params.push(academic_year);
    }

    if (status && status !== 'all') {
      whereClause += ' AND cl.status = ?';
      params.push(status);
    }

    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM classes cl ${whereClause}`,
      params
    );

    const classes = await query(
      `SELECT cl.id, cl.class_code, cl.name, cl.department_id, cl.major_id, cl.academic_year, cl.advisor_id, cl.status, cl.created_at,
              d.name as department_name,
              m.name as major_name,
              i.full_name as advisor_name,
              (SELECT COUNT(*) FROM students s WHERE s.class_id = cl.id) as total_students,
              (SELECT AVG(s.gpa) FROM students s WHERE s.class_id = cl.id AND s.gpa > 0) as avg_gpa
       FROM classes cl
       LEFT JOIN departments d ON cl.department_id = d.id
       LEFT JOIN majors m ON cl.major_id = m.id
       LEFT JOIN instructors i ON cl.advisor_id = i.id
       ${whereClause}
       ORDER BY cl.academic_year DESC, cl.class_code ASC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const pagination = getPagingData(countResult.total, currentPage, pageSize);

    return ApiResponse.paginated(res, classes, pagination);
  } catch (error) {
    console.error('Get all classes error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy danh sách lớp học');
  }
};

// @desc    Get class by ID
// @route   GET /api/admin/classes/:id
const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const classData = await queryOne(
      `SELECT cl.id, cl.class_code, cl.name, cl.department_id, cl.major_id, cl.academic_year, cl.advisor_id, cl.status, cl.created_at,
              d.name as department_name,
              m.name as major_name,
              i.full_name as advisor_name, i.email as advisor_email,
              (SELECT COUNT(*) FROM students s WHERE s.class_id = cl.id) as total_students,
              (SELECT AVG(s.gpa) FROM students s WHERE s.class_id = cl.id AND s.gpa > 0) as avg_gpa
       FROM classes cl
       LEFT JOIN departments d ON cl.department_id = d.id
       LEFT JOIN majors m ON cl.major_id = m.id
       LEFT JOIN instructors i ON cl.advisor_id = i.id
       WHERE cl.id = ?`,
      [id]
    );

    if (!classData) {
      return ApiResponse.notFound(res, 'Không tìm thấy lớp học');
    }

    return ApiResponse.success(res, classData);
  } catch (error) {
    console.error('Get class by ID error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy thông tin lớp học');
  }
};

// @desc    Get students in a class
// @route   GET /api/admin/classes/:id/students
const getClassStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;
    const { currentPage, pageSize, offset } = getPagination(page, limit);

    const countResult = await queryOne(
      'SELECT COUNT(*) as total FROM students WHERE class_id = ?',
      [id]
    );

    const students = await query(
      `SELECT s.id, s.student_code, s.full_name, s.email, s.phone,
              s.gpa, s.total_credits, s.status
       FROM students s
       WHERE s.class_id = ?
       ORDER BY s.student_code ASC
       LIMIT ? OFFSET ?`,
      [id, pageSize, offset]
    );

    const pagination = getPagingData(countResult.total, currentPage, pageSize);

    return ApiResponse.paginated(res, students, pagination);
  } catch (error) {
    console.error('Get class students error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy danh sách sinh viên lớp');
  }
};

// @desc    Create class
// @route   POST /api/admin/classes
const createClass = async (req, res) => {
  try {
    const { class_code, name, department_id, major_id, academic_year, advisor_id, status } = req.body;

    const existing = await queryOne(
      'SELECT id FROM classes WHERE class_code = ?',
      [class_code]
    );

    if (existing) {
      return ApiResponse.badRequest(res, 'Mã lớp học đã tồn tại');
    }

    const result = await insert(
      `INSERT INTO classes (class_code, name, department_id, major_id, academic_year, advisor_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        class_code, name,
        department_id || null, major_id || null,
        academic_year || null, advisor_id || null,
        status || 'Đang học'
      ]
    );

    return ApiResponse.created(res, {
      id: result.insertId,
      class_code,
      name
    }, 'Thêm lớp học thành công');

  } catch (error) {
    console.error('Create class error:', error);
    return ApiResponse.error(res, 'Lỗi khi thêm lớp học');
  }
};

// @desc    Update class
// @route   PUT /api/admin/classes/:id
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const classData = await queryOne('SELECT * FROM classes WHERE id = ?', [id]);
    if (!classData) {
      return ApiResponse.notFound(res, 'Không tìm thấy lớp học');
    }

    const allowedFields = ['name', 'department_id', 'major_id', 'academic_year', 'advisor_id', 'status'];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        let val = updateData[field];
        if (val === "" && ['department_id', 'major_id', 'advisor_id'].includes(field)) {
          val = null;
        }
        values.push(val);
      }
    }

    if (updates.length === 0) {
      return ApiResponse.badRequest(res, 'Không có dữ liệu để cập nhật');
    }

    values.push(id);
    await insert(`UPDATE classes SET ${updates.join(', ')} WHERE id = ?`, values);

    return ApiResponse.success(res, null, 'Cập nhật lớp học thành công');
  } catch (error) {
    console.error('Update class error:', error);
    return ApiResponse.error(res, 'Lỗi khi cập nhật lớp học');
  }
};

// @desc    Delete class
// @route   DELETE /api/admin/classes/:id
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const classData = await queryOne('SELECT * FROM classes WHERE id = ?', [id]);
    if (!classData) {
      return ApiResponse.notFound(res, 'Không tìm thấy lớp học');
    }

    const students = await queryOne(
      'SELECT COUNT(*) as count FROM students WHERE class_id = ?',
      [id]
    );

    if (students.count > 0) {
      return ApiResponse.badRequest(res, 'Không thể xóa lớp học đang có sinh viên');
    }

    // [FIX TASK-12] Dùng transaction: xóa registrations → schedules → classes (đúng thứ tự FK)
    await transaction(async (connection) => {
      // 1. Xóa registrations liên quan đến schedules của lớp này trước
      await connection.execute(
        'DELETE FROM registrations WHERE schedule_id IN (SELECT id FROM schedules WHERE class_id = ?)',
        [id]
      );
      // 2. Xóa schedules
      await connection.execute('DELETE FROM schedules WHERE class_id = ?', [id]);
      // 3. Xóa class
      await connection.execute('DELETE FROM classes WHERE id = ?', [id]);
    });

    return ApiResponse.success(res, null, 'Xóa lớp học thành công');
  } catch (error) {
    console.error('Delete class error:', error);
    return ApiResponse.error(res, 'Lỗi khi xóa lớp học');
  }
};

// @desc    Get class statistics
// @route   GET /api/admin/classes/stats
const getClassStats = async (req, res) => {
  try {
    const total = await queryOne('SELECT COUNT(*) as count FROM classes');
    const totalStudents = await queryOne("SELECT COUNT(*) as count FROM students WHERE status = 'Đang học'");
    const totalMajors = await queryOne('SELECT COUNT(*) as count FROM majors');
    const activeYears = await queryOne(
      "SELECT COUNT(DISTINCT academic_year) as count FROM classes WHERE status = 'Đang học'"
    );

    // Top classes by GPA
    const topClasses = await query(
      `SELECT cl.id, cl.class_code, cl.name, cl.total_students, cl.avg_gpa,
              m.name as major_name
       FROM classes cl
       LEFT JOIN majors m ON cl.major_id = m.id
       WHERE cl.avg_gpa > 0
       ORDER BY cl.avg_gpa DESC
       LIMIT 5`
    );

    return ApiResponse.success(res, {
      total: total.count,
      totalStudents: totalStudents.count,
      totalMajors: totalMajors.count,
      activeYears: activeYears.count,
      topClasses
    });
  } catch (error) {
    console.error('Class stats error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy thống kê lớp học');
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  getClassStudents,
  createClass,
  updateClass,
  deleteClass,
  getClassStats
};