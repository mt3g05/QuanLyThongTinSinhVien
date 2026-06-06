const express = require('express');
const router = express.Router();
const courseController = require('../../controllers/admin/courseController');

router.route('/')
  .get(courseController.getCourses)
  .post(courseController.createCourse);

router.route('/:id')
  .put(courseController.updateCourse)
  .delete(courseController.deleteCourse);

module.exports = router;
