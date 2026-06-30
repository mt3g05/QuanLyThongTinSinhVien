// src/controllers/admin/instructorController.js
const { query, queryOne, insert, transaction } = require('../../config/database');
const ApiResponse = require('../../utils/apiResponse');
const { getPagination, getPagingData } = require('../../utils/pagination');

// @desc    Get all instructors with pagination, search, filter
// @route   GET /api/admin/instructors
const getAllInstructors = async (req, res) => {
  try {
    const { page, limit, search, status, department_id, degree } = req.query;
    const { currentPage, pageSize, offset } = getPagination(page, limit);

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (i.full_name LIKE ? OR i.instructor_code LIKE ? OR i.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'all') {
      whereClause += ' AND i.status = ?';
      params.push(status);
    }

    if (department_id) {
      whereClause += ' AND i.department_id = ?';
      params.push(department_id);
    }

    if (degree) {
      whereClause += ' AND i.degree = ?';
      params.push(degree);
    }

    // Count total
    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM instructors i ${whereClause}`,
      params
    );

    // Get instructors with related info
    const instructors = await query(
      `SELECT i.*,
              d.name as department_name, d.code as department_code,
              (SELECT COUNT(*) FROM courses c WHERE c.instructor_id = i.id AND c.status = 'Đang mở') as total_courses,
              (SELECT COUNT(*) FROM schedules sc WHERE sc.instructor_id = i.id) as total_classes,
              (SELECT COALESCE(SUM(c2.current_students), 0) FROM courses c2 WHERE c2.instructor_id = i.id AND c2.status = 'Đang mở') as total_students
       FROM instructors i
       LEFT JOIN departments d ON i.department_id = d.id
       ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const pagination = getPagingData(countResult.total, currentPage, pageSize);

    return ApiResponse.paginated(res, instructors, pagination);
  } catch (error) {
    console.error('Get all instructors error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy danh sách giảng viên: ' + error.message);
  }
};

// @desc    Get instructor by ID
// @route   GET /api/admin/instructors/:id
const getInstructorById = async (req, res) => {
  try {
    const { id } = req.params;

    const instructor = await queryOne(
      `SELECT i.*,
              d.name as department_name, d.code as department_code
       FROM instructors i
       LEFT JOIN departments d ON i.department_id = d.id
       WHERE i.id = ?`,
      [id]
    );

    if (!instructor) {
      return ApiResponse.notFound(res, 'Không tìm thấy giảng viên');
    }

    // Get courses taught by this instructor
    const courses = await query(
      `SELECT c.id, c.course_code, c.name, c.credits, c.current_students, c.max_students, c.status
       FROM courses c
       WHERE c.instructor_id = ?
       ORDER BY c.status ASC, c.name ASC`,
      [id]
    );

    instructor.courses = courses;

    return ApiResponse.success(res, instructor);
  } catch (error) {
    console.error('Get instructor by ID error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy thông tin giảng viên');
  }
};

// @desc    Create new instructor
// @route   POST /api/admin/instructors
const createInstructor = async (req, res) => {
  try {
    const {
      instructor_code, full_name, email, phone,
      department_id, academic_rank, degree, status
    } = req.body;

    // Check if instructor code already exists
    const existing = await queryOne(
      'SELECT id FROM instructors WHERE instructor_code = ?',
      [instructor_code]
    );

    if (existing) {
      return ApiResponse.badRequest(res, 'Mã giảng viên đã tồn tại');
    }

<<<<<<< Updated upstream
    const result = await insert(
      `INSERT INTO instructors (
        instructor_code, full_name, email, phone,
        department_id, academic_rank, degree, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        instructor_code, full_name,
        email || `${instructor_code.toLowerCase()}@ptit.edu.vn`,
        phone || null,
        department_id || null,
        academic_rank || null,
        degree || 'Thạc sĩ',
        status || 'Đang dạy'
      ]
    );
=======
    const result = await transaction(async (connection) => {
      // 1. Create user account
      const salt = await bcrypt.genSalt(10);
      const defaultPassword = '123456';
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);
      
      const [userResult] = await connection.execute(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [instructor_code, hashedPassword, 'instructor']
      );
      
      const userId = userResult.insertId;

      // 2. Create instructor
      const [instructorResult] = await connection.execute(
        `INSERT INTO instructors (
          user_id, instructor_code, full_name, email, phone,
          department_id, academic_rank, degree, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, instructor_code, full_name,
          email || `${instructor_code.toLowerCase()}@ptit.edu.vn`,
          phone || null,
          department_id || null,
          academic_rank || null,
          degree || 'Thạc sĩ',
          status || 'Đang dạy'
        ]
      );
      
      return instructorResult.insertId;
    });
>>>>>>> Stashed changes

    return ApiResponse.created(res, {
      id: result.insertId,
      instructor_code,
      full_name
    }, 'Thêm giảng viên thành công');

  } catch (error) {
    console.error('Create instructor error:', error);
    return ApiResponse.error(res, 'Lỗi khi thêm giảng viên');
  }
};

