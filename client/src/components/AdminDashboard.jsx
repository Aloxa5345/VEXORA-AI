import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./AdminDashboard.css";

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/admin';

const FALLBACK_STATS = {
  totalUsers: 0, totalConversations: 0, totalProjects: 0,
  totalApiLogs: 0, totalAdmins: 0, todayChats: 0, weekChats: 0,
};

const CHART_DAYS = [
  { day: "Mon", count: 12 }, { day: "Tue", count: 28 }, { day: "Wed", count: 19 },
  { day: "Thu", count: 35 }, { day: "Fri", count: 42 }, { day: "Sat", count: 31 }, { day: "Sun", count: 24 },
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtTime = (d) => d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const relTime = (d) => {
  if (!d) return "—";
  const diff = Date.now() - new Date(d);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [activity, setActivity] = useState([]);
  const [system, setSystem] = useState({ backend: "Online", database: "Checking…", aiService: "Checking…", authService: "Online" });
  const [users, setUsers] = useState([]);
  const [chart, setChart] = useState(CHART_DAYS);
  const [apiLogs, setApiLogs] = useState([]);
  const [analytics, setAnalytics] = useState({ dailyChats: [], topUsers: [], hourly: [] });
  const [projects, setProjects] = useState([]);
  const [projSearch, setProjSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dbOnline, setDbOnline] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [roleChanging, setRoleChanging] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const initials = user?.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "AD";

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sR, aR, syR, uR, cR, lR, anR, pR] = await Promise.allSettled([
        axios.get(`${API}/stats`, { headers }),
        axios.get(`${API}/activity`, { headers }),
        axios.get(`${API}/system-status`, { headers }),
        axios.get(`${API}/users`, { headers }),
        axios.get(`${API}/chart`, { headers }),
        axios.get(`${API}/api-logs`, { headers }),
        axios.get(`${API}/analytics`, { headers }),
        axios.get(`${API}/projects`, { headers }),
      ]);
      if (sR.status === "fulfilled" && sR.value.data.success) { setStats(sR.value.data.stats); setDbOnline(true); }
      if (aR.status === "fulfilled" && aR.value.data.success) setActivity(aR.value.data.activities || []);
      if (syR.status === "fulfilled" && syR.value.data.success) setSystem(syR.value.data.services);
      if (uR.status === "fulfilled" && uR.value.data.success) setUsers(uR.value.data.users || []);
      if (cR.status === "fulfilled" && cR.value.data.success) {
        const rows = cR.value.data.chart;
        if (rows.length > 0) {
          const max = Math.max(...rows.map(r => r.count), 1);
          setChart(rows.map(r => ({ day: r.day, count: r.count, h: Math.max(8, Math.round((r.count / max) * 100)) })));
        }
      }
      if (lR.status === "fulfilled" && lR.value.data.success) setApiLogs(lR.value.data.logs || []);
      if (anR.status === "fulfilled" && anR.value.data.success) setAnalytics(anR.value.data);
      if (pR.status === "fulfilled" && pR.value.data.success) setProjects(pR.value.data.projects || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRoleChange = async (userId, newRole) => {
    setRoleChanging(userId);
    try {
      await axios.put(`${API}/users/${userId}/role`, { role: newRole }, { headers });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast("Role updated!");
    } catch (e) { showToast("Failed to update role", false); }
    finally { setRoleChanging(null); }
  };

  const handleDeleteUser = async (uid) => {
    try {
      await axios.delete(`${API}/users/${uid}`, { headers });
      setUsers(prev => prev.filter(u => u.id !== uid));
      setDeleteConfirm(null);
      showToast("User deleted!");
    } catch (e) { showToast(e?.response?.data?.message || "Failed", false); }
  };

  const handleDeleteProject = async (pid) => {
    try {
      await axios.delete(`${API}/projects/${pid}`, { headers });
      setProjects(prev => prev.filter(p => p.id !== pid));
      showToast("Project deleted!");
    } catch (e) { showToast("Failed to delete project", false); }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredProjects = projects.filter(p =>
    p.project_name?.toLowerCase().includes(projSearch.toLowerCase()) ||
    p.user_name?.toLowerCase().includes(projSearch.toLowerCase())
  );

  const TABS = [
    { id: "overview", icon: "bi-grid-fill", label: "Overview" },
    { id: "users", icon: "bi-people-fill", label: "Users" },
    { id: "projects", icon: "bi-folder2-open", label: "Projects" },
    { id: "analytics", icon: "bi-bar-chart-line-fill", label: "Analytics" },
    { id: "logs", icon: "bi-terminal-fill", label: "API Logs" },
    { id: "settings", icon: "bi-gear-fill", label: "Settings" },
  ];

  const STAT_CARDS = [
    { title: "Total Users", value: stats.totalUsers, icon: "bi-people-fill", color: "#7c3aed" },
    { title: "AI Conversations", value: stats.totalConversations, icon: "bi-chat-dots-fill", color: "#ec4899" },
    { title: "Today's Chats", value: stats.todayChats, icon: "bi-lightning-fill", color: "#06b6d4" },
    { title: "This Week", value: stats.weekChats, icon: "bi-calendar-week-fill", color: "#10b981" },
    { title: "Projects", value: stats.totalProjects, icon: "bi-folder2-open", color: "#f59e0b" },
    { title: "API Logs", value: stats.totalApiLogs, icon: "bi-activity", color: "#f97316" },
  ];

  return (
    <div className="ad-root">
      {/* bg */}
      <div className="ad-bg-mesh" />

      {/* Toast */}
      {toast && (
        <div className={`ad-toast ${toast.ok ? "ad-toast-ok" : "ad-toast-err"}`}>
          <i className={`bi bi-${toast.ok ? "check-circle" : "x-circle"}-fill`} />
          {toast.msg}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="ad-modal-backdrop">
          <div className="ad-modal">
            <div className="ad-modal-icon"><i className="bi bi-exclamation-triangle-fill" /></div>
            <h3>Delete User</h3>
            <p>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.</p>
            <div className="ad-modal-actions">
              <button className="ad-modal-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="ad-modal-delete" onClick={() => handleDeleteUser(deleteConfirm.id)}>
                <i className="bi bi-trash3-fill" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="ad-header">
        <div className="ad-header-left">
          <img src="/logo.png" alt="logo" className="ad-logo" />
          <div>
            <div className="ad-eyebrow">Admin Panel</div>
            <h1 className="ad-title">Dashboard</h1>
          </div>
        </div>
        <div className="ad-header-right">
          <span className={`ad-db-badge ${dbOnline ? "ad-db-online" : "ad-db-offline"}`}>
            <span className="ad-db-dot" />
            {dbOnline ? "DB Online" : "DB Offline"}
          </span>
          <button className="ad-refresh-btn" onClick={fetchAll} disabled={loading} title="Refresh">
            <i className={`bi bi-arrow-clockwise ${loading ? "ad-spin" : ""}`} />
          </button>
          <div className="ad-header-avatar">{initials}</div>
          <div className="ad-header-info">
            <strong>{user?.name}</strong>
            <span>👑 Administrator</span>
          </div>
          <button className="ad-logout-btn" onClick={logout} title="Logout">
            <i className="bi bi-box-arrow-right" />
          </button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="ad-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`ad-tab ${activeTab === t.id ? "ad-tab-active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            <i className={`bi ${t.icon}`} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ════════════ OVERVIEW ════════════ */}
      {activeTab === "overview" && (
        <div className="ad-tab-content">

          {/* Stat cards */}
          <div className="ad-stat-grid">
            {STAT_CARDS.map((s, i) => (
              <div key={i} className="ad-stat-card" style={{ "--sc": s.color }}>
                <div className="ad-stat-top">
                  <div className="ad-stat-icon"><i className={`bi ${s.icon}`} /></div>
                  <span className="ad-stat-change">↑ Live</span>
                </div>
                <div className="ad-stat-val">
                  {loading ? <span className="ad-skel" /> : s.value}
                </div>
                <div className="ad-stat-label">{s.title}</div>
                <div className="ad-stat-bar"><div className="ad-stat-bar-fill" /></div>
              </div>
            ))}
          </div>

          {/* Chart + Activity */}
          <div className="ad-main-grid">

            {/* Bar chart */}
            <div className="ad-panel">
              <div className="ad-panel-head">
                <div>
                  <h3>AI Usage — Last 7 Days</h3>
                  <p>Chat requests per day</p>
                </div>
              </div>
              <div className="ad-chart-wrap">
                <div className="ad-chart-bars">
                  {chart.map((b, i) => (
                    <div key={i} className="ad-bar-col">
                      <span className="ad-bar-val">{b.count}</span>
                      <div className="ad-bar" style={{ height: `${b.h || 8}%` }} title={`${b.day}: ${b.count}`} />
                      <span className="ad-bar-day">{b.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="ad-panel">
              <div className="ad-panel-head">
                <div><h3>Recent Activity</h3><p>Latest platform events</p></div>
                <button className="ad-link-btn" onClick={fetchAll}>Refresh</button>
              </div>
              <div className="ad-activity-list">
                {(activity.length > 0 ? activity : [
                  { endpoint: "/api/chat", method: "POST", status_code: 200, user_name: "System", created_at: new Date() },
                ]).map((a, i) => (
                  <div key={i} className="ad-activity-row">
                    <div className={`ad-act-dot ${a.status_code < 400 ? "ad-act-ok" : "ad-act-err"}`} />
                    <div className="ad-act-body">
                      <span className="ad-act-endpoint">{a.method} {a.endpoint?.slice(0, 36)}</span>
                      <span className="ad-act-user">{a.user_name || "anonymous"}</span>
                    </div>
                    <div className="ad-act-right">
                      <span className={`ad-status-pill ${a.status_code < 400 ? "ad-s-ok" : "ad-s-err"}`}>{a.status_code}</span>
                      <span className="ad-act-time">{relTime(a.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent users */}
          <div className="ad-panel">
            <div className="ad-panel-head">
              <div><h3>Recent Users</h3><p>Latest registrations</p></div>
              <button className="ad-link-btn" onClick={() => setActiveTab("users")}>View All →</button>
            </div>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Chats</th><th>Joined</th></tr></thead>
                <tbody>
                  {(users.slice(0, 5)).map((u, i) => (
                    <tr key={i}>
                      <td>
                        <div className="ad-user-cell">
                          <div className="ad-mini-av">{u.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}</div>
                          {u.name}
                        </div>
                      </td>
                      <td className="ad-muted">{u.email}</td>
                      <td><span className={`ad-role-badge ${u.role === "admin" ? "ad-r-admin" : "ad-r-user"}`}>{u.role === "admin" ? "👑 Admin" : "👤 User"}</span></td>
                      <td className="ad-muted">{u.chat_count || 0}</td>
                      <td className="ad-muted">{fmtDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ USERS ════════════ */}
      {activeTab === "users" && (
        <div className="ad-tab-content">
          <div className="ad-panel">
            <div className="ad-panel-head">
              <div><h3>User Management</h3><p>{users.length} total users</p></div>
              <div className="ad-search-wrap">
                <i className="bi bi-search ad-search-icon" />
                <input className="ad-search" placeholder="Search name or email…" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
            </div>
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr><th>#</th><th>User</th><th>Email</th><th>Role</th><th>Chats</th><th>Joined</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr key={u.id}>
                      <td className="ad-muted">{i + 1}</td>
                      <td>
                        <div className="ad-user-cell">
                          <div className="ad-mini-av">{u.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}</div>
                          <div>
                            <strong>{u.name}</strong>
                            {u.id === user?.id && <span className="ad-you-badge">You</span>}
                          </div>
                        </div>
                      </td>
                      <td className="ad-muted">{u.email}</td>
                      <td>
                        <select
                          className="ad-role-select"
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          disabled={roleChanging === u.id || u.id === user?.id}
                        >
                          <option value="user">👤 User</option>
                          <option value="admin">👑 Admin</option>
                        </select>
                      </td>
                      <td className="ad-muted">{u.chat_count || 0}</td>
                      <td className="ad-muted">{fmtDate(u.created_at)}</td>
                      <td>
                        <button
                          className="ad-del-btn"
                          onClick={() => setDeleteConfirm(u)}
                          disabled={u.id === user?.id}
                          title="Delete user"
                        >
                          <i className="bi bi-trash3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ PROJECTS — Step 15 ════════════ */}
      {activeTab === "projects" && (
        <div className="ad-tab-content">
          <div className="ad-panel">
            <div className="ad-panel-head">
              <div><h3>Project Management</h3><p>{projects.length} total projects</p></div>
              <div className="ad-search-wrap">
                <i className="bi bi-search ad-search-icon" />
                <input className="ad-search" placeholder="Search projects…" value={projSearch} onChange={e => setProjSearch(e.target.value)} />
              </div>
            </div>
            {filteredProjects.length === 0 ? (
              <div className="ad-empty">
                <i className="bi bi-folder2-open" />
                <p>No projects found</p>
                <span>Projects created by users will appear here</span>
              </div>
            ) : (
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr><th>#</th><th>Project Name</th><th>Owner</th><th>Email</th><th>Created</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((p, i) => (
                      <tr key={p.id}>
                        <td className="ad-muted">{i + 1}</td>
                        <td>
                          <div className="ad-user-cell">
                            <div className="ad-mini-av" style={{ background: "linear-gradient(135deg,#06b6d4,#10b981)" }}>
                              <i className="bi bi-folder-fill" style={{ fontSize: 10, color: "white" }} />
                            </div>
                            <strong style={{ color: "var(--text)" }}>{p.project_name}</strong>
                          </div>
                        </td>
                        <td className="ad-muted">{p.user_name || "—"}</td>
                        <td className="ad-muted">{p.email || "—"}</td>
                        <td className="ad-muted">{fmtDate(p.created_at)}</td>
                        <td>
                          <button className="ad-del-btn" onClick={() => handleDeleteProject(p.id)} title="Delete project">
                            <i className="bi bi-trash3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════ ANALYTICS ════════════ */}
      {activeTab === "analytics" && (
        <div className="ad-tab-content">

          {/* Summary stats */}
          <div className="ad-analytics-row">
            {[
              { icon: "bi-chat-dots-fill", label: "14-Day Chats", value: analytics.dailyChats.reduce((a, r) => a + (r.count || 0), 0), color: "#7c3aed" },
              { icon: "bi-people-fill", label: "Active Users", value: analytics.topUsers.filter(u => u.chat_count > 0).length, color: "#ec4899" },
              { icon: "bi-bar-chart-fill", label: "Avg / Day", value: analytics.dailyChats.length > 0 ? Math.round(analytics.dailyChats.reduce((a, r) => a + (r.count || 0), 0) / analytics.dailyChats.length) : 0, color: "#06b6d4" },
              { icon: "bi-clock-fill", label: "Peak Hour", value: analytics.hourly.length > 0 ? `${analytics.hourly.reduce((a, r) => r.count > a.count ? r : a, analytics.hourly[0])?.hour}:00` : "—", color: "#10b981" },
            ].map((s, i) => (
              <div key={i} className="ad-an-stat" style={{ "--sc": s.color }}>
                <div className="ad-an-stat-icon"><i className={`bi ${s.icon}`} /></div>
                <div>
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="ad-analytics-grid">
            {/* Daily chart */}
            <div className="ad-panel">
              <div className="ad-panel-head">
                <div><h3>Daily Chat Volume</h3><p>Last 14 days</p></div>
              </div>
              {analytics.dailyChats.length === 0 ? (
                <div className="ad-empty"><i className="bi bi-bar-chart" /><p>No data yet</p></div>
              ) : (
                <div className="ad-chart-wrap ad-chart-tall">
                  <div className="ad-chart-bars">
                    {analytics.dailyChats.map((d, i) => {
                      const max = Math.max(...analytics.dailyChats.map(x => x.count), 1);
                      return (
                        <div key={i} className="ad-bar-col">
                          <span className="ad-bar-val">{d.count}</span>
                          <div className="ad-bar ad-bar-pink" style={{ height: `${Math.max(6, Math.round((d.count / max) * 100))}%` }} />
                          <span className="ad-bar-day">{d.label?.split(" ")[1] || d.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Top users */}
            <div className="ad-panel">
              <div className="ad-panel-head">
                <div><h3>Top Users</h3><p>By chat activity</p></div>
              </div>
              {analytics.topUsers.length === 0 ? (
                <div className="ad-empty"><i className="bi bi-people" /><p>No data yet</p></div>
              ) : (
                <div className="ad-top-users">
                  {analytics.topUsers.map((u, i) => {
                    const max = Math.max(...analytics.topUsers.map(x => x.chat_count), 1);
                    return (
                      <div key={i} className="ad-top-user-row">
                        <span className="ad-top-rank">#{i + 1}</span>
                        <div className="ad-mini-av ad-mini-av-sm">{u.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}</div>
                        <div className="ad-top-user-info">
                          <strong>{u.name}</strong>
                          <div className="ad-progress-bar">
                            <div className="ad-progress-fill" style={{ width: `${Math.round((u.chat_count / max) * 100)}%` }} />
                          </div>
                        </div>
                        <span className="ad-top-count">{u.chat_count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════ API LOGS ════════════ */}
      {activeTab === "logs" && (
        <div className="ad-tab-content">
          <div className="ad-panel">
            <div className="ad-panel-head">
              <div><h3>API Logs</h3><p>Last 50 requests</p></div>
              <button className="ad-refresh-btn" onClick={fetchAll} disabled={loading}>
                <i className={`bi bi-arrow-clockwise ${loading ? "ad-spin" : ""}`} />
              </button>
            </div>
            {apiLogs.length === 0 ? (
              <div className="ad-empty">
                <i className="bi bi-terminal" />
                <p>No API logs yet</p>
                <span>Logs will appear here as users interact with the API</span>
              </div>
            ) : (
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr><th>Method</th><th>Endpoint</th><th>Status</th><th>User</th><th>IP</th><th>Time</th></tr>
                  </thead>
                  <tbody>
                    {apiLogs.map((l, i) => (
                      <tr key={i}>
                        <td><span className={`ad-method-badge ad-m-${l.method?.toLowerCase()}`}>{l.method}</span></td>
                        <td className="ad-endpoint-cell">{l.endpoint}</td>
                        <td><span className={`ad-status-pill ${l.status_code < 400 ? "ad-s-ok" : l.status_code < 500 ? "ad-s-warn" : "ad-s-err"}`}>{l.status_code}</span></td>
                        <td className="ad-muted">{l.user_name || "—"}</td>
                        <td className="ad-muted ad-mono">{l.ip_address || "—"}</td>
                        <td className="ad-muted">{fmtTime(l.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════ SETTINGS ════════════ */}
      {activeTab === "settings" && (
        <div className="ad-tab-content">
          <div className="ad-settings-grid">

            {/* System Status */}
            <div className="ad-panel">
              <div className="ad-panel-head">
                <div><h3>System Status</h3><p>Live service health</p></div>
                <span className="ad-all-ok">
                  <span className="ad-ok-dot" />
                  {system.database === "Online" ? "All Operational" : "Degraded"}
                </span>
              </div>
              <div className="ad-services">
                {[
                  { label: "Backend API", icon: "bi-server", status: system.backend },
                  { label: "Database", icon: "bi-database-fill", status: system.database },
                  { label: "AI Service", icon: "bi-stars", status: system.aiService },
                  { label: "Auth Service", icon: "bi-shield-check", status: system.authService },
                ].map((s, i) => (
                  <div key={i} className="ad-service-row">
                    <div className="ad-service-left">
                      <div className="ad-service-icon"><i className={`bi ${s.icon}`} /></div>
                      <span>{s.label}</span>
                    </div>
                    <span className={s.status === "Online" || s.status === "Configured" ? "ad-ok-text" : "ad-fail-text"}>
                      <i className={`bi bi-${s.status === "Online" || s.status === "Configured" ? "check-circle" : "x-circle"}-fill`} />
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Config */}
            <div className="ad-panel">
              <div className="ad-panel-head">
                <div><h3>AI Configuration</h3><p>Model & provider settings</p></div>
              </div>
              <div className="ad-config-list">
                {[
                  { label: "Primary Model", value: "OpenAI GPT-4o-mini", icon: "bi-stars", status: "inactive" },
                  { label: "Fallback Model", value: system.geminiModel || "gemini-flash-lite", icon: "bi-cpu-fill", status: "active" },
                  { label: "Gemini Model", value: system.geminiModel || "—", icon: "bi-lightning-fill", status: "active" },
                  { label: "Fallback Mode", value: "Auto", icon: "bi-arrow-repeat", status: "active" },
                ].map((c, i) => (
                  <div key={i} className="ad-config-row">
                    <div className="ad-config-icon"><i className={`bi ${c.icon}`} /></div>
                    <div className="ad-config-info">
                      <span>{c.label}</span>
                      <strong>{c.value}</strong>
                    </div>
                    <span className={`ad-config-status ${c.status === "active" ? "ad-cfg-ok" : "ad-cfg-off"}`}>
                      {c.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Database Stats */}
            <div className="ad-panel">
              <div className="ad-panel-head">
                <div><h3>Database Overview</h3><p>Table counts</p></div>
              </div>
              <div className="ad-db-stats">
                {[
                  { label: "Users", value: stats.totalUsers, icon: "bi-people-fill", color: "#7c3aed" },
                  { label: "Chat Messages", value: stats.totalConversations, icon: "bi-chat-fill", color: "#ec4899" },
                  { label: "Projects", value: stats.totalProjects, icon: "bi-folder-fill", color: "#06b6d4" },
                  { label: "API Logs", value: stats.totalApiLogs, icon: "bi-activity", color: "#10b981" },
                  { label: "Admins", value: stats.totalAdmins, icon: "bi-shield-fill", color: "#f59e0b" },
                ].map((d, i) => (
                  <div key={i} className="ad-db-row">
                    <div className="ad-db-row-icon" style={{ background: `${d.color}18`, border: `1px solid ${d.color}30`, color: d.color }}>
                      <i className={`bi ${d.icon}`} />
                    </div>
                    <span>{d.label}</span>
                    <strong>{d.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="ad-panel">
              <div className="ad-panel-head">
                <div><h3>Quick Actions</h3><p>Admin controls</p></div>
              </div>
              <div className="ad-quick-actions">
                {[
                  { icon: "bi-arrow-clockwise", label: "Refresh All Data", action: fetchAll, color: "#7c3aed" },
                  { icon: "bi-people", label: "Manage Users", action: () => setActiveTab("users"), color: "#06b6d4" },
                  { icon: "bi-bar-chart-line", label: "View Analytics", action: () => setActiveTab("analytics"), color: "#ec4899" },
                  { icon: "bi-terminal", label: "View API Logs", action: () => setActiveTab("logs"), color: "#10b981" },
                  { icon: "bi-box-arrow-right", label: "Logout", action: logout, color: "#f87171" },
                ].map((q, i) => (
                  <button key={i} className="ad-quick-btn" onClick={q.action} style={{ "--qc": q.color }}>
                    <div className="ad-quick-icon"><i className={`bi ${q.icon}`} /></div>
                    <span>{q.label}</span>
                    <i className="bi bi-chevron-right ad-chevron" />
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
