// routes/projects.js

const express = require("express");
const router = express.Router();

const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
});

const auth = require("../middleware/auth");
const pc = require("../controllers/projectController");

// 🔥 PROTECTED ROUTES
router.get("/", auth, pc.listProjects);
router.get("/:id", auth, pc.getProject);

router.post("/", auth, upload.single("zipFile"), pc.deployProject);

router.post("/:id/redeploy", auth, pc.redeployProject);
router.post("/:id/stop", auth, pc.stopProject);
router.post("/:id/restart", auth, pc.restartProject);

router.delete("/:id", auth, pc.deleteProject);

router.get("/:id/logs/build", auth, pc.getBuildLogs);
router.get("/:id/logs/runtime", auth, pc.getRuntimeLogs);

module.exports = router;