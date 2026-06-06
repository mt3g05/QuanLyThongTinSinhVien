// src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const adminRoutes = require('./admin');
const studentRoutes = require('./student');

// Auth routes (public)
router.use('/auth', authRoutes);

// Admin routes (protected)
router.use('/admin', adminRoutes);

// Student routes (protected)
router.use('/student', studentRoutes);

// Instructor routes (protected)
const instructorRoutes = require('./instructorRoutes');
router.use('/instructor', instructorRoutes);

module.exports = router;