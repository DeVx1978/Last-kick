export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:ital,wght@0,300;0,400;0,600;0,700;0,900;1,700&family=Barlow:wght@300;400;500;600&family=Syncopate:wght@400;700;900&family=Bebas+Neue&family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@300;400;500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --red: #FF0033;
    --red-dim: rgba(255,0,51,0.35);
    --green: #00C853;
    --green-dim: rgba(0,200,83,0.25);
    --gold: #FFD700;
    --black: #000;
    --panel-bg: rgba(6,0,2,0.92);
    --border: rgba(255,0,51,0.18);
    --font-display: 'Syncopate', sans-serif;
    --font-mono: 'DM Mono', monospace;
    --font-body: 'Space Grotesk', sans-serif;
    --font-impact: 'Bebas Neue', sans-serif;
  }

  .calamar-root {
    background: #000; min-height: 100vh; width: 100vw;
    font-family: var(--font-body); color: #fff; overflow-x: hidden; position: relative;
  }

  .dynamic-bg {
    position: fixed; inset: 0; z-index: 0;
    background-size: cover; background-position: center;
    transition: background-image 0.9s ease;
    filter: brightness(0.28) contrast(1.18) saturate(0.7);
    transform: scale(1.03);
  }

  .vignette {
    position: fixed; inset: 0; z-index: 1;
    background: linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.9) 75%, #000 100%),
                radial-gradient(ellipse at 50% 60%, transparent 20%, rgba(255,0,51,0.1) 100%);
  }

  .scanlines {
    position: fixed; inset: 0; z-index: 2; pointer-events: none;
    background: repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px);
  }

  .noise-overlay {
    position: fixed; inset: 0; z-index: 3; pointer-events: none; opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  .glitch-active .brand-logo::after { display: none !important; }
  .glitch-text::after, .glitch-text::before { display: none !important; }
  .brand-logo { position: relative; }
  .glitch-text { position: relative; }

  /* ── NAVBAR ── */
  .top-nav {
    position: relative; z-index: 20; padding: 24px 5vw;
    display: grid; grid-template-columns: 1fr auto 1fr;
    gap: 20px; border-bottom: 1px solid var(--border);
    background: rgba(0,0,0,0.8); backdrop-filter: blur(12px); align-items: center;
  }
  .nav-left { display: flex; flex-direction: column; gap: 12px; justify-content: flex-start; }
  .nav-center { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .nav-right { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }

  .brand-logo {
    font-family: var(--font-display); font-size: clamp(18px, 2.2vw, 26px);
    font-weight: 700; letter-spacing: -0.5px; color: #fff;
    text-shadow: 0 0 20px rgba(255,0,51,0.5);
  }
  .brand-logo .symbols { color: var(--red); letter-spacing: 4px; text-shadow: 0 0 12px var(--red), 0 0 30px rgba(255,0,51,0.4); }

  .jackpot-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(0,200,83,0.07); border: 1px solid rgba(0,200,83,0.3);
    padding: 6px 14px; backdrop-filter: blur(4px); width: fit-content;
  }
  .jackpot-label { font-family: var(--font-mono); font-size: 9px; color: rgba(255,255,255,0.5); letter-spacing: 2px; text-transform: uppercase; }
  .jackpot-value { font-family: var(--font-display); font-size: 13px; color: var(--green); font-weight: 700; text-shadow: 0 0 10px rgba(0,200,83,0.6); }

  .countdown-strip { display: flex; align-items: center; gap: 10px; }
  .countdown-unit {
    display: flex; flex-direction: column; align-items: center;
    background: rgba(0,200,83,0.05); border: 1px solid var(--green);
    padding: 10px 14px; min-width: 60px;
    box-shadow: 0 0 15px rgba(0,200,83,0.3), inset 0 0 10px rgba(0,200,83,0.1);
    position: relative; border-radius: 2px;
  }
  .countdown-val { font-family: var(--font-impact); font-size: clamp(22px, 2.5vw, 32px); line-height: 1; color: #fff; letter-spacing: 1px; }
  .countdown-label { font-family: var(--font-mono); font-size: 8px; color: var(--green); opacity: 0.9; letter-spacing: 2.5px; margin-top: 5px; font-weight: bold; }
  .countdown-sep { font-family: var(--font-impact); font-size: 32px; color: var(--green); opacity: 1; margin-bottom: 12px; text-shadow: 0 0 15px var(--green); }
  .countdown-sub { font-family: var(--font-mono); font-size: 9px; color: var(--green); opacity: 0.6; letter-spacing: 4px; text-transform: uppercase; }

  .nav-stats { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
  .stat-pill {
    display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.5);
    border: 1px solid; padding: 10px 16px; backdrop-filter: blur(6px); min-width: 130px;
  }
  .stat-alive { border-color: rgba(0,200,83,0.4); box-shadow: inset 0 0 20px rgba(0,200,83,0.08); }
  .stat-coma  { border-color: rgba(255,170,0,0.4); box-shadow: inset 0 0 20px rgba(255,170,0,0.08); }
  .stat-dead  { border-color: rgba(255,0,51,0.4);  box-shadow: inset 0 0 20px rgba(255,0,51,0.08); }
  .stat-num { font-family: var(--font-display); font-size: 15px; font-weight: 700; }
  .stat-alive .stat-num { color: var(--green); }
  .stat-coma  .stat-num { color: #FFAA00; }
  .stat-dead  .stat-num { color: var(--red); }
  .stat-lbl { font-family: var(--font-mono); font-size: 8px; color: rgba(255,255,255,0.4); letter-spacing: 2px; }
  .stat-alive svg { color: var(--green); }
  .stat-coma  svg { color: #FFAA00; }
  .stat-dead  svg { color: var(--red); }

  .pulse-icon { animation: pulse 1.4s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* ── ALERT FEED ── */
  .alert-feed { position: fixed; bottom: 30px; right: 30px; z-index: 5000; display: flex; flex-direction: column; gap: 12px; pointer-events: none; }
  .alert-box { background: rgba(0,0,0,0.9); border: 1px solid; padding: 14px 20px; backdrop-filter: blur(10px); font-family: var(--font-mono); font-size: 10px; color: #fff; display: flex; align-items: center; gap: 12px; min-width: 280px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }

  /* ── HERO ── */
  .hero-title {
    font-family: 'Arial Black', sans-serif;
    font-size: clamp(52px, 7vw, 110px);
    line-height: .92;
    letter-spacing: -2px;
    color: #fff;
    margin: 0 0 20px;
  }
  .hero-title span { color: var(--red); }
  .hero-line1 { display: block; color: #fff; text-shadow: 0 4px 40px rgba(255,0,51,0.4); }
  .hero-vs { display: block; color: #ff003c; font-size: .55em; text-shadow: 0 0 30px rgba(255,0,60,.75); }
  .hero-line2 { display: block; color: #fff; text-shadow: 0 4px 40px rgba(255,0,51,0.4); }
  .hero-sub { font-size: clamp(13px, 1.5vw, 16px); color: rgba(255,255,255,0.65); line-height: 1.7; max-width: 520px; margin-bottom: 40px; font-weight: 300; }

  .hero-label {
    display: flex; align-items: center; gap: 10px;
    font-size: 11px; letter-spacing: 4px;
    color: rgba(255,255,255,0.45); text-transform: uppercase;
    margin-bottom: 16px;
  }
  .hero-line { width: 32px; height: 2px; background: var(--red); flex-shrink: 0; }

  .hero-desc {
    color: rgba(255,255,255,0.62); font-size: 16px;
    line-height: 1.7; margin: 0 0 32px;
  }

  .hero-cta-group { display: flex; gap: 16px; flex-wrap: wrap; }

  .btn-login {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 16px 30px; border: 1px solid rgba(0,255,120,.35);
    background: rgba(0,255,120,.08); color: #00ff88;
    font-weight: 800; letter-spacing: 2px; text-transform: uppercase;
    cursor: pointer; font-size: 14px;
    transition: transform .25s ease, background .25s ease, box-shadow .25s ease, border-color .25s ease;
  }
  .btn-login:hover {
    transform: translateY(-2px); background: rgba(0,255,120,.14);
    border-color: #00ff88; box-shadow: 0 0 14px rgba(0,255,120,.18);
  }

  .btn-register {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 16px 34px; border: none; background: #ffffff;
    color: #ff0040; font-weight: 900; letter-spacing: 2px;
    text-transform: uppercase; cursor: pointer; font-size: 14px;
    position: relative; overflow: hidden;
    transition: transform .25s ease, background .25s ease, color .25s ease, box-shadow .25s ease;
  }
  .btn-register:hover {
    background: #ff0040; color: #ffffff;
    transform: translateY(-2px); box-shadow: 0 0 18px rgba(255,0,70,.22);
  }

  .hero-meta {
    display: flex; flex-wrap: wrap; gap: 18px; margin-top: 24px;
    font-size: 12px; letter-spacing: 1px; color: rgba(255,255,255,.55);
  }
  .hero-meta span { display: flex; align-items: center; gap: 6px; }

  /* ── PANEL STATUS LIVE ── */
  .hero-panel {
    width: 420px; max-width: 100%; padding: 26px;
    border: 1px solid rgba(255,0,60,.25); background: rgba(0,0,0,.62);
    backdrop-filter: blur(12px); position: relative;
    box-shadow: 0 0 40px rgba(255,0,60,.08), inset 0 0 20px rgba(255,0,60,.04);
  }
  .hero-panel::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--red), transparent); box-shadow: 0 0 10px var(--red); }
  .panel-header { display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 10px; color: rgba(255,255,255,0.4); letter-spacing: 2px; padding-bottom: 16px; border-bottom: 1px solid var(--border); margin-bottom: 16px; }
  .panel-dot { width: 6px; height: 6px; background: var(--green); border-radius: 50%; margin-left: auto; box-shadow: 0 0 8px var(--green); animation: pulse 1.4s ease-in-out infinite; }
  .panel-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .panel-key { font-family: var(--font-mono); font-size: 9px; color: rgba(255,255,255,0.35); letter-spacing: 2px; }
  .panel-val { font-family: var(--font-mono); font-size: 11px; color: rgba(255,255,255,0.85); font-weight: 500; }
  .panel-val.green { color: var(--green); text-shadow: 0 0 8px rgba(0,200,83,0.4); }
  .panel-val.red   { color: var(--red);   text-shadow: 0 0 8px rgba(255,0,51,0.4); }
  .panel-val.gold  { color: var(--gold);  text-shadow: 0 0 8px rgba(255,215,0,0.4); }
  .panel-divider { margin: 16px 0; height: 1px; background: var(--red); opacity: 0.3; }
  .panel-warning { display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 9px; color: var(--red); letter-spacing: 2px; text-transform: uppercase; background: rgba(255,0,51,0.08); padding: 10px; border: 1px solid rgba(255,0,51,0.2); }

  /* ── CARDS / PS5 ── */
  .ps5-grid-6 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; width: 100%; max-width: 1100px; margin: 0 auto; position: relative; z-index: 10; }
  .ps5-card { background: rgba(10,0,2,0.6); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.05); padding: 30px; display: flex; flex-direction: column; transition: all 0.4s ease; border-radius: 4px; position: relative; overflow: hidden; cursor: pointer; }
  .ps5-card::before { content: ''; position: absolute; left: 0; top: 0; width: 100%; height: 2px; background: var(--card-color); opacity: 0.5; transition: 0.3s; }
  .ps5-card:hover { background: rgba(20,0,5,0.8); border-color: rgba(255,0,51,0.3); }
  .ps5-card.active { border-color: var(--card-color); background: rgba(0,0,0,0.9); }
  .ps5-card.active::before { opacity: 1; box-shadow: 0 0 15px var(--card-color); }

  /* ── FOOTER ── */
  .lk-footer { background: #05050a; border-top: 1px solid rgba(0,200,83,0.15); padding: 4rem 0 2.5rem; font-family: 'Barlow', sans-serif; width: 100%; position: relative; z-index: 10; }
  .lk-footer-container { max-width: 1160px; margin: 0 auto; padding: 0 2rem; }
  .lk-footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 3rem; margin-bottom: 3rem; padding-bottom: 3rem; border-bottom: 1px solid rgba(255,255,255,0.03); }
  .lk-footer-brand .lk-logo { font-family: 'Anton', sans-serif; font-size: 2.2rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; color: #fff; }
  .lk-logo-kick { color: #00C853; }
  .lk-footer-brand p { font-size: 0.85rem; color: #666; line-height: 1.6; max-width: 280px; }
  .lk-footer-col-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 0.75rem; letter-spacing: 0.3em; text-transform: uppercase; color: #00C853; margin-bottom: 1.2rem; }
  .lk-footer-links { display: flex; flex-direction: column; gap: 12px; }
  .lk-footer-links a { font-size: 0.88rem; color: #444; text-decoration: none; transition: all 0.3s ease; }
  .lk-footer-links a:hover { color: #00C853; padding-left: 5px; }
  .lk-footer-bottom { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
  .lk-footer-copy { font-family: 'DM Mono', monospace; font-size: 10px; color: #333; letter-spacing: 1px; }
  .lk-footer-hashtags { display: flex; gap: 1rem; }
  .lk-footer-tag { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 0.75rem; letter-spacing: 0.1em; color: #00C853; opacity: 0.6; }

  /* ── CARRUSEL / PROMO ── */
  .intel-carousel { width: 100%; height: 520px; overflow: hidden; position: relative; border-radius: 24px; }
  .slides-track { display: flex; gap: 20px; width: max-content; padding: 0 20px; animation: scrollLK 28s ease-in-out infinite; }
  .promo-slide { position: relative; flex-shrink: 0; height: 620px; overflow: hidden; border-radius: 28px; box-shadow: 0 25px 70px rgba(0,0,0,.55); transition: all .45s ease; }
  .promo-slide:nth-child(1) { width: 980px; opacity: 1; z-index: 3; }
  .promo-slide:nth-child(2), .promo-slide:nth-child(3), .promo-slide:nth-child(4) { width: 180px; opacity: .55; }
  .promo-slide img { width: 100%; height: 100%; object-fit: cover; display: block; filter: brightness(.52); transition: all .4s ease; }
  .promo-slide:hover img { transform: scale(1.04); }
  .promo-overlay { position: absolute; left: 60px; bottom: 55px; z-index: 5; max-width: 620px; }
  .promo-slide:not(:first-child) .promo-overlay { display: none; }
  .promo-badge { display: inline-block; padding: 8px 14px; border-radius: 50px; background: rgba(0,0,0,.55); border: 1px solid rgba(0,255,136,.35); color: #00ff88; font-size: 13px; font-weight: 900; margin-bottom: 16px; }
  .promo-badge.live { color: #ff4040; border-color: rgba(255,80,80,.35); }
  .promo-overlay h2 { font-size: 58px; color: #fff; font-weight: 900; line-height: 1; margin-bottom: 14px; }
  .promo-overlay p { font-size: 20px; color: rgba(255,255,255,.9); margin-bottom: 22px; }
  .promo-overlay button { border: none; padding: 16px 30px; border-radius: 14px; background: linear-gradient(90deg,#00ff88,#00c96b); color: #000; font-weight: 900; font-size: 15px; cursor: pointer; box-shadow: 0 12px 35px rgba(0,255,136,.35); transition: .25s ease; }
  .promo-overlay button:hover { transform: translateY(-2px); }

  @keyframes scrollLK {
    0%,20%   { transform: translateX(0); }
    25%,45%  { transform: translateX(-1180px); }
    50%,70%  { transform: translateX(-1380px); }
    75%,95%  { transform: translateX(-1580px); }
    100%     { transform: translateX(0); }
  }

  /* ── ANIMACIONES GLOBALES ── */
  @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .ops-ticker { display: inline-flex; gap: 60px; animation: ticker 30s linear infinite; font-family: var(--font-mono); font-size: 10px; color: rgba(255,255,255,0.4); letter-spacing: 3px; text-transform: uppercase; }

  /* ══════════════════════════
     RESPONSIVE — TABLET 768px
  ══════════════════════════ */
  @media (max-width: 768px) {

    .top-nav {
      display: flex; flex-direction: column;
      align-items: center; gap: 16px; padding: 14px;
    }
    .nav-left, .nav-center, .nav-right {
      width: 100%; text-align: center;
      align-items: center; justify-content: center;
    }
    .brand-logo { font-size: 22px; }
    .countdown-strip { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
    .countdown-unit { min-width: 58px; }
    .countdown-val { font-size: 24px; }
    .countdown-label { font-size: 10px; }
    .countdown-sub { font-size: 10px; letter-spacing: 2px; }
    .jackpot-badge { width: 100%; justify-content: center; }
    .nav-stats { display: grid; grid-template-columns: 1fr; gap: 8px; width: 100%; }
    .stat-pill { width: 100%; justify-content: center; }

    .hero-area { display: flex; flex-direction: column; padding: 110px 20px 50px; gap: 30px; }
    .hero-content, .hero-panel { width: 100%; max-width: 100%; }
    .hero-cta-group { flex-direction: column; width: 100%; }
    .hero-cta-group button { width: 100%; }

    .lk-footer-top { grid-template-columns: 1fr 1fr; gap: 2rem; }

    .slides-track { gap: 12px; padding: 0; animation: none; overflow-x: auto; }
    .promo-slide,
    .promo-slide:nth-child(1),
    .promo-slide:nth-child(2),
    .promo-slide:nth-child(3),
    .promo-slide:nth-child(4) { width: 92vw; height: 420px; opacity: 1; }
    .promo-slide .promo-overlay { display: block; left: 22px; right: 22px; bottom: 24px; }
    .promo-overlay h2 { font-size: 30px; }
    .promo-overlay p { font-size: 14px; }
    .promo-overlay button { padding: 12px 18px; font-size: 13px; }

    .game-modal-overlay { padding: 0; }
    .game-modal-content { height: 100vh !important; border-radius: 0 !important; border: none !important; border-top: 1px solid var(--gold) !important; }
  }

  /* ══════════════════════════
     RESPONSIVE — MOBILE 480px
  ══════════════════════════ */
  @media (max-width: 480px) {
    .top-nav { padding: 12px 10px; gap: 12px; }
    .brand-logo { font-size: 18px; line-height: 1.1; }
    .countdown-strip { gap: 6px; }
    .countdown-unit { min-width: 48px; padding: 6px; }
    .countdown-val { font-size: 20px; }
    .countdown-label { font-size: 9px; }
    .countdown-sub { font-size: 9px; letter-spacing: 1px; }
    .jackpot-badge { padding: 8px; }
    .jackpot-value { font-size: 18px; }
    .stat-pill { padding: 8px; }
    .hero-area { padding: 100px 14px 40px; }
    .hero-title { font-size: clamp(40px, 13vw, 58px) !important; }
    .hero-desc { font-size: 15px !important; }
    .hero-cta-group { flex-direction: column; width: 100%; }
    .hero-cta-group button { width: 100%; }
    .lk-footer-top { grid-template-columns: 1fr; }
    .lk-footer-bottom { flex-direction: column; text-align: center; }
  }
`;