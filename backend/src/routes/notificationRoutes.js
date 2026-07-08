const express = require('express');
const { getNotifications, markAsRead, clearAllNotifications } = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.delete('/', clearAllNotifications);

module.exports = router;
