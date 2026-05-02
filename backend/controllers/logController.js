// const fs = require("fs");

// exports.getRuntimeLogs = (req, res) => {
//   const projectId = req.params.projectId;

//   const logPath = "/home/ubuntu/.pm2/logs/worker.js-out.log";

//   console.log("👉 Project:", projectId);

//   if (!fs.existsSync(logPath)) {
//     return res.json({ logs: "Log file not found ❌" });
//   }

//   let data = fs.readFileSync(logPath, "utf-8");

//   let lines = data.split("\n");

//   // 🔥 FIND PROJECT LOG START
//   let startIndex = -1;

//   for (let i = lines.length - 1; i >= 0; i--) {
//     if (lines[i].includes(projectId)) {
//       startIndex = i;
//       break;
//     }
//   }

//   if (startIndex === -1) {
//     return res.json({ logs: "No logs for this project 🚫" });
//   }

//   // 🔥 GET LOGS AFTER THAT POINT
//   let projectLogs = lines.slice(startIndex);

//   // 🔥 CLEAN FILTER
//   projectLogs = projectLogs.filter(line =>
//     line &&
//     !line.includes("⏳ No messages") &&
//     !line.includes("undefined") &&
//     !line.includes("npm fund") &&
//     !line.includes("audit")
//   );

//   // 🔥 LAST 15 LINES ONLY
//   projectLogs = projectLogs.slice(-15);

//   res.json({
//     logs: projectLogs.join("\n")
//   });
// };

const fs = require("fs");

exports.getRuntimeLogs = (req, res) => {
  const projectId = req.params.projectId;

  const logPath = "/home/ubuntu/.pm2/logs/worker.js-out.log";

  if (!fs.existsSync(logPath)) {
    return res.json({ logs: "Log file not found ❌" });
  }

  try {
    const data = fs.readFileSync(logPath, "utf-8");

    const lines = data.split("\n");

    // 🔥 REMOVE ANSI COLORS
    const cleanLines = lines.map(line =>
      line.replace(/\u001b\[[0-9;]*m/g, "").trim()
    );

    const startRegex = new RegExp(`START_DEPLOY\\s+${projectId}`);
    const endRegex = new RegExp(`END_DEPLOY\\s+${projectId}`);

    let startIndex = -1;
    let endIndex = -1;

    // 🔍 FIND LAST START
    for (let i = cleanLines.length - 1; i >= 0; i--) {
      if (startRegex.test(cleanLines[i])) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) {
      return res.json({
        logs: "No deployment started for this project 🚫"
      });
    }

    // 🔍 FIND END
    for (let i = startIndex + 1; i < cleanLines.length; i++) {
      if (endRegex.test(cleanLines[i])) {
        endIndex = i;
        break;
      }
    }

    // ✅ IF RUNNING
    if (endIndex === -1) {
      endIndex = cleanLines.length - 1;
    }

    // 🎯 GET ONLY PROJECT BLOCK
    let projectLogs = cleanLines.slice(startIndex, endIndex + 1);

    // ✅ WHITELIST FILTER (FINAL SOLUTION)
    projectLogs = projectLogs.filter(line => {
      if (!line) return false;

      return (
        line.includes("START_DEPLOY") ||
        line.includes("Project") ||
        line.includes("Deploying") ||
        line.includes("Repository connected") ||
        line.includes("Frontend") ||
        line.includes("Backend") ||
        line.includes("Installing dependencies") ||
        line.includes("Building project") ||
        line.includes("Starting application") ||
        line.includes("LIVE") ||
        line.includes("Deployment successful") ||
        line.includes("END_DEPLOY")
      );
    });

    res.json({
      logs: projectLogs.join("\n")
    });

  } catch (err) {
    console.error("LOG ERROR:", err);
    res.json({
      logs: "Error reading logs ❌"
    });
  }
};