import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../lib/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Missing reset token");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setPending(true);
      const res = await resetPassword({ token, password });
      setSuccess(res.message);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="app-shell auth-shell">
      <div className="app-container auth-container">
        <section className="auth-grid">
          <section className="glass-section fade-up auth-hero-panel">
            <div className="auth-kicker-row">
              <span className="eyebrow">Set new access</span>
              <span className="auth-status-pill">Secure reset</span>
            </div>

            <h1 className="hero-title auth-title">Choose a new password.</h1>

            <p className="hero-subtitle auth-subtitle">
              Use at least 10 characters, including 1 number and 1 special character.
            </p>
          </section>

          <section className="glass-section fade-up auth-form-panel">
            <div className="auth-form-head">
              <span className="section-kicker">Reset</span>
              <h2 className="section-title">Create new password</h2>
              <p className="section-copy">This will replace your old password and sign out old sessions.</p>
            </div>

            <form className="auth-form-grid" onSubmit={handleSubmit}>
              <div className="field-block">
                <label className="field-label" htmlFor="reset-password">
                  New password
                </label>
                <input
                  id="reset-password"
                  className="input-shell"
                  type="password"
                  placeholder="Create a new password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <div className="field-block">
                <label className="field-label" htmlFor="reset-confirm-password">
                  Confirm password
                </label>
                <input
                  id="reset-confirm-password"
                  className="input-shell"
                  type="password"
                  placeholder="Confirm your new password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>

              {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
              {success ? (
                <p className="auth-support-copy">
                  {success}{" "}
                  <Link to="/login" className="auth-switch-link">
                    Sign in
                  </Link>
                </p>
              ) : null}

              <button className="primary-btn auth-submit-btn" type="submit" disabled={pending}>
                {pending ? "Resetting password..." : "Reset password"}
              </button>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}
