// src/routes/admin/settingRoutes.js
const express = require('express');
const router = express.Router();
const settingController = require('../../controllers/admin/settingController');

router.get('/', settingController.getSettings);
router.put('/general', settingController.updateGeneral);
router.put('/profile', settingController.updateProfile);

router.put('/notifications', settingController.updateNotifications);
router.get('/system-status', settingController.getSystemStatus);
router.get('/sessions', settingController.getSessions);
router.delete('/sessions/:id', settingController.revokeSession);
router.post('/database/backup', settingController.backupDatabase);

module.exports = router;