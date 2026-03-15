import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp, loginWithGoogle } = useAuth();

  const [fullName, setFullName] = useState("");
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
      await signUp({
        fullName,
        email,
        password
      });
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
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
        setError(err instanceof Error ? err.message : "Failed to continue with Google");
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
              <span className="eyebrow">Start your system</span>
              <span className="auth-status-pill">Premium flow</span>
            </div>

            <h1 className="hero-title auth-title">
              Create an account for a sharper life-admin system.
            </h1>

            <p className="hero-subtitle auth-subtitle">
              Build a calmer way to stay ahead of bills, deadlines, appointments, documents, and
              all the recurring things that normally feel scattered.
            </p>

            <div className="auth-value-grid">
              <article className="auth-value-card">
                <span className="auth-value-label">Capture</span>
                <strong className="auth-value-title">Bring new items into motion quickly</strong>
              </article>

              <article className="auth-value-card">
                <span className="auth-value-label">Plan</span>
                <strong className="auth-value-title">See urgency, timing, and flow clearly</strong>
              </article>

              <article className="auth-value-card">
                <span className="auth-value-label">Operate</span>
                <strong className="auth-value-title">
                  Turn life admin into a real product experience
                </strong>
              </article>
            </div>
          </section>

          <section className="glass-section fade-up auth-form-panel">
            <div className="auth-form-head">
              <span className="section-kicker">Account</span>
              <h2 className="section-title">Create account</h2>
              <p className="section-copy">
                Passwords must be at least 10 characters and include a number and a special
                character.
              </p>
            </div>

            <form className="auth-form-grid" onSubmit={handleSubmit}>
              <div className="field-block">
                <label className="field-label" htmlFor="signup-name">
                  Full name
                </label>
                <input
                  id="signup-name"
                  className="input-shell"
                  placeholder="Shash"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </div>

              <div className="field-block">
                <label className="field-label" htmlFor="signup-email">
                  Email address
                </label>
                <input
                  id="signup-email"
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
                <label className="field-label" htmlFor="signup-password">
                  Password
                </label>
                <input
                  id="signup-password"
                  className="input-shell"
                  type="password"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <p className="auth-support-copy">
                Example: at least 10 characters, 1 number, and 1 special character.
              </p>

              {error ? <p className="auth-feedback auth-feedback-error">{error}</p> : null}

              <button className="primary-btn auth-submit-btn" type="submit" disabled={pending}>
                {pending ? "Creating account..." : "Create account"}
              </button>

              <div className="auth-divider">
                <span>or continue with</span>
              </div>

              <GoogleSignInButton
                onCredential={handleGoogleLogin}
                onError={setError}
                text="signup_with"
              />

              {googlePending ? (
                <p className="auth-support-copy">Continuing with Google...</p>
              ) : null}

              <p className="auth-switch-copy">
                Already have an account?{" "}
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
