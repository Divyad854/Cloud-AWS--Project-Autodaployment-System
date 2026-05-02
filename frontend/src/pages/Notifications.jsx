import { useEffect, useState } from 'react';
import { getNotifications, deleteNotification } from '../api';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './notifications.css';

export default function Notifications() {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ FIXED: no loading flicker
  const fetchNotifications = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true); // only first time

      const res = await getNotifications();
      setData(res.data.notifications || []);

    } catch (err) {
      console.log("Notification fetch failed", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // ✅ FIXED: background refresh (no UI flicker)
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
      const res = await deleteNotification(id);
      toast.success(res.data?.message || "Notification updated");

      // 🔥 instant refresh after delete
      fetchNotifications(false);

    } catch (err) {
      console.log("Delete failed", err?.response?.data);
      toast.error(
        err?.response?.data?.message || "Delete failed"
      );
    }
  };

  const getStatusIcon = (status) => {
    if (status === "success") return "✅";
    if (status === "failed") return "❌";
    if (status === "queued") return "⏳";
    if (status === "running") return "🚀";
    return "🔔";
  };

  return (
    <div className="user-notif-container">

      {/* HEADER */}
      <div className="header">
        <h2 className="title">🔔 My Notifications</h2>

        <button className="refresh-btn" onClick={() => fetchNotifications(true)}>
          Refresh
        </button>
      </div>

      {/* ONLY FIRST LOAD SHOWS LOADING */}
      {loading ? (
        <div className="empty">Loading...</div>
      ) : data.length === 0 ? (
        <div className="empty">No notifications</div>
      ) : (
        <div className="notif-list">

          {data.map(n => (
            <div key={n.notificationId} className="notif-card">

              {/* ICON */}
              <div className="notif-left">
                {getStatusIcon(n.status)}
              </div>

              {/* CONTENT */}
              <div className="notif-content">
                <p className="notif-title">
                  {n.projectName || "Project"}
                </p>

                <p className="notif-message">
                  {n.message}
                </p>
              </div>

              {/* TIME */}
              <div className="notif-time">
                {new Date(n.createdAt).toLocaleString()}
              </div>

              {/* DELETE */}
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(n.notificationId);
                }}
              >
                <Trash2 size={16} />
              </button>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}