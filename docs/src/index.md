---
hide:
  - toc
  - navigation
  - footer
---

<style>
  /* ---------- Homepage-only theme overrides ---------- */
  /* The lofi background is integral to the hero design, so the homepage
     stays night-themed regardless of the user's light/dark preference. */
  [data-md-color-scheme="slate"],
  [data-md-color-scheme="default"] {
    --md-default-bg-color: var(--nexus-night-sky);
    --md-default-fg-color: var(--nexus-night-text);
    --md-default-fg-color--light: var(--nexus-night-text-soft);
    --md-default-fg-color--lighter: var(--nexus-night-text-muted);
    --md-typeset-a-color: var(--nexus-night-purple);
    --md-accent-fg-color: var(--nexus-night-gold);
  }

  body {
    background-color: var(--nexus-night-sky);
  }

  body::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -2;
    background-image: url("assets/images/lofi-kenny.webp");
    background-size: cover;
    background-position: bottom;
    pointer-events: none;
  }

  body::after {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      rgba(10, 14, 39, 0.55) 0%,
      rgba(10, 14, 39, 0.45) 40%,
      rgba(10, 14, 39, 0.7) 100%
    );
  }

  @media (max-width: 768px) {
    body::before {
      background-image: url("assets/images/lofi-kenny-vertical.webp");
    }
  }

  .md-header {
    background-color: rgba(10, 14, 39, 0.6) !important;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .md-main,
  .md-container {
    background: transparent !important;
  }

  /* Hide Material's auto-generated h1 + edit button on this page only */
  .md-typeset h1:first-child,
  .md-content__button {
    display: none;
  }

  .md-tabs,
  .md-footer {
    display: none;
  }

  @media (min-width: 768px) {
    html,
    body {
      overflow: hidden;
    }
  }

  /* ---------- Hero ---------- */
  .nexus-hero {
    position: relative;
    z-index: 1;
    max-width: 64rem;
    margin: 0 auto;
    padding: 5rem 0 3rem;
    animation: nexus-slide-in-up 0.8s ease-out;
  }

  .nexus-hero__greeting {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--nexus-night-text-muted);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 1rem;
  }

  .nexus-hero__title {
    margin: 0 0 1.25rem;
    font-size: clamp(2rem, 3.5vw + 1rem, 3.5rem);
    font-weight: 700;
    line-height: 1.1;
    color: var(--nexus-night-text);
  }

  .nexus-hero__brand {
    position: relative;
    display: inline-block;
    background: linear-gradient(
      90deg,
      var(--nexus-night-purple),
      var(--nexus-night-purple-deep)
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .nexus-hero__brand::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -0.4rem;
    height: 4px;
    width: 100%;
    border-radius: 2px;
    background: linear-gradient(
      90deg,
      var(--nexus-night-purple),
      var(--nexus-night-purple-deep)
    );
    transform-origin: left center;
    transform: scaleX(0);
    animation: nexus-expand-width 1s ease-out 0.5s forwards;
  }

  .nexus-hero__subtitle {
    max-width: 42rem;
    margin: 1.5rem 0 2rem;
    font-size: 1.05rem;
    line-height: 1.65;
    color: var(--nexus-night-text-soft);
  }

  .nexus-hero__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
  }

  /* ---------- CTAs (gold primary + glass ghost) ---------- */
  .nexus-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 1.1rem;
    font-weight: 500;
    font-size: 0.85rem;
    border-radius: 0.45rem;
    text-decoration: none !important;
    transition:
      transform 0.25s ease,
      box-shadow 0.3s ease,
      background 0.3s ease;
  }

  .nexus-cta--primary {
    background: linear-gradient(
      90deg,
      var(--nexus-night-gold),
      var(--nexus-night-gold-deep)
    );
    color: var(--nexus-night-sky) !important;
    box-shadow: 0 10px 25px -8px rgba(240, 168, 48, 0.45);
  }

  .nexus-cta--primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 32px -8px rgba(240, 168, 48, 0.55);
  }

  .nexus-cta--ghost {
    background: rgba(255, 255, 255, 0.05);
    color: var(--nexus-night-text) !important;
    border: 1px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .nexus-cta--ghost:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }

  /* ---------- Pillar + link cards ---------- */
  .nexus-pillars {
    position: relative;
    z-index: 1;
    max-width: 64rem;
    margin: 0 auto;
    padding: 1rem 0 5rem;
  }

  .nexus-grid {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }

  .nexus-grid + .nexus-grid {
    margin-top: 1.5rem;
  }

  .nexus-card,
  .nexus-link-card {
    border-radius: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background-color: rgba(15, 27, 61, 0.4);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 1.25rem 1.35rem;
    box-shadow: 0 18px 40px -22px rgba(0, 0, 0, 0.6);
  }

  .nexus-card h2 {
    margin: 0 0 0.4rem;
    font-size: 0.95rem;
    color: var(--nexus-night-text);
    font-weight: 600;
  }

  .nexus-card p {
    margin: 0;
    color: var(--nexus-night-text-soft);
    line-height: 1.6;
    font-size: 0.85rem;
  }

  .nexus-link-card {
    display: block;
    text-decoration: none !important;
    color: inherit;
    transition:
      transform 0.25s ease,
      border-color 0.25s ease,
      background 0.25s ease;
  }

  .nexus-link-card:hover {
    transform: translateY(-2px);
    border-color: rgba(102, 126, 234, 0.4);
    background-color: rgba(15, 27, 61, 0.6);
  }

  .nexus-link-card h3 {
    margin: 0 0 0.3rem;
    font-size: 0.95rem;
    color: var(--nexus-night-text);
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nexus-link-card__arrow {
    color: var(--nexus-night-purple);
    transition: transform 0.25s ease;
  }

  .nexus-link-card:hover .nexus-link-card__arrow {
    transform: translateX(4px);
  }

  .nexus-link-card p {
    margin: 0;
    color: var(--nexus-night-text-muted);
    font-size: 0.8rem;
    line-height: 1.5;
  }

  /* ---------- Animations (mirrored from the portfolio) ---------- */
  @keyframes nexus-slide-in-up {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes nexus-expand-width {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
</style>

<section class="nexus-hero">
  <span class="nexus-hero__greeting">A personal developer platform</span>
  <h1 class="nexus-hero__title">
    Welcome to <span class="nexus-hero__brand">Nexus</span>
  </h1>
  <p class="nexus-hero__subtitle">
    A space to experiment with cloud-native infrastructure and build a solid,
    reusable foundation for every side project — so I can stop reinventing
    CI/CD, secrets, and deployment for each new idea.
  </p>
  <div class="nexus-hero__actions">
    <a class="nexus-cta nexus-cta--primary" href="getting-started/01-overview/">
      Get started &rarr;
    </a>
    <a class="nexus-cta nexus-cta--ghost" href="https://github.com/kbntx/nexus" target="_blank" rel="noopener noreferrer">
      View on GitHub
    </a>
  </div>
</section>

<section class="nexus-pillars">
  <div class="nexus-grid">
    <article class="nexus-card">
      <h2>Why this exists</h2>
      <p>
        Platform engineering is what I do for a living, and I wanted somewhere
        to practice the craft without production constraints. Nexus is that
        space — opinionated, fully declarative, and built end-to-end from
        infrastructure provisioning to application delivery.
      </p>
    </article>
    <article class="nexus-card">
      <h2>A learning environment</h2>
      <p>
        Every component is chosen because I want to understand it deeply, not
        just use it. If something feels like a black box, it does not belong
        in Nexus. The docs cover the <em>why</em> behind each choice, not
        just the how.
      </p>
    </article>
  </div>

  <div class="nexus-grid">
    <a class="nexus-link-card" href="getting-started/01-overview/">
      <h3>Getting Started <span class="nexus-link-card__arrow">&rarr;</span></h3>
      <p>What Nexus is, how it's architected, and how to run it locally.</p>
    </a>
    <a class="nexus-link-card" href="platform/ci-cd/01-overview/">
      <h3>Platform <span class="nexus-link-card__arrow">&rarr;</span></h3>
      <p>A deep dive into each component: GitOps, networking, secrets, observability, CI/CD, and more.</p>
    </a>
  </div>
</section>
