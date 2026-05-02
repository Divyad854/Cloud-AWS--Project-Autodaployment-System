const os = require("os");
const { execSync } = require("child_process");

exports.getSystemLogs = async (req, res) => {
  try {
    /* ================= SERVER STATS ================= */

    // ✅ CPU Usage (approx)
    const cpuLoad = os.loadavg()[0];
    const cpuUsage = (cpuLoad * 100).toFixed(2);

    // ✅ Memory Usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = ((totalMem - freeMem) / totalMem * 100).toFixed(2);

    /* ================= PM2 STATUS ================= */

    let pm2Status = "Unknown";
    let apps = [];

    try {
      // 🔥 Get PM2 JSON data
      const pm2Data = execSync("pm2 jlist").toString();
      const processes = JSON.parse(pm2Data);

      // ✅ PM2 Status
      pm2Status = processes.length > 0 ? "🟢 Running" : "🔴 No Apps";

      // 🔥 App-wise CPU & Memory
      apps = processes.map((proc) => ({
        name: proc.name,
        status: proc.pm2_env.status,
        cpu: proc.monit.cpu, // %
        memory: (proc.monit.memory / 1024 / 1024).toFixed(2) + " MB",
      }));

    } catch {
      pm2Status = "🔴 PM2 Not Running";
    }

    /* ================= ERROR COUNT ================= */

    let errorCount = 0;
    try {
      const logs = execSync("pm2 logs --lines 200 --nostream").toString();
      errorCount = (logs.match(/error/gi) || []).length;
    } catch {}

    /* ================= RESPONSE ================= */

    const logs = `
🖥️ Server Status: ${pm2Status}

💻 CPU Usage: ${cpuUsage}%
🧠 Memory Usage: ${usedMem}%

❌ Error Logs: ${errorCount} errors

📦 App Status: ${pm2Status}
`;

    res.json({
      logs,   // ✅ old UI still works
      apps    // 🔥 NEW (for advanced UI)
    });

  } catch (err) {
    res.status(500).json({ logs: "Error fetching system logs", apps: [] });
  }
};