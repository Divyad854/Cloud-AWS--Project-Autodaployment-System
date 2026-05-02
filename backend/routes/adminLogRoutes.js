const express = require("express");
const router = express.Router();

// ✅ Import Controller
const { getSystemLogs } = require("../controllers/adminLogsController");

// ✅ Route
router.get("/system-logs", getSystemLogs);

module.exports = router;