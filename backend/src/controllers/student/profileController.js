// src/controllers/student/profileController.js
const { query, queryOne, insert } = require('../../config/database');
const ApiResponse = require('../../utils/apiResponse');
const { getAcademicClassification } = require('../../utils/helpers');
// [FIX BUG-023] Import fs và path để xóa avatar cũ
const fs = require('fs');
const path = require('path');

// Helper
const getStudentId = async (userId) => {
  const student = await queryOne('SELECT id FROM students WHERE user_id = ?', [userId]);
  return student ? student.id : null;
};

// @desc    Get full student profile
// @route   GET /api/student/profile
const getProfile = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông tin sinh viên');
    }

    const student = await queryOne(
      `SELECT s.*,
              d.name as department_name, d.code as department_code,
              m.name as major_name, m.code as major_code, m.total_credits as required_credits,
              c.class_code, c.name as class_name,
              ch.start_year, ch.end_year
       FROM students s
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN majors m ON s.major_id = m.id
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN cohorts ch ON s.cohort_id = ch.id
       WHERE s.id = ?`,
      [studentId]
    );

    // Remove sensitive fields
    delete student.user_id;

    // Add classification
    student.classification = getAcademicClassification(student.gpa);
    
    // Set academic year based on cohort
    student.academic_year = (student.start_year && student.end_year) 
        ? `${student.start_year}-${student.end_year}` 
        : null;

    return ApiResponse.success(res, student);
  } catch (error) {
    console.error('Get profile error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy thông tin cá nhân');
  }
};

// @desc    Update personal info
// @route   PUT /api/student/profile/personal
const updatePersonal = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông tin sinh viên');
    }

    const { date_of_birth, gender, ethnicity, religion, id_number, id_issue_date, id_issue_place } = req.body;

    const allowedFields = {
      date_of_birth, gender, ethnicity, religion,
      id_number, id_issue_date, id_issue_place
    };

    const updates = [];
    const values = [];

    for (const [field, value] of Object.entries(allowedFields)) {
      if (value !== undefined) {
        updates.push(`${field} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return ApiResponse.badRequest(res, 'Không có dữ liệu để cập nhật');
    }

    values.push(studentId);
    await insert(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`, values);

    return ApiResponse.success(res, null, 'Cập nhật thông tin cá nhân thành công');
  } catch (error) {
    console.error('Update personal error:', error);
    return ApiResponse.error(res, 'Lỗi khi cập nhật thông tin cá nhân');
  }
};

// @desc    Update contact info
// @route   PUT /api/student/profile/contact
const updateContact = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông tin sinh viên');
    }

    const { personal_email, phone, permanent_address, current_address } = req.body;

    const allowedFields = { personal_email, phone, permanent_address, current_address };

    const updates = [];
    const values = [];

    for (const [field, value] of Object.entries(allowedFields)) {
      if (value !== undefined) {
        updates.push(`${field} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return ApiResponse.badRequest(res, 'Không có dữ liệu để cập nhật');
    }

    values.push(studentId);
    await insert(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`, values);

    return ApiResponse.success(res, null, 'Cập nhật thông tin liên hệ thành công');
  } catch (error) {
    console.error('Update contact error:', error);
    return ApiResponse.error(res, 'Lỗi khi cập nhật thông tin liên hệ');
  }
};

// @desc    Update family info
// @route   PUT /api/student/profile/family
const updateFamily = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông tin sinh viên');
    }

    const {
      father_name, father_phone, father_occupation,
      mother_name, mother_phone, mother_occupation
    } = req.body;

    const allowedFields = {
      father_name, father_phone, father_occupation,
      mother_name, mother_phone, mother_occupation
    };

    const updates = [];
    const values = [];

    for (const [field, value] of Object.entries(allowedFields)) {
      if (value !== undefined) {
        updates.push(`${field} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return ApiResponse.badRequest(res, 'Không có dữ liệu để cập nhật');
    }

    values.push(studentId);
    await insert(`UPDATE students SET ${updates.join(', ')} WHERE id = ?`, values);

    return ApiResponse.success(res, null, 'Cập nhật thông tin gia đình thành công');
  } catch (error) {
    console.error('Update family error:', error);
    return ApiResponse.error(res, 'Lỗi khi cập nhật thông tin gia đình');
  }
};

// @desc    Update avatar
// @route   PUT /api/student/profile/avatar
const updateAvatar = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.id);
    if (!studentId) {
      return ApiResponse.notFound(res, 'Không tìm thấy thông tin sinh viên');
    }

    if (!req.file) {
      return ApiResponse.badRequest(res, 'Vui lòng chọn ảnh');
    }

    // [FIX BUG-023] Lấy avatar cũ để xóa sau khi cập nhật
    const oldStudent = await queryOne('SELECT avatar FROM students WHERE id = ?', [studentId]);

    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    await insert('UPDATE students SET avatar = ? WHERE id = ?', [avatarPath, studentId]);

    // [FIX BUG-023] Xóa file avatar cũ để tránh rò rỉ storage
    if (oldStudent?.avatar && !oldStudent.avatar.includes('default')) {
      const oldFilePath = path.join(__dirname, '../../../', oldStudent.avatar);
      if (fs.existsSync(oldFilePath)) {
        try { fs.unlinkSync(oldFilePath); } catch { /* bỏ qua nếu xóa thất bại */ }
      }
    }

    return ApiResponse.success(res, { avatar: avatarPath }, 'Cập nhật ảnh đại diện thành công');
  } catch (error) {
    console.error('Update avatar error:', error);
    return ApiResponse.error(res, 'Lỗi khi cập nhật ảnh đại diện');
  }
};

module.exports = {
  getProfile,
  updatePersonal,
  updateContact,
  updateFamily,
  updateAvatar
};