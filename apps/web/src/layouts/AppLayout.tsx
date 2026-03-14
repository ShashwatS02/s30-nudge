import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { to: "/app", label: "Dashboard", hint: "Run your full life-admin system" },
  { to: "/app/profile", label: "Profile", hint: "Identity, focus, and presence" },
  { to: "/app/settings", label: "Settings", hint: "Preferences and workspace control" }
];

function getInitials(fullName?: string | null) {
  if (!fullName) return "U";

  const parts = fullName.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}

function getFirstName(fullName?: string | null) {
  if (!fullName) return "there";
  return fullName.trim().split(/\s+/)[0] || "there";
}

export default function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  const initials = getInitials(user?.fullName);
  const firstName = getFirstName(user?.fullName);

  return (
    <main className="app-shell">
      <div className="app-layout">
        <aside className="sidebar glass-card fade-up">
          <div className="sidebar-top-stack">
            <div>
              <div className="eyebrow">s30-nudge</div>
              <h2 className="sidebar-title">Personal OS</h2>
              <p className="sidebar-copy">
                Calm control for bills, appointments, renewals, and all the little life systems.
              </p>
            </div>

            <div className="sidebar-signal-grid">
              <article className="sidebar-signal-card">
                <span className="sidebar-signal-label">Mode</span>
                <strong className="sidebar-signal-value">Focused</strong>
              </article>

              <article className="sidebar-signal-card">
                <span className="sidebar-signal-label">Feel</span>
                <strong className="sidebar-signal-value">Calm</strong>
              </article>
            </div>
          </div>

          <nav className="sidebar-nav sidebar-nav-rich">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/app"}
                className={({ isActive }) =>
                  isActive ? "nav-pill nav-pill-active nav-pill-rich" : "nav-pill nav-pill-rich"
                }
              >
                <span className="nav-pill-title">{item.label}</span>
                <span className="nav-pill-copy">{item.hint}</span>
              </NavLink>
            ))}
          </nav>

          <div className="profile-mini profile-mini-rich">
            <div className="profile-avatar">{initials}</div>

            <div className="profile-mini-copy">
              <div className="profile-name">{user?.fullName ?? "Workspace user"}</div>
              <div className="profile-hint">{user?.email ?? "Signed in"}</div>
            </div>

            <span className="profile-mini-status">Live</span>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="sidebar-logout-btn"
            disabled={loggingOut}
          >
            {loggingOut ? "Signing out..." : "Log out"}
          </button>
        </aside>

        <section className="main-panel">
          <header className="topbar glass-card fade-up topbar-rich">
            <div className="topbar-copy-block">
              <div className="topbar-label">Workspace</div>
              <h1 className="topbar-title">Welcome back, {firstName}</h1>
              <p className="topbar-copy">
                A calmer command center for bills, renewals, follow-ups, and everyday operations.
              </p>
            </div>

            <div className="topbar-actions">
              <button className="secondary-btn" type="button">
                Search
              </button>
              <button className="primary-btn" type="button">
                New item
              </button>
            </div>
          </header>

          <div className="main-content">
            <Outlet />
          </div>
        </section>
      </div>
    </main>
  );
}
