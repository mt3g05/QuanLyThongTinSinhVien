// frontend/lib/services/adminService.js
import apiClient from '../api';

// ===== Dashboard =====
export var dashboardService = {
  getStats: function () {
    return apiClient.get('/admin/dashboard/stats');
  },
  getRecentStudents: function () {
    return apiClient.get('/admin/dashboard/recent-students');
  },
  getEvents: function () {
    return apiClient.get('/admin/dashboard/events');
  },
  getDistribution: function () {
    return apiClient.get('/admin/dashboard/distribution');
  },
  getPendingRequests: function () {
    return apiClient.get('/admin/dashboard/pending-requests');
  },
};

// ===== Students =====
export var adminStudentService = {
  getAll: function (params) {
    return apiClient.get('/admin/students', params || {});
  },
  getById: function (id) {
    return apiClient.get('/admin/students/' + id);
  },
  create: function (data) {
    return apiClient.post('/admin/students', data);
  },
  update: function (id, data) {
    return apiClient.put('/admin/students/' + id, data);
  },
  delete: function (id) {
    return apiClient.delete('/admin/students/' + id);
  },
  importExcel: function (formData) {
    return apiClient.postFormData('/admin/students/import', formData);
  },
  approve: function (id) {
    return apiClient.put('/admin/students/' + id + '/approve');
  },
  approveAll: function () {
    return apiClient.post('/admin/students/approve-all');
  },
};

// ===== Instructors =====
export var instructorService = {
  getAll: function (params) {
    return apiClient.get('/admin/instructors', params || {});
  },
  getById: function (id) {
    return apiClient.get('/admin/instructors/' + id);
  },
  getStats: function () {
    return apiClient.get('/admin/instructors/stats');
  },
  getTopRated: function () {
    return apiClient.get('/admin/instructors/top-rated');
  },
  create: function (data) {
    return apiClient.post('/admin/instructors', data);
  },
  update: function (id, data) {
    return apiClient.put('/admin/instructors/' + id, data);
  },
  delete: function (id) {
    return apiClient.delete('/admin/instructors/' + id);
  },
};


// ===== Classes =====
export var classService = {
  getAll: function (params) {
    return apiClient.get('/admin/classes', params || {});
  },
  getById: function (id) {
    return apiClient.get('/admin/classes/' + id);
  },
  getStudents: function (id, params) {
    return apiClient.get('/admin/classes/' + id + '/students', params || {});
  },
  getStats: function () {
    return apiClient.get('/admin/classes/stats');
  },
  create: function (data) {
    return apiClient.post('/admin/classes', data);
  },
  update: function (id, data) {
    return apiClient.put('/admin/classes/' + id, data);
  },
  delete: function (id) {
    return apiClient.delete('/admin/classes/' + id);
  },
};

// ===== Grades =====
export var adminGradeService = {
  getFormOptions: function () {
    return apiClient.get('/admin/grades/options/form-data');
  },
  getAll: function (params) {
    return apiClient.get('/admin/grades', params || {});
  },
  getById: function (id) {
    return apiClient.get('/admin/grades/' + id);
  },
  getStats: function () {
    return apiClient.get('/admin/grades/stats');
  },
  getDistribution: function () {
    return apiClient.get('/admin/grades/distribution');
  },
  getGPATrends: function () {
    return apiClient.get('/admin/grades/gpa-trends');
  },
  create: function (data) {
    return apiClient.post('/admin/grades', data);
  },
  update: function (id, data) {
    return apiClient.put('/admin/grades/' + id, data);
  },
  approve: function (id) {
    return apiClient.put('/admin/grades/' + id + '/approve');
  },
  reject: function (id) {
    return apiClient.put('/admin/grades/' + id + '/reject');
  },
  delete: function (id) {
    return apiClient.delete('/admin/grades/' + id);
  },
  approveAll: function (data) {
    return apiClient.put('/admin/grades/approve-all', data);
  },
  importGrades: function (formData) {
    return apiClient.postFormData('/admin/grades/import', formData);
  }
};

