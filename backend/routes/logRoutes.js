const express = require("express");
const router = express.Router();

const { getRuntimeLogs } = require("../controllers/logController");

// 👉 Runtime logs API
router.get("/runtime/:projectId", getRuntimeLogs);

module.exports = router;