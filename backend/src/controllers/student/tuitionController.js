// src/controllers/student/tuitionController.js
const { query, queryOne, insert } = require('../../config/database');
const ApiResponse = require('../../utils/apiResponse');

// Helper
const getStudentId = async (userId) => {
  const student = await queryOne('SELECT id FROM students WHERE user_id = ?', [userId]);
  return student ? student.id : null;
};

// @desc    Get current tuition info
// @route   GET /api/student/tuition/current
const getCurrentTuition = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông tin sinh viên');
    }

    const tuition = await queryOne(
      `SELECT * FROM tuitions 
       WHERE student_id = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [studentId]
    );

    if (!tuition) {
      return ApiResponse.success(res, {
        message: 'Chưa có thông tin học phí'
      });
    }

    return ApiResponse.success(res, {
      semester: tuition.semester,
      deadline: tuition.deadline,
      status: tuition.status,
      details: {
        totalCredits: tuition.total_credits,
        creditFee: tuition.credit_fee,
        totalAmount: tuition.total_amount,
        discount: tuition.discount,
        paidAmount: tuition.paid_amount,
        remaining: tuition.remaining
      },
      payment: {
        method: tuition.payment_method,
        date: tuition.payment_date
      }
    });
  } catch (error) {
    console.error('Current tuition error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy thông tin học phí');
  }
};

// @desc    Get tuition payment history
// @route   GET /api/student/tuition/history
const getTuitionHistory = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông tin sinh viên');
    }

    const history = await query(
      `SELECT * FROM tuitions 
       WHERE student_id = ? 
       ORDER BY created_at DESC`,
      [studentId]
    );

    return ApiResponse.success(res, history);
  } catch (error) {
    console.error('Tuition history error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy lịch sử thanh toán');
  }
};

// @desc    Get payment methods
// @route   GET /api/student/tuition/payment-methods
const getPaymentMethods = async (req, res) => {
  try {
    const methods = [
      {
        id: 'bank_transfer',
        name: 'Chuyển khoản ngân hàng',
        description: 'Vietcombank, BIDV, Techcombank...',
        icon: 'bank'
      },
      {
        id: 'momo',
        name: 'Ví MoMo',
        description: 'Thanh toán qua ví điện tử MoMo',
        icon: 'wallet'
      },
      {
        id: 'vnpay',
        name: 'VNPay',
        description: 'Thanh toán qua cổng VNPay',
        icon: 'credit-card'
      },
      {
        id: 'direct',
        name: 'Nộp trực tiếp',
        description: 'Tại phòng Tài chính - Kế toán',
        icon: 'building'
      }
    ];

    return ApiResponse.success(res, methods);
  } catch (error) {
    return ApiResponse.error(res, 'Lỗi khi lấy phương thức thanh toán');
  }
};

// @desc    Get bank transfer info
// @route   GET /api/student/tuition/bank-info
const getBankInfo = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    const student = await queryOne(
      'SELECT student_code, full_name FROM students WHERE id = ?',
      [studentId]
    );

    // [LOW TASK-14] TODO: Lấy thông tin tài khoản ngân hàng từ bảng settings
    return ApiResponse.success(res, {
      bankName: 'Vietcombank - Chi nhánh Hà Nội',
      accountNumber: '1234567890123',
      accountHolder: 'Học viện Công nghệ BCVT',
      content: `${student.student_code} ${student.full_name} nop hoc phi`,
      note: 'Vui lòng ghi đúng nội dung chuyển khoản để được xác nhận tự động'
    });
  } catch (error) {
    return ApiResponse.error(res, 'Lỗi khi lấy thông tin chuyển khoản');
  }
};

// @desc    Process payment (simplified - marks as paid)
// @route   POST /api/student/tuition/pay
const processPayment = async (req, res) => {
  try {
    const { tuition_id, payment_method } = req.body;
    const studentId = await getStudentId(req.user.id);

    if (!studentId) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông tin sinh viên');
    }

    if (!tuition_id || !payment_method) {
      return ApiResponse.badRequest(res, 'Thiếu thông tin thanh toán');
    }

    const tuition = await queryOne(
      'SELECT * FROM tuitions WHERE id = ? AND student_id = ?',
      [tuition_id, studentId]
    );

    if (!tuition) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông tin học phí');
    }

    if (tuition.status === 'Đã thanh toán') {
      return ApiResponse.badRequest(res, 'Học phí đã được thanh toán');
    }

    await insert(
      `UPDATE tuitions SET 
        status = 'Chờ xác nhận',
        payment_method = ?,
        payment_date = NOW()
       WHERE id = ?`,
      [payment_method, tuition_id]
    );

    return ApiResponse.success(res, null, 'Đã gửi xác nhận thanh toán. Vui lòng chờ nhà trường duyệt.');
  } catch (error) {
    console.error('Process payment error:', error);
    return ApiResponse.error(res, 'Lỗi khi thanh toán');
  }
};

// @desc    Get receipt for a semester
// @route   GET /api/student/tuition/receipt/:id
const getReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = await getStudentId(req.user.id);

    const tuition = await queryOne(
      `SELECT t.*, s.student_code, s.full_name, s.email,
              d.name as department_name, m.name as major_name
       FROM tuitions t
       LEFT JOIN students s ON t.student_id = s.id
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN majors m ON s.major_id = m.id
       WHERE t.id = ? AND t.student_id = ? AND t.status = 'Đã thanh toán'`,
      [id, studentId]
    );

    if (!tuition) {
      return ApiResponse.notFound(res, 'Không tìm thấy biên lai');
    }

    return ApiResponse.success(res, {
      receiptNumber: `BL-${tuition.id.toString().padStart(6, '0')}`,
      studentCode: tuition.student_code,
      studentName: tuition.full_name,
      department: tuition.department_name,
      major: tuition.major_name,
      semester: tuition.semester,
      amount: tuition.total_amount,
      discount: tuition.discount,
      paidAmount: tuition.paid_amount,
      paymentMethod: tuition.payment_method,
      paymentDate: tuition.payment_date,
      issuedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get receipt error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy biên lai');
  }
};

// @desc    Get tuition details for a specific semester
// @route   GET /api/student/tuition/semester/:semesterCode
const getTuitionDetailsBySemester = async (req, res) => {
  try {
    const { semesterCode } = req.params;
    const studentId = await getStudentId(req.user.id);
    if (!studentId) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông tin sinh viên');
    }

    // Get tuition summary
    const tuition = await queryOne(
      'SELECT * FROM tuitions WHERE student_id = ? AND semester = ?',
      [studentId, semesterCode]
    );

    if (!tuition) {
       return ApiResponse.success(res, { tuition: null, courses: [] });
    }

    // Get courses from grades
    const courses = await query(
      `SELECT c.course_code, c.name as course_name, c.credits, 
              (c.credits * ?) as amount, 
              0 as discount, 
              (c.credits * ?) as final_amount
       FROM grades g
       JOIN courses c ON g.course_id = c.id
       WHERE g.student_id = ? AND g.semester = ?`,
      [tuition.credit_fee, tuition.credit_fee, studentId, semesterCode]
    );

    return ApiResponse.success(res, {
      tuition: tuition,
      courses: courses
    });

  } catch (error) {
    console.error('Tuition details error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy chi tiết học phí');
  }
};

module.exports = {
  getTuitionDetailsBySemester,
  getCurrentTuition,
  getTuitionHistory,
  getPaymentMethods,
  getBankInfo,
  processPayment,
  getReceipt
};