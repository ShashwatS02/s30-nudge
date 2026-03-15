import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      setPending(true);
      await login({
        email,
        password
      });
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setPending(false);
    }
  }

  const handleGoogleLogin = useCallback(
    async (idToken: string) => {
      setError("");

      try {
        setGooglePending(true);
        await loginWithGoogle(idToken);
        navigate("/app");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to sign in with Google");
      } finally {
        setGooglePending(false);
      }
    },
    [loginWithGoogle, navigate]
  );

  return (
    <main className="app-shell auth-shell">
      <div className="app-container auth-container">
        <section className="auth-grid">
          <section className="glass-section fade-up auth-hero-panel">
            <div className="auth-kicker-row">
              <span className="eyebrow">Welcome back</span>
              <span className="auth-status-pill">Personal OS</span>
            </div>

            <h1 className="hero-title auth-title">Sign in to your calmer command center.</h1>

            <p className="hero-subtitle auth-subtitle">
              Continue into a sharper system for bills, renewals, appointments, follow-ups, and
              everyday life admin.
            </p>

            <div className="auth-value-grid">
              <article className="auth-value-card">
                <span className="auth-value-label">Clarity</span>
                <strong className="auth-value-title">See what matters faster</strong>
              </article>

              <article className="auth-value-card">
                <span className="auth-value-label">Control</span>
                <strong className="auth-value-title">Keep everything in one flow</strong>
              </article>

              <article className="auth-value-card">
                <span className="auth-value-label">Momentum</span>
                <strong className="auth-value-title">Move from capture to action cleanly</strong>
              </article>
            </div>
          </section>

          <section className="glass-section fade-up auth-form-panel">
            <div className="auth-form-head">
              <span className="section-kicker">Access</span>
              <h2 className="section-title">Sign in</h2>
              <p className="section-copy">Use your account to enter the workspace.</p>
            </div>

            <form className="auth-form-grid" onSubmit={handleSubmit}>
              <div className="field-block">
                <label className="field-label" htmlFor="login-email">
                  Email address
                </label>
                <input
                  id="login-email"
                  className="input-shell"
                  placeholder="shash@example.com"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="field-block">
                <div className="auth-label-row">
                  <label className="field-label" htmlFor="login-password">
                    Password
                  </label>
                  <Link to="/forgot-password" className="auth-inline-link">
                    Forgot password
                  </Link>
                </div>

                <input
                  id="login-password"
                  className="input-shell"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

              <button className="primary-btn auth-submit-btn" type="submit" disabled={pending}>
                {pending ? "Signing in..." : "Sign in"}
              </button>

              <div className="auth-divider">
                <span>or continue with</span>
              </div>

              <GoogleSignInButton onCredential={handleGoogleLogin} onError={setError} />

              {googlePending ? (
                <p className="auth-support-copy">Signing in with Google...</p>
              ) : null}

              <p className="auth-switch-copy">
                New here?{" "}
                <Link to="/signup" className="auth-switch-link">
                  Create an account
                </Link>
              </p>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}
