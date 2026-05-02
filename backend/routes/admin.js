const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const adminController = require('../controllers/adminController');

router.use(authenticate);
router.use(adminOnly);

// USERS
router.get('/users', adminController.listUsers);
router.post('/users/:userId/block', adminController.blockUser);
router.post('/users/:userId/unblock', adminController.unblockUser);
router.delete('/users/:userId', adminController.deleteUser);

// PROJECTS
router.get('/projects', adminController.listAllProjects);

router.delete('/projects/:partitionId/:projectId', adminController.deleteProject);

module.exports = router;