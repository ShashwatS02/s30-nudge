import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <main className="app-shell">
        <div className="app-container" style={{ maxWidth: 760 }}>
          <section className="glass-section fade-up">
            <span className="section-kicker">Loading</span>
            <h1 className="section-title">Restoring your workspace.</h1>
            <p className="section-copy">
              Checking your session and bringing the app back into focus.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
