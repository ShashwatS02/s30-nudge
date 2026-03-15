import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { changePassword as apiChangePassword, logoutAll as apiLogoutAll } from "../lib/api";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { accessToken, logout, user } = useAuth();

  const [pending, setPending] = useState(false);
  const [logoutAllPending, setLogoutAllPending] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      setError("You are not signed in.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setPending(true);
      setMessage(null);
      setError(null);

      const res = await apiChangePassword(accessToken, {
        currentPassword,
        newPassword
      });

      setMessage(res.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPending(false);
    }
  }

  async function handleLogoutAll() {
    if (!accessToken) {
      setError("You are not signed in.");
      return;
    }

    try {
      setLogoutAllPending(true);
      setMessage(null);
      setError(null);

      await apiLogoutAll(accessToken);
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log out everywhere");
    } finally {
      setLogoutAllPending(false);
    }
  }

  return (
    <section className="section-stack">
      <section className="glass-section fade-up">
        <span className="section-kicker">Settings</span>
        <h2 className="section-title">Shape the workspace around your rhythm.</h2>
        <p className="section-copy">
          Account controls, password security, sign-in access, and future workspace preferences live
          here.
        </p>
      </section>

      <div className="settings-grid">
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

          <form className="auth-form-grid" onSubmit={handleChangePassword}>
            <div className="field-block">
              <label className="field-label" htmlFor="current-password">
                Current password
              </label>
              <input
                id="current-password"
                className="input-shell"
                type="password"
                autoComplete="current-password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </div>

            <div className="field-block">
              <label className="field-label" htmlFor="new-password">
                New password
              </label>
              <input
                id="new-password"
                className="input-shell"
                type="password"
                autoComplete="new-password"
                placeholder="Create a new password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </div>

            <div className="field-block">
              <label className="field-label" htmlFor="confirm-password">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                className="input-shell"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>

            <p className="auth-support-copy">
              Passwords must be at least 10 characters and include 1 number and 1 special
              character.
            </p>

            {message ? (
              <p
                className="auth-feedback"
                style={{
                  color: "#bbf7d0",
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.2)"
                }}
              >
                {message}
              </p>
            ) : null}

            {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

            <button className="primary-btn auth-submit-btn" type="submit" disabled={pending}>
              {pending ? "Updating password..." : "Change password"}
            </button>
          </form>
        </section>

        <section className="glass-section fade-up settings-card">
          <div className="settings-card-top">
            <div>
              <span className="section-kicker">Sessions</span>
              <h3 className="section-title settings-card-title">Log out everywhere</h3>
            </div>
            <span className="settings-status-pill">Live</span>
          </div>

          <p className="section-copy" style={{ marginBottom: 18 }}>
            This ends the current session and revokes every stored refresh session for this account.
          </p>

          <button
            className="secondary-btn"
            type="button"
            onClick={() => void handleLogoutAll()}
            disabled={logoutAllPending}
            style={{
              width: "100%",
              justifyContent: "center",
              borderColor: "rgba(248,113,113,0.28)",
              color: "#fecaca"
            }}
          >
            {logoutAllPending ? "Logging out everywhere..." : "Log out everywhere"}
          </button>
        </section>

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
              <span className="section-kicker">Connected tools</span>
              <h3 className="section-title settings-card-title">Future integrations</h3>
            </div>
            <span className="settings-status-pill">Planned</span>
          </div>

          <p className="section-copy">
            Email, calendar, and other personal operations inputs can eventually plug into this
            layer.
          </p>
        </section>
      </div>
    </section>
  );
}
