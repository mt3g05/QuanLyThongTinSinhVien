const { query, queryOne, insert } = require('../../config/database');
const ApiResponse = require('../../utils/apiResponse');
const { getPagination, getPagingData } = require('../../utils/pagination');

// @desc    Get all courses with pagination, search, filter
// @route   GET /api/admin/courses
exports.getCourses = async (req, res) => {
  try {
    const { page, size, search, department_id, major_id, class_id } = req.query;
    const { limit, offset } = getPagination(page, size);

    let baseQuery = `
      FROM courses c
      LEFT JOIN instructors i ON c.instructor_id = i.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN majors m ON c.major_id = m.id
      LEFT JOIN classes cl ON c.class_id = cl.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (search) {
      baseQuery += ` AND (c.course_code LIKE ? OR c.name LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    if (department_id) {
      baseQuery += ` AND c.department_id = ?`;
      queryParams.push(department_id);
    }
    
    if (major_id) {
      baseQuery += ` AND c.major_id = ?`;
      queryParams.push(major_id);
    }
    
    if (class_id) {
      baseQuery += ` AND c.class_id = ?`;
      queryParams.push(class_id);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const [countResult] = await query(countQuery, queryParams);
    const totalItems = countResult.total;

    // Get data
    const dataQuery = `
      SELECT c.*, 
             (SELECT COUNT(*) FROM registrations r WHERE r.course_id = c.id AND r.status != 'Đã hủy') as current_students,
             i.full_name as instructor_name,
             d.name as department_name,
             m.name as major_name,
             cl.class_code as class_name
      ${baseQuery}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const courses = await query(dataQuery, [...queryParams, Number(limit) || 10, Number(offset) || 0]);

    const pagination = getPagingData(totalItems, Number(page) || 1, Number(limit) || 10);
    return ApiResponse.paginated(res, courses, pagination, 'Lấy danh sách môn học thành công');
  } catch (error) {
    console.error('Lỗi khi lấy danh sách môn học:', error);
    return ApiResponse.error(res, 'Lỗi server khi lấy danh sách môn học');
  }
};

// @desc    Create new course
// @route   POST /api/admin/courses
exports.createCourse = async (req, res) => {
  try {
    const { 
      course_code, name, credits, department_id, major_id, class_id, 
      instructor_id, description, max_students, semester, type 
    } = req.body;

    // Validate required
    if (!course_code || !name) {
      return ApiResponse.badRequest(res, 'Vui lòng nhập đầy đủ thông tin bắt buộc');
    }

    // Check course_code exists
    const existing = await queryOne('SELECT id FROM courses WHERE course_code = ?', [course_code]);
    if (existing) {
      return ApiResponse.badRequest(res, 'Mã môn học đã tồn tại');
    }

    const courseData = {
      course_code,
      name,
      credits: credits || 3,
      department_id: department_id || null,
      major_id: major_id || null,
      class_id: class_id || null,
      instructor_id: instructor_id || null,
      description: description || null,
      max_students: max_students || 150,
      semester: semester || null,
      type: type || 'Bắt buộc',
      current_students: 0,
      status: 'Đang mở'
    };

    const keys = Object.keys(courseData);
    const values = Object.values(courseData);
    const placeholders = keys.map(() => '?').join(', ');
    const insertQuery = `INSERT INTO courses (${keys.join(', ')}) VALUES (${placeholders})`;

    const result = await insert(insertQuery, values);
    
    return ApiResponse.created(res, { id: result.insertId, ...courseData }, 'Thêm môn học thành công');
  } catch (error) {
    console.error('Lỗi khi thêm môn học:', error);
    return ApiResponse.error(res, 'Lỗi server khi thêm môn học');
  }
};

// @desc    Update course
// @route   PUT /api/admin/courses/:id
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;

    const existing = await queryOne('SELECT id FROM courses WHERE id = ?', [id]);
    if (!existing) {
      return ApiResponse.notFound(res, 'Không tìm thấy môn học');
    }

    if (updateData.course_code) {
      const existingCode = await queryOne('SELECT id FROM courses WHERE course_code = ? AND id != ?', [updateData.course_code, id]);
      if (existingCode) {
        return ApiResponse.badRequest(res, 'Mã môn học đã tồn tại');
      }
    }

    let updateQuery = 'UPDATE courses SET ';
    const updateParams = [];
    const updateFields = [];

    for (const [key, value] of Object.entries(updateData)) {
      updateFields.push(`${key} = ?`);
      updateParams.push(value === '' ? null : value);
    }

    if (updateFields.length === 0) {
      return ApiResponse.badRequest(res, 'Không có dữ liệu để cập nhật');
    }

    updateQuery += updateFields.join(', ') + ' WHERE id = ?';
    updateParams.push(id);

    await query(updateQuery, updateParams);
    
    return ApiResponse.success(res, { id, ...updateData }, 'Cập nhật môn học thành công');
  } catch (error) {
    console.error('Lỗi khi cập nhật môn học:', error);
    return ApiResponse.error(res, 'Lỗi server khi cập nhật môn học');
  }
};

// @desc    Delete course
// @route   DELETE /api/admin/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await queryOne('SELECT id FROM courses WHERE id = ?', [id]);
    if (!existing) {
      return ApiResponse.notFound(res, 'Không tìm thấy môn học');
    }

    // Check constraints: existing grades or schedules or registrations
    const hasSchedules = await queryOne('SELECT id FROM schedules WHERE course_id = ? LIMIT 1', [id]);
    if (hasSchedules) return ApiResponse.badRequest(res, 'Không thể xóa: Môn học đã được xếp thời khóa biểu (lớp học phần).');

    const hasGrades = await queryOne('SELECT id FROM grades WHERE course_id = ? LIMIT 1', [id]);
    if (hasGrades) return ApiResponse.badRequest(res, 'Không thể xóa: Môn học đã có bảng điểm liên quan.');

    const hasRegistrations = await queryOne('SELECT id FROM registrations WHERE course_id = ? LIMIT 1', [id]);
    if (hasRegistrations) return ApiResponse.badRequest(res, 'Không thể xóa: Đã có sinh viên đăng ký môn học này.');

    await query('DELETE FROM courses WHERE id = ?', [id]);
    
    return ApiResponse.success(res, null, 'Xóa môn học thành công');
  } catch (error) {
    console.error('Lỗi khi xóa môn học:', error);
    return ApiResponse.error(res, 'Lỗi server khi xóa môn học');
  }
};
