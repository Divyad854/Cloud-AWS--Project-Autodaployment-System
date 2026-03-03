const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const adminController = require('../controllers/adminController');

// Protect all admin routes
router.use(authenticate);
router.use(adminOnly);

// USERS
router.get('/users', adminController.listUsers);
router.post('/users/:userId/block', adminController.blockUser);
router.delete('/users/:userId', adminController.deleteUser);

// PROJECTS
router.get('/projects', adminController.listAllProjects);
router.post('/projects/:id/stop', adminController.stopProject);
router.delete('/projects/:id', adminController.deleteProject);

// LOGS
router.get('/logs', adminController.getSystemLogs);

module.exports = router;