// src/utils/constants.js

module.exports = {
  ROLES: {
    ADMIN: 'admin',
    STUDENT: 'student',
    INSTRUCTOR: 'instructor'
  },

  // Student status
  STUDENT_STATUS: {
    ACTIVE: 'Đang học',
    PENDING: 'Chờ duyệt',
    SUSPENDED: 'Bảo lưu',
    TEMPORARY_LEAVE: 'Tạm nghỉ',
    GRADUATED: 'Đã tốt nghiệp',
    EXPELLED: 'Bị đuổi'
  },

  // Instructor status
  INSTRUCTOR_STATUS: {
    ACTIVE: 'Đang dạy',
    ON_LEAVE: 'Nghỉ phép',
    RETIRED: 'Đã nghỉ'
  },

  // Course types
  COURSE_TYPE: {
    REQUIRED: 'Bắt buộc',
    ELECTIVE: 'Tự chọn',
    PE_MILITARY: 'Thể chất/QP'
  },

  // Course status
  COURSE_STATUS: {
    OPEN: 'Đang mở',
    CLOSED: 'Đã đóng'
  },

  // Grade status
  GRADE_STATUS: {
    APPROVED: 'Đã duyệt',
    PENDING: 'Chờ duyệt',
    REJECTED: 'Từ chối'
  },

  // Tuition status
  TUITION_STATUS: {
    UNPAID: 'Chưa thanh toán',
    PAID: 'Đã thanh toán',
    PARTIAL: 'Thanh toán một phần'
  },

  // Notification types
  NOTIFICATION_TYPE: {
    GENERAL: 'Thông báo chung',
    REGISTRATION: 'Đăng ký học',
    TUITION: 'Học phí',
    GRADE: 'Điểm số',
    EVENT: 'Sự kiện'
  },

  // Notification priority
  NOTIFICATION_PRIORITY: {
    IMPORTANT: 'Quan trọng',
    NOTICE: 'Lưu ý',
    NORMAL: 'Thường'
  },

  // Grade scale
  GRADE_SCALE: [
    { min: 9.0, max: 10, letter: 'A+', gpa: 4.0 },
    { min: 8.5, max: 8.9, letter: 'A', gpa: 3.7 },
    { min: 8.0, max: 8.4, letter: 'B+', gpa: 3.5 },
    { min: 7.0, max: 7.9, letter: 'B', gpa: 3.0 },
    { min: 6.5, max: 6.9, letter: 'C+', gpa: 2.5 },
    { min: 6.0, max: 6.4, letter: 'C', gpa: 2.0 },
    { min: 5.5, max: 5.9, letter: 'D+', gpa: 1.5 },
    { min: 5.0, max: 5.4, letter: 'D', gpa: 1.0 },
    { min: 0, max: 4.9, letter: 'F', gpa: 0 }
  ],

  // Schedule periods
  PERIODS: {
    1: { start: '07:00', end: '09:35' },
    2: { start: '09:45', end: '12:20' },
    3: { start: '12:30', end: '15:05' },
    4: { start: '15:15', end: '17:50' }
  },

  // Days of week
  DAYS_OF_WEEK: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']
};