const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

// ✅ IMPORT BOTH
const deployController = require("../controllers/deployController");
const projectController = require("../controllers/projectController");

// ✅ PROJECT LIST
router.get("/", auth, deployController.getUserProjects); 
// OR use projectController.listProjects if fixed

router.get("/:id", auth, projectController.getProject);

// ✅ DEPLOY
router.post("/", auth, deployController.deploy);

// ✅ ACTIONS
router.post("/:id/redeploy", auth, projectController.redeployProject);
router.post("/:id/stop", auth, projectController.stopProject);


router.delete("/:id", auth, projectController.deleteProject);

router.get("/:id/logs/build", auth, projectController.getBuildLogs);
router.get("/:id/logs/runtime", auth, projectController.getRuntimeLogs);
router.post('/:id/restart', auth, projectController.restartProject);
module.exports = router;