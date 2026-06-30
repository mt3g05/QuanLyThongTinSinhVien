// src/controllers/admin/tuitionController.js
const { query, queryOne, insert } = require('../../config/database');
const ApiResponse = require('../../utils/apiResponse');
const { getPagination, getPagingData } = require('../../utils/pagination');

// @desc    Get all tuitions with pagination, search, filter
// @route   GET /api/admin/tuitions
const getAllTuitions = async (req, res) => {
  try {
    const { page, limit, search, status, semester, cohort_id } = req.query;
    const { currentPage, pageSize, offset } = getPagination(page, limit);

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (s.full_name LIKE ? OR s.student_code LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (status && status !== 'all') {
      whereClause += ' AND t.status = ?';
      params.push(status);
    }

    if (semester && semester !== 'all') {
      whereClause += ' AND t.semester = ?';
      params.push(semester);
    }

    if (cohort_id && cohort_id !== 'all') {
      whereClause += ' AND s.cohort_id = ?';
      params.push(cohort_id);
    }

    // Count total
    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM tuitions t LEFT JOIN students s ON t.student_id = s.id ${whereClause}`,
      params
    );

    // Get tuitions with student info
    const tuitions = await query(
      `SELECT t.*, s.student_code, s.full_name, c.name as class_name
       FROM tuitions t
       LEFT JOIN students s ON t.student_id = s.id
       LEFT JOIN classes c ON s.class_id = c.id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const pagination = getPagingData(countResult.total, currentPage, pageSize);
    return ApiResponse.paginated(res, tuitions, pagination);
  } catch (error) {
    console.error('Get all tuitions error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy danh sách học phí');
  }
};

// @desc    Get tuition statistics
// @route   GET /api/admin/tuitions/stats
const getTuitionStats = async (req, res) => {
  try {
    const { semester } = req.query;
    let whereClause = 'WHERE 1=1';
    let params = [];

    if (semester && semester !== 'all') {
      whereClause += ' AND semester = ?';
      params.push(semester);
    }

    const stats = await queryOne(
      `SELECT 
        COUNT(*) as total_records,
        COALESCE(SUM(total_amount), 0) as expected_amount,
        COALESCE(SUM(paid_amount), 0) as collected_amount,
        COALESCE(SUM(remaining), 0) as unpaid_amount,
        SUM(CASE WHEN status = 'Đã thanh toán' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status = 'Chưa thanh toán' THEN 1 ELSE 0 END) as unpaid_count
       FROM tuitions
       ${whereClause}`,
      params
    );

    return ApiResponse.success(res, stats);
  } catch (error) {
    console.error('Tuition stats error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy thống kê học phí');
  }
};

// @desc    Update tuition status
// @route   PUT /api/admin/tuitions/:id/status
const updateTuitionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_method } = req.body;

    const tuition = await queryOne('SELECT * FROM tuitions WHERE id = ?', [id]);
    if (!tuition) {
      return ApiResponse.notFound(res, 'Không tìm thấy hóa đơn học phí');
    }

    if (!status) {
      return ApiResponse.badRequest(res, 'Vui lòng cung cấp trạng thái');
    }

    let paid_amount = tuition.paid_amount;
    let remaining = tuition.remaining;
    let payment_date = tuition.payment_date;

    if (status === 'Đã thanh toán') {
      paid_amount = tuition.total_amount - tuition.discount;
      remaining = 0;
      payment_date = new Date();
    } else if (status === 'Chưa thanh toán') {
      paid_amount = 0;
      remaining = tuition.total_amount - tuition.discount;
      payment_date = null;
    }

    await insert(
      `UPDATE tuitions SET 
        status = ?, 
        payment_method = ?, 
        paid_amount = ?, 
        remaining = ?, 
        payment_date = ? 
       WHERE id = ?`,
      [status, payment_method || tuition.payment_method, paid_amount, remaining, payment_date, id]
    );

    return ApiResponse.success(res, null, 'Cập nhật trạng thái học phí thành công');
  } catch (error) {
    console.error('Update tuition error:', error);
    return ApiResponse.error(res, 'Lỗi khi cập nhật trạng thái học phí');
  }
};

// @desc    Create tuition invoice
// @route   POST /api/admin/tuitions
const createTuitionInvoice = async (req, res) => {
  try {
    const { student_id, semester, total_credits, credit_fee } = req.body;

    if (!student_id || !semester || total_credits === undefined || total_credits === null || credit_fee === undefined || credit_fee === null) {
      return ApiResponse.badRequest(res, 'Vui lòng cung cấp đầy đủ thông tin hóa đơn');
    }

    // Check if tuition already exists
    const existing = await queryOne(
      'SELECT id FROM tuitions WHERE student_id = ? AND semester = ?',
      [student_id, semester]
    );
    if (existing) {
      return ApiResponse.badRequest(res, 'Sinh viên đã có hóa đơn học phí trong học kỳ này');
    }

    const total_amount = total_credits * credit_fee;

    const result = await insert(
      `INSERT INTO tuitions (student_id, semester, total_credits, credit_fee, total_amount, remaining, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'Chưa thanh toán')`,
      [student_id, semester, total_credits, credit_fee, total_amount, total_amount]
    );

    return ApiResponse.created(res, { id: result.insertId }, 'Tạo hóa đơn học phí thành công');
  } catch (error) {
    console.error('Create tuition invoice error:', error);
    return ApiResponse.error(res, 'Lỗi khi tạo hóa đơn học phí');
  }
};

// @desc    Get total registered credits for a student
// @route   GET /api/admin/tuitions/registered-credits/:studentId
const getRegisteredCredits = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const { semester } = req.query;

    // Semester is passed from client but we no longer filter by it
    // if (!semester) {
    //   return ApiResponse.badRequest(res, 'Vui lòng cung cấp học kỳ (semester)');
    // }

    const result = await query(
      `SELECT SUM(c.credits) as total_credits
       FROM registrations r
       JOIN courses c ON r.course_id = c.id
       WHERE r.student_id = ? AND r.status != 'Đã hủy'`,
      [studentId]
    );

    const totalCredits = result[0].total_credits || 0;

    return ApiResponse.success(res, { total_credits: totalCredits });
  } catch (error) {
    console.error('Get registered credits error:', error);
    return ApiResponse.error(res, 'Lỗi khi tính tổng số tín chỉ đăng ký');
  }
};

// @desc    Delete tuition invoice
// @route   DELETE /api/admin/tuitions/:id
const deleteTuitionInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await queryOne('SELECT id FROM tuitions WHERE id = ?', [id]);
    if (!existing) {
      return ApiResponse.notFound(res, 'Không tìm thấy hóa đơn học phí');
    }

    await query('DELETE FROM tuitions WHERE id = ?', [id]);
    
    return ApiResponse.success(res, null, 'Xóa hóa đơn thành công');
  } catch (error) {
    console.error('Delete tuition invoice error:', error);
    return ApiResponse.error(res, 'Lỗi khi xóa hóa đơn học phí');
  }
};

module.exports = {
  getAllTuitions,
  getTuitionStats,
  updateTuitionStatus,
  createTuitionInvoice,
  getRegisteredCredits,
  deleteTuitionInvoice
};
