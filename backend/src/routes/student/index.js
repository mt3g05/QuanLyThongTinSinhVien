// src/routes/student/index.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../middleware/auth');

// All student routes require authentication + student role
router.use(authenticate);
router.use(authorize('student'));

// Sub-routes
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/profile', require('./profileRoutes'));
router.use('/grades', require('./gradeRoutes'));
router.use('/courses', require('./courseRoutes'));
router.use('/tuition', require('./tuitionRoutes'));
router.use('/notifications', require('./notificationRoutes'));

module.exports = router;