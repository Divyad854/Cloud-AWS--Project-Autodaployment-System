// routes/users.js
const express = require('express');
const router = express.Router();
const uc = require('../controllers/userController');

router.get('/profile', uc.getProfile);
router.put('/profile', uc.updateProfile);

module.exports = router;
