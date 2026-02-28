// routes/projects.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });
const pc = require('../controllers/projectController');

router.get('/', pc.listProjects);
router.get('/:id', pc.getProject);
router.post('/', upload.single('zipFile'), pc.deployProject);
router.post('/:id/redeploy', pc.redeployProject);
router.post('/:id/stop', pc.stopProject);
router.post('/:id/restart', pc.restartProject);
router.delete('/:id', pc.deleteProject);
router.get('/:id/logs/build', pc.getBuildLogs);
router.get('/:id/logs/runtime', pc.getRuntimeLogs);

module.exports = router;
