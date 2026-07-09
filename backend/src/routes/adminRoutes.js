const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const protect = require('../middleware/authMiddleware');

// Add role protection if needed, for now protect ensures logged in
// In a real scenario, you'd add an admin guard here
router.get('/stats', protect, adminController.getAdminStats);
router.get('/users', protect, adminController.getUsers);
router.get('/reports', protect, adminController.getReports);

// New features
router.put('/users/:id/suspend', protect, adminController.suspendUser);
router.delete('/users/:id', protect, adminController.deleteUser);
router.get('/users/:id/receipts', protect, adminController.getUserReceipts);
router.get('/trends', protect, adminController.getTrends);
router.get('/categories/popular', protect, adminController.getPopularCategories);
router.put('/reports/:id/reply', protect, adminController.replyToReport);
router.delete('/reports/:id', protect, adminController.deleteReport);

module.exports = router;
