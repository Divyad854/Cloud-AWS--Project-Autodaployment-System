// routes/projects.js

const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const pc = require("../controllers/projectController");

// 🔥 PROTECTED ROUTES
router.get("/", auth, pc.listProjects);
router.get("/:id", auth, pc.getProject);

router.post("/", auth, pc.deployProject);

router.post("/:id/redeploy", auth, pc.redeployProject);
router.post("/:id/stop", auth, pc.stopProject);
router.post("/:id/restart", auth, pc.restartProject);

router.delete("/:id", auth, pc.deleteProject);

router.get("/:id/logs/build", auth, pc.getBuildLogs);
router.get("/:id/logs/runtime", auth, pc.getRuntimeLogs);

module.exports = router;