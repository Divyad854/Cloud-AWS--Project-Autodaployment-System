// src/pages/admin/AdminUsers.jsx
import { useEffect, useState } from 'react';
import { adminGetUsers, adminBlockUser, adminDeleteUser } from '../../api';
import { UserX, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import '../../styles/admin.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await adminGetUsers();
      const data = res.data.users || [];
      setUsers(data);
      setFiltered(data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(users.filter(u =>
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    ));
  }, [search, users]);

  const handleBlock = async (userId) => {
    try {
      await adminBlockUser(userId);
      toast.success('User blocked');
      fetchUsers();
    } catch { toast.error('Failed to block user'); }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Permanently delete this user?')) return;
    try {
      await adminDeleteUser(userId);
      toast.success('User deleted');
      fetchUsers();
    } catch { toast.error('Failed to delete user'); }
  };

  return (
    <div className="admin-page">
      <div className="page-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Search users..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <span className="muted">{filtered.length} users</span>
      </div>

      {loading ? <div className="loading-state"><div className="spinner" /></div> : (
        <table className="projects-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Projects</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td className="muted">{u.email}</td>
                <td>{u.projectCount || 0}</td>
                <td>
                  <span className={`status-pill ${u.status === 'active' ? 'success' : 'danger'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="muted">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="icon-action warning" title="Block" onClick={() => handleBlock(u.id)}>
                      <UserX size={15} />
                    </button>
                    <button className="icon-action danger" title="Delete" onClick={() => handleDelete(u.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
