// src/routes/admin/studentRoutes.js
const express = require('express');
const router = express.Router();
const studentController = require('../../controllers/admin/studentController');
const { validateResult, studentValidationRules, studentUpdateValidationRules } = require('../../middleware/validator');

const multer = require('multer');
const path = require('path');

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv'
  ];

  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV'));
  }
};

const upload = multer({ 
  dest: 'uploads/',
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/import', upload.single('file'), studentController.importStudents);
router.post('/approve-all', studentController.approveAllStudents);
router.get('/', studentController.getAllStudents);
router.get('/:id', studentController.getStudentById);
router.put('/:id/approve', studentController.approveStudent);
router.post('/', studentValidationRules, validateResult, studentController.createStudent);
router.put('/:id', studentUpdateValidationRules, validateResult, studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

module.exports = router;