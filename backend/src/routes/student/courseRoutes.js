const express = require('express');
const router = express.Router();
const courseController = require('../../controllers/student/courseController');

router.get('/available', courseController.getAvailableCourses);
router.get('/my-registrations', courseController.getMyRegistrations);
router.post('/register/:courseId', courseController.registerCourse);
router.post('/cancel/:courseId', courseController.cancelRegistration);

module.exports = router;
