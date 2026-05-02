const express = require('express');
const router = express.Router();

// ✅ IMPORT BOTH FUNCTIONS
const {
  getNotifications,
  deleteNotification
} = require('../controllers/notificationController');

// ✅ IMPORT MIDDLEWARE
const verifyToken = require('../middleware/auth');

// ✅ ROUTES
router.get('/', verifyToken, getNotifications);
router.delete('/:id', verifyToken, deleteNotification);

module.exports = router;