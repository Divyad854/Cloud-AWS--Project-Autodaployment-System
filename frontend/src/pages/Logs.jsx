import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getRuntimeLogs } from "../api";
import { RefreshCw, Terminal } from "lucide-react";
import "../styles/logs.css";

export default function Logs() {
  const [logs, setLogs] = useState("");
  const [loading, setLoading] = useState(false);
  const terminalRef = useRef(null);
  const [searchParams] = useSearchParams();

  // ===============================
  // ✅ GET PROJECT ID
  // ===============================
  const projectId =
    searchParams.get("id") ||
    localStorage.getItem("projectId") ||
    "ddpython";

  // ===============================
  // ✅ FETCH LOGS
  // ===============================
  const fetchLogs = async () => {
    setLoading(true);

    try {
      const res = await getRuntimeLogs(projectId);

      const newLogs = res?.data?.logs?.trim();

      if (!newLogs) {
        setLogs("⏳ Waiting for logs...");
        return;
      }

      setLogs(prev => {
        // ❌ avoid duplicate overwrite
        if (prev === newLogs) return prev;

        return newLogs;
      });

    } catch (error) {
      console.error("Logs error:", error);
      setLogs("❌ Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // ✅ AUTO REFRESH (PROJECT CHANGE FIXED)
  // ===============================
  useEffect(() => {
    fetchLogs();

    const interval = setInterval(() => {
      fetchLogs();
    }, 3000);

    return () => clearInterval(interval);
  }, [projectId]); // 🔥 IMPORTANT

  // ===============================
  // ✅ AUTO SCROLL TERMINAL
  // ===============================
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop =
        terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="logs-page">

      {/* HEADER */}
      <div className="logs-controls">
        <h2 style={{ color: "#fff", fontWeight: "600" }}>
          📜 Current Logs
        </h2>

        <button
          className="btn-icon"
          onClick={fetchLogs}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* TERMINAL */}
      <div className="logs-terminal">
        <div className="terminal-header">
          <Terminal size={16} />
          <span>Live Logs</span>
        </div>

        <pre
          ref={terminalRef}
          className="terminal-body"
        >
          {logs || (loading ? "⏳ Loading logs..." : "No logs yet")}
        </pre>
      </div>
    </div>
  );
}