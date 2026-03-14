export default function ProfilePage() {
  return (
    <section className="section-stack">
      <section className="glass-section fade-up">
        <div className="profile-page-hero">
          <div className="profile-page-identity">
            <div className="profile-avatar profile-avatar-xl">S</div>

            <div>
              <div className="eyebrow">Profile</div>
              <h2 className="section-title profile-page-title">Shash</h2>
              <p className="section-copy">
                Building a calmer, sharper system for life admin with beautiful product thinking.
              </p>
            </div>
          </div>

          <div className="profile-page-stats">
            <article className="profile-stat-card">
              <span className="profile-stat-label">Current role</span>
              <strong className="profile-stat-value">Builder</strong>
            </article>

            <article className="profile-stat-card">
              <span className="profile-stat-label">System style</span>
              <strong className="profile-stat-value">Elegant</strong>
            </article>

            <article className="profile-stat-card">
              <span className="profile-stat-label">Focus</span>
              <strong className="profile-stat-value">Control</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="glass-section fade-up">
        <div className="profile-section-head">
          <div>
            <span className="section-kicker">Focus areas</span>
            <h3 className="section-title">What this workspace is optimized for.</h3>
          </div>

          <p className="section-copy">
            The system is designed around recurring admin work, fast scanning, and deliberate action.
          </p>
        </div>

        <div className="pill-row profile-pill-row">
          <span className="pill">Bills</span>
          <span className="pill">Appointments</span>
          <span className="pill">Renewals</span>
          <span className="pill">Follow-ups</span>
          <span className="pill">Documents</span>
          <span className="pill">Tasks</span>
        </div>
      </section>

      <div className="profile-detail-grid">
        <section className="glass-section fade-up profile-detail-card">
          <span className="section-kicker">Operating style</span>
          <h3 className="section-title">Calm, sharp, and intentional.</h3>
          <p className="section-copy">
            From capture to follow-up, every interaction should feel like a premium control surface
            instead of a plain reminder app.
          </p>
        </section>

        <section className="glass-section fade-up profile-detail-card">
          <span className="section-kicker">Current trajectory</span>
          <h3 className="section-title">Turning life admin into a product experience.</h3>
          <p className="section-copy">
            The goal is not just utility. It is rhythm, confidence, beauty, and momentum across the
            whole workspace.
          </p>
        </section>
      </div>
    </section>
  );
}
