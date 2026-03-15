import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      setPending(true);
      const res = await forgotPassword(email);
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request password reset");
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
              <span className="eyebrow">Recover access</span>
              <span className="auth-status-pill">Password reset</span>
            </div>

            <h1 className="hero-title auth-title">Reset your password safely.</h1>

            <p className="hero-subtitle auth-subtitle">
              Enter your account email and we will send a password reset link if the account exists.
            </p>
          </section>

          <section className="glass-section fade-up auth-form-panel">
            <div className="auth-form-head">
              <span className="section-kicker">Recovery</span>
              <h2 className="section-title">Forgot password</h2>
              <p className="section-copy">We will help you get back into your workspace.</p>
            </div>

            <form className="auth-form-grid" onSubmit={handleSubmit}>
              <div className="field-block">
                <label className="field-label" htmlFor="forgot-email">
                  Email address
                </label>
                <input
                  id="forgot-email"
                  className="input-shell"
                  placeholder="shash@example.com"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}
              {success ? <p className="auth-support-copy">{success}</p> : null}

              <button className="primary-btn auth-submit-btn" type="submit" disabled={pending}>
                {pending ? "Sending reset link..." : "Send reset link"}
              </button>

              <p className="auth-switch-copy">
                Back to{" "}
                <Link to="/login" className="auth-switch-link">
                  Sign in
                </Link>
              </p>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}
