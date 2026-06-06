// src/routes/admin/index.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(authorize('admin'));

// Sub-routes
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/students', require('./studentRoutes'));
router.use('/instructors', require('./instructorRoutes'));
router.use('/classes', require('./classRoutes'));
router.use('/courses', require('./courseRoutes'));
router.use('/grades', require('./gradeRoutes'));
// router.use('/reports', require('./reportRoutes'));
router.use('/settings', require('./settingRoutes'));
router.use('/tuitions', require('./tuitionRoutes'));
router.use('/notifications', require('./notificationRoutes'));
// router.use('/events', require('./eventRoutes'));
router.use('/departments', require('./departmentRoutes'));
router.use('/majors', require('./majorRoutes'));
router.use('/cohorts', require('./cohortRoutes'));

module.exports = router;