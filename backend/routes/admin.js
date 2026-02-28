// routes/admin.js
const express = require('express');
const router = express.Router();
const ac = require('../controllers/adminController');

router.get('/users', ac.listUsers);
router.post('/users/:userId/block', ac.blockUser);
router.delete('/users/:userId', ac.deleteUser);
router.get('/projects', ac.listAllProjects);
router.post('/projects/:id/stop', ac.stopProject);
router.delete('/projects/:id', ac.deleteProject);
router.get('/logs', ac.getSystemLogs);

module.exports = router;
