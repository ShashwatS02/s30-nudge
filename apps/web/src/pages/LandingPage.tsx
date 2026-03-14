import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <main className="app-shell">
      <div className="app-container">
        <section className="hero-panel fade-up">
          <div className="hero-grid">
            <div>
              <div className="eyebrow">Personal operations, beautifully managed</div>
              <h1 className="hero-title">s30-nudge</h1>
              <p className="hero-subtitle">
                A premium system for handling bills, renewals, appointments, documents, and daily
                life admin with clarity, momentum, and grace.
              </p>

              <div className="pill-row" style={{ marginTop: 20 }}>
                <span className="pill">Capture faster</span>
                <span className="pill">Plan visually</span>
                <span className="pill">Stay in control</span>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
                <Link to="/signup" className="primary-btn">
                  Get started
                </Link>
                <Link to="/login" className="secondary-btn">
                  Sign in
                </Link>
              </div>
            </div>

            <div className="glass-card" style={{ minHeight: 280, display: "grid", gap: 14 }}>
              <div className="metric-card">
                <div className="metric-label">This week</div>
                <div className="metric-value">12</div>
                <div className="metric-foot">Active nudges flowing through your system</div>
              </div>

              <div className="metric-card">
                <div className="metric-label">Upcoming focus</div>
                <div className="metric-value">4</div>
                <div className="metric-foot">Bills, renewals, and appointments already mapped</div>
              </div>

              <div className="metric-card">
                <div className="metric-label">Why it feels premium</div>
                <div className="metric-foot">
                  Clear hierarchy, calmer surfaces, and interactions designed to feel intentional.
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="section-stack">
          <section className="glass-section fade-up">
            <h2 className="section-title">Built for modern life admin</h2>
            <p className="section-copy">
              s30-nudge turns scattered reminders into a polished command center for the things you
              actually need to stay on top of.
            </p>
          </section>

          <section className="glass-section fade-up">
            <h2 className="section-title">What you can manage</h2>
            <div className="pill-row" style={{ marginTop: 14 }}>
              <span className="pill">Bills</span>
              <span className="pill">Renewals</span>
              <span className="pill">Follow-ups</span>
              <span className="pill">Appointments</span>
              <span className="pill">Documents</span>
              <span className="pill">Tasks</span>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
