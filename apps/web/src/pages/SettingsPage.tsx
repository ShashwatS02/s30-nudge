import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { logoutAll as apiLogoutAll } from "../lib/api";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { accessToken, logout, user } = useAuth();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLogoutAll() {
    if (!accessToken) {
      setError("You are not signed in.");
      return;
    }

    try {
      setPending(true);
      setMessage(null);
      setError(null);

      await apiLogoutAll(accessToken);
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log out everywhere");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="section-stack">
      <section className="glass-section fade-up">
        <span className="section-kicker">Settings</span>
        <h2 className="section-title">Shape the workspace around your rhythm.</h2>
        <p className="section-copy">
          Preferences, account controls, connected sign-in methods, notifications, and future
          workspace behavior will live here.
        </p>
      </section>

      <div className="settings-grid">
        <section className="glass-section fade-up settings-card">
          <div className="settings-card-top">
            <div>
              <span className="section-kicker">Notifications</span>
              <h3 className="section-title settings-card-title">Attention rules</h3>
            </div>
            <span className="settings-status-pill">Soon</span>
          </div>

          <p className="section-copy">
            Decide when reminders should feel calm, urgent, quiet, or completely silent.
          </p>
        </section>

        <section className="glass-section fade-up settings-card">
          <div className="settings-card-top">
            <div>
              <span className="section-kicker">Account</span>
              <h3 className="section-title settings-card-title">Identity and access</h3>
            </div>
            <span className="settings-status-pill">Live</span>
          </div>

          <p className="section-copy" style={{ marginBottom: 14 }}>
            Signed in as <span style={{ color: "white", fontWeight: 600 }}>{user?.email}</span>.
          </p>

          <p className="section-copy" style={{ marginBottom: 18 }}>
            This ends the current session and revokes every stored refresh session for this account.
          </p>

          {message ? (
            <p className="auth-feedback" style={{ color: "#bbf7d0", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}>
              {message}
            </p>
          ) : null}

          {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

          <button
            className="secondary-btn"
            type="button"
            onClick={() => void handleLogoutAll()}
            disabled={pending}
            style={{
              width: "100%",
              justifyContent: "center",
              borderColor: "rgba(248,113,113,0.28)",
              color: "#fecaca"
            }}
          >
            {pending ? "Logging out everywhere..." : "Log out everywhere"}
          </button>
        </section>

        <section className="glass-section fade-up settings-card">
          <div className="settings-card-top">
            <div>
              <span className="section-kicker">Workspace</span>
              <h3 className="section-title settings-card-title">Visual behavior</h3>
            </div>
            <span className="settings-status-pill">Soon</span>
          </div>

          <p className="section-copy">
            Tune density, display preferences, and the feel of the command surface over time.
          </p>
        </section>

        <section className="glass-section fade-up settings-card">
          <div className="settings-card-top">
            <div>
              <span className="section-kicker">Connected tools</span>
              <h3 className="section-title settings-card-title">Future integrations</h3>
            </div>
            <span className="settings-status-pill">Planned</span>
          </div>

          <p className="section-copy">
            Email, calendar, and other personal operations inputs can eventually plug into this layer.
          </p>
        </section>
      </div>
    </section>
  );
}
