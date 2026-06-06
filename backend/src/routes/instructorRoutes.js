const express = require('express');
const router = express.Router();
const multer = require('multer');
const courseController = require('../controllers/instructor/courseController');
const { authenticate, authorize } = require('../middleware/auth');

// Setup multer for excel import
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('excel') || 
        file.mimetype.includes('spreadsheetml') || 
        file.mimetype === 'text/csv' ||
        file.originalname.match(/\.(xlsx|xls|csv)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV'), false);
    }
  }
});

// Protect all routes
router.use(authenticate);
router.use(authorize('instructor'));

// Courses
router.get('/courses', courseController.getMyCourses);
router.get('/courses/:id/students', courseController.getCourseStudents);

// Grades
router.post('/grades/import', upload.single('file'), courseController.importGrades);

module.exports = router;