// @desc    Update instructor
// @route   PUT /api/admin/instructors/:id
const updateInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const instructor = await queryOne('SELECT * FROM instructors WHERE id = ?', [id]);
    if (!instructor) {
      return ApiResponse.notFound(res, 'Không tìm thấy giảng viên');
    }

    const allowedFields = [
      'full_name', 'email', 'phone', 'department_id',
      'academic_rank', 'degree', 'status', 'rating', 'total_teaching_hours'
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        let val = updateData[field];
        if (val === "" && field === 'department_id') {
          val = null;
        }
        values.push(val);
      }
    }

    if (updates.length === 0) {
      return ApiResponse.badRequest(res, 'Không có dữ liệu để cập nhật');
    }

    values.push(id);

    await insert(
      `UPDATE instructors SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return ApiResponse.success(res, null, 'Cập nhật giảng viên thành công');
  } catch (error) {
    console.error('Update instructor error:', error);
    return ApiResponse.error(res, 'Lỗi khi cập nhật giảng viên');
  }
};

// @desc    Delete instructor
// @route   DELETE /api/admin/instructors/:id
const deleteInstructor = async (req, res) => {
  try {
    const { id } = req.params;

    const instructor = await queryOne('SELECT * FROM instructors WHERE id = ?', [id]);
    if (!instructor) {
      return ApiResponse.notFound(res, 'Không tìm thấy giảng viên');
    }

    // Check if instructor has active courses
    const activeCourses = await queryOne(
      "SELECT COUNT(*) as count FROM courses WHERE instructor_id = ? AND status = 'Đang mở'",
      [id]
    );

    if (activeCourses.count > 0) {
      return ApiResponse.badRequest(res, 'Không thể xóa giảng viên đang có môn học hoạt động');
    }

    // [FIX TASK-08] Dùng transaction: xóa instructor + user account liên kết
    await transaction(async (connection) => {
      // Lấy user_id trước khi xóa
      const instructorFull = await queryOne('SELECT user_id FROM instructors WHERE id = ?', [id]);

      // Xóa instructor record
      await connection.execute('DELETE FROM instructors WHERE id = ?', [id]);

      // Xóa user account nếu có
      if (instructorFull?.user_id) {
        // Xóa notification_reads liên quan trước (tránh FK)
        await connection.execute(
          'DELETE FROM notification_reads WHERE user_id = ?',
          [instructorFull.user_id]
        );
        await connection.execute('DELETE FROM users WHERE id = ?', [instructorFull.user_id]);
      }
    });

    return ApiResponse.success(res, null, 'Xóa giảng viên thành công');
  } catch (error) {
    console.error('Delete instructor error:', error);
    return ApiResponse.error(res, 'Lỗi khi xóa giảng viên');
  }
};

// @desc    Get instructor statistics
// @route   GET /api/admin/instructors/stats
const getInstructorStats = async (req, res) => {
  try {
    const total = await queryOne('SELECT COUNT(*) as count FROM instructors');
    const active = await queryOne("SELECT COUNT(*) as count FROM instructors WHERE status = 'Đang dạy'");
    const onLeave = await queryOne("SELECT COUNT(*) as count FROM instructors WHERE status = 'Nghỉ phép'");
    const professors = await queryOne("SELECT COUNT(*) as count FROM instructors WHERE degree = 'GS/PGS'");

    // Degree distribution
    const degreeDistribution = await query(
      `SELECT degree, COUNT(*) as count 
       FROM instructors 
       GROUP BY degree 
       ORDER BY count DESC`
    );

    // Department distribution
    const departmentDistribution = await query(
      `SELECT d.name as department_name, COUNT(i.id) as count
       FROM departments d
       LEFT JOIN instructors i ON i.department_id = d.id
       GROUP BY d.id, d.name
       ORDER BY count DESC`
    );

    return ApiResponse.success(res, {
      total: total.count,
      active: active.count,
      onLeave: onLeave.count,
      professors: professors.count,
      degreeDistribution,
      departmentDistribution
    });
  } catch (error) {
    console.error('Instructor stats error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy thống kê giảng viên');
  }
};

// @desc    Get top rated instructors
// @route   GET /api/admin/instructors/top-rated
const getTopRated = async (req, res) => {
  try {
    const topRated = await query(
      `SELECT i.id, i.instructor_code, i.full_name, i.rating, i.department_id,
              d.name as department_name,
              (SELECT COALESCE(SUM(c.current_students), 0) FROM courses c WHERE c.instructor_id = i.id) as total_students
       FROM instructors i
       LEFT JOIN departments d ON i.department_id = d.id
       WHERE i.rating > 0
       ORDER BY i.rating DESC
       LIMIT 5`
    );

    return ApiResponse.success(res, topRated);
  } catch (error) {
    console.error('Top rated error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy top giảng viên');
  }
};

module.exports = {
  getAllInstructors,
  getInstructorById,
  createInstructor,
  updateInstructor,
  deleteInstructor,
  getInstructorStats,
  getTopRated
};