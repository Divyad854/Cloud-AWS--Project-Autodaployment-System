import { useEffect, useState } from 'react';
import { getNotifications, deleteNotification } from '../../api';
import './adminNotifications.css';
import { Trash2 } from 'lucide-react';

export default function AdminNotifications() {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ FIX: define function
  const fetchNotifications = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);

      const res = await getNotifications();
      setData(res.data.notifications || []);

    } catch (err) {
      console.log("Notification fetch failed", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // ✅ FIX: smooth background refresh
  useEffect(() => {
    fetchNotifications(true); // first load

    const interval = setInterval(() => {
      fetchNotifications(false); // silent refresh
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // ✅ DELETE
  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);

      // 🔥 instant update (no flicker)
      fetchNotifications(false);

    } catch {
      console.log("Delete failed");
    }
  };

  const getStatusIcon = (status) => {
    if (status === "success") return "✅";
    if (status === "failed") return "❌";
    if (status === "queued") return "⏳";
    if (status === "running") return "🚀";
    return "ℹ️";
  };

  return (
    <div className="notif-container">

      <h2 className="title">🔔 Admin Notifications</h2>

      {/* ✅ ONLY FIRST LOAD SHOWS LOADING */}
      {loading ? (
        <div className="empty">Loading...</div>
      ) : data.length === 0 ? (
        <div className="empty">No notifications found</div>
      ) : (
        <div className="notif-list">

          {data.map(n => (
            <div key={n.notificationId} className="notif-row">

              {/* ICON */}
              <div className="left">
                <span className="icon">{getStatusIcon(n.status)}</span>
              </div>

              {/* CONTENT */}
              <div className="center">

                <p className="main-text">
                  <b>{n.projectName || "No Project"}</b>
                  <span style={{ margin: "0 8px" }}>—</span>
                  {n.message}
                </p>

                <p className="sub-text">
                  👤 {n.userName || "N/A"}
                  <span style={{ margin: "0 10px" }}>•</span>
                  📧 {n.email || "N/A"}
                </p>

              </div>

              {/* TIME */}
              <div className="right">
                {new Date(n.createdAt).toLocaleString()}
              </div>

              {/* DELETE */}
              <div className="actions">
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(n.notificationId)}
                >
                  <Trash2 size={18} />
                </button>
              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}