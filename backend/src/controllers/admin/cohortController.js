const { query, queryOne, insert } = require('../../config/database');
const ApiResponse = require('../../utils/apiResponse');

// @desc    Get all cohorts
// @route   GET /api/admin/cohorts
const getAllCohorts = async (req, res) => {
  try {
    const cohorts = await query('SELECT * FROM cohorts ORDER BY code DESC');
    return ApiResponse.success(res, cohorts);
  } catch (error) {
    console.error('Get all cohorts error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy danh sách khóa học');
  }
};

// @desc    Get cohort by ID
// @route   GET /api/admin/cohorts/:id
const getCohortById = async (req, res) => {
  try {
    const { id } = req.params;
    const cohort = await queryOne('SELECT * FROM cohorts WHERE id = ?', [id]);
    
    if (!cohort) {
      return ApiResponse.notFound(res, 'Không tìm thấy khóa học');
    }
    
    return ApiResponse.success(res, cohort);
  } catch (error) {
    console.error('Get cohort by ID error:', error);
    return ApiResponse.error(res, 'Lỗi khi lấy thông tin khóa học');
  }
};

// @desc    Create new cohort
// @route   POST /api/admin/cohorts
const createCohort = async (req, res) => {
  try {
    const { code, name, start_year, end_year } = req.body;
    
    if (!code || !name) {
      return ApiResponse.badRequest(res, 'Vui lòng nhập mã khóa và tên khóa');
    }
    
    const existing = await queryOne('SELECT id FROM cohorts WHERE code = ?', [code]);
    if (existing) {
      return ApiResponse.badRequest(res, 'Mã khóa đã tồn tại');
    }
    
    const result = await insert(
      'INSERT INTO cohorts (code, name, start_year, end_year) VALUES (?, ?, ?, ?)',
      [code, name, start_year || null, end_year || null]
    );
    
    return ApiResponse.success(res, { id: result.insertId }, 'Thêm khóa học thành công', 201);
  } catch (error) {
    console.error('Create cohort error:', error);
    return ApiResponse.error(res, 'Lỗi khi thêm khóa học mới');
  }
};

// @desc    Update cohort
// @route   PUT /api/admin/cohorts/:id
const updateCohort = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, start_year, end_year } = req.body;
    
    if (!code || !name) {
      return ApiResponse.badRequest(res, 'Vui lòng nhập mã khóa và tên khóa');
    }
    
    const existing = await queryOne('SELECT id FROM cohorts WHERE code = ? AND id != ?', [code, id]);
    if (existing) {
      return ApiResponse.badRequest(res, 'Mã khóa đã tồn tại cho một khóa học khác');
    }
    
    await query(
      'UPDATE cohorts SET code = ?, name = ?, start_year = ?, end_year = ? WHERE id = ?',
      [code, name, start_year || null, end_year || null, id]
    );
    
    return ApiResponse.success(res, null, 'Cập nhật khóa học thành công');
  } catch (error) {
    console.error('Update cohort error:', error);
    return ApiResponse.error(res, 'Lỗi khi cập nhật khóa học');
  }
};

// @desc    Delete cohort
// @route   DELETE /api/admin/cohorts/:id
const deleteCohort = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if cohort has students
    const checkStudents = await queryOne('SELECT id FROM students WHERE cohort_id = ? LIMIT 1', [id]);
    if (checkStudents) {
      return ApiResponse.badRequest(res, 'Không thể xóa khóa học vì có sinh viên đang thuộc khóa này');
    }
    
    await query('DELETE FROM cohorts WHERE id = ?', [id]);
    return ApiResponse.success(res, null, 'Xóa khóa học thành công');
  } catch (error) {
    console.error('Delete cohort error:', error);
    return ApiResponse.error(res, 'Lỗi khi xóa khóa học');
  }
};

module.exports = {
  getAllCohorts,
  getCohortById,
  createCohort,
  updateCohort,
  deleteCohort
};
