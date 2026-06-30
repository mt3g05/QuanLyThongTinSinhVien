// src/routes/admin/tuitionRoutes.js
const express = require('express');
const router = express.Router();
const tuitionController = require('../../controllers/admin/tuitionController');

router.get('/', tuitionController.getAllTuitions);
router.post('/', tuitionController.createTuitionInvoice);
router.get('/registered-credits/:studentId', tuitionController.getRegisteredCredits);
router.get('/stats', tuitionController.getTuitionStats);
router.put('/:id/status', tuitionController.updateTuitionStatus);
router.delete('/:id', tuitionController.deleteTuitionInvoice);

module.exports = router;