// ===== Reports =====
export var reportService = {
  getOverview: function () {
    return apiClient.get('/admin/reports/overview');
  },
  getEnrollmentTrends: function () {
    return apiClient.get('/admin/reports/enrollment-trends');
  },
  getAcademicRanking: function () {
    return apiClient.get('/admin/reports/academic-ranking');
  },
  getGPAByDepartment: function (params) {
    return apiClient.get('/admin/reports/gpa-by-department', params || {});
  },
  getGraduationRate: function () {
    return apiClient.get('/admin/reports/graduation-rate');
  },
  getTopDepartments: function () {
    return apiClient.get('/admin/reports/top-departments');
  },
  getGenderDistribution: function () {
    return apiClient.get('/admin/reports/gender-distribution');
  },
  getDepartmentDetails: function () {
    return apiClient.get('/admin/reports/department-details');
  },
};

// ===== Settings =====
export var settingService = {
  getAll: function () {
    return apiClient.get('/admin/settings');
  },
  updateGeneral: function (data) {
    return apiClient.put('/admin/settings/general', data);
  },
  updateProfile: function (data) {
    return apiClient.put('/admin/settings/profile', data);
  },
  changePassword: function (data) {
    return apiClient.put('/admin/settings/password', data);
  },
  updateNotifications: function (data) {
    return apiClient.put('/admin/settings/notifications', data);
  },
  getSystemStatus: function () {
    return apiClient.get('/admin/settings/system-status');
  },
  getSessions: function () {
    return apiClient.get('/admin/settings/sessions');
  },
  revokeSession: function (id) {
    return apiClient.delete('/admin/settings/sessions/' + id);
  },
  backupDatabase: function () {
    return apiClient.post('/admin/settings/database/backup');
  },
};

// ===== Tuitions =====
export var adminTuitionService = {
  getAll: function (params) {
    return apiClient.get('/admin/tuitions', params || {});
  },
  getStats: function (params) {
    return apiClient.get('/admin/tuitions/stats', params || {});
  },
  updateStatus: function (id, data) {
    return apiClient.put('/admin/tuitions/' + id + '/status', data);
  },
};

// ===== Notifications =====
export var adminNotificationService = {
  getAll: function (params) {
    return apiClient.get('/admin/notifications', params || {});
  },
  create: function (data) {
    return apiClient.post('/admin/notifications', data);
  },
  update: function (id, data) {
    return apiClient.put('/admin/notifications/' + id, data);
  },
  delete: function (id) {
    return apiClient.delete('/admin/notifications/' + id);
  },
  getStats: function () {
    return apiClient.get('/admin/notifications/stats');
  },
};

// ===== Events =====
export var adminEventService = {
  getAll: function (params) {
    return apiClient.get('/admin/events', params || {});
  },
  create: function (data) {
    return apiClient.post('/admin/events', data);
  },
  update: function (id, data) {
    return apiClient.put('/admin/events/' + id, data);
  },
  delete: function (id) {
    return apiClient.delete('/admin/events/' + id);
  },
};

// ===== Cohorts (Khóa học) =====
export var cohortService = {
  getAll: function (params) {
    return apiClient.get('/admin/cohorts', params || {});
  },
  getById: function (id) {
    return apiClient.get('/admin/cohorts/' + id);
  },
  create: function (data) {
    return apiClient.post('/admin/cohorts', data);
  },
  update: function (id, data) {
    return apiClient.put('/admin/cohorts/' + id, data);
  },
  delete: function (id) {
    return apiClient.delete('/admin/cohorts/' + id);
  },
};

// ===== Departments =====
export var adminDepartmentService = {
  getAll: function () {
    return apiClient.get('/admin/departments');
  },
  create: function (data) {
    return apiClient.post('/admin/departments', data);
  },
  update: function (id, data) {
    return apiClient.put('/admin/departments/' + id, data);
  },
  delete: function (id) {
    return apiClient.delete('/admin/departments/' + id);
  },
};

// ===== Majors =====
export var adminMajorService = {
  getAll: function () {
    return apiClient.get('/admin/majors');
  },
  create: function (data) {
    return apiClient.post('/admin/majors', data);
  },
  update: function (id, data) {
    return apiClient.put('/admin/majors/' + id, data);
  },
  delete: function (id) {
    return apiClient.delete('/admin/majors/' + id);
  },
};
