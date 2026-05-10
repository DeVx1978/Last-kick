"use client";

import "./Footer.css";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── DATOS ───────────────────────────────────────────────────────────────────

const TOURNAMENT_LOGOS = [
  { name: "UEFA Champions League", abbr: "UCL", color: "#1a6fb5", bg: "#0d1b2e" },
  { name: "La Liga", abbr: "LAL", color: "#ef3340", bg: "#1a0308" },
  { name: "Premier League", abbr: "EPL", color: "#3d195b", bg: "#160a20" },
  { name: "Bundesliga", abbr: "BUN", color: "#e32221", bg: "#1c0606" },
  { name: "Serie A", abbr: "SRA", color: "#0057a8", bg: "#00112a" },
  { name: "Ligue 1", abbr: "L1", color: "#dba742", bg: "#1a1200" },
  { name: "Copa Libertadores", abbr: "LIB", color: "#c9a227", bg: "#1a1400" },
  { name: "FIFA World Cup", abbr: "FIFA", color: "#00c853", bg: "#001a0d" },
];

const SPONSOR_BRANDS = [
  { name: "Adidas", icon: "⬡" },
  { name: "Nike", icon: "✓" },
  { name: "Puma", icon: "◈" },
  { name: "Emirates", icon: "◆" },
  { name: "Mastercard", icon: "◉" },
  { name: "Heineken", icon: "✦" },
  { name: "EA Sports", icon: "▣" },
  { name: "Betway", icon: "◎" },
];

const FOOTER_LINKS = {
  plataforma: [
    { label: "Cómo funciona", href: "/how-it-works" },
    { label: "Torneos activos", href: "/tournaments" },
    { label: "Tabla de líderes", href: "/leaderboard" },
    { label: "Historial de partidos", href: "/history" },
    { label: "Mis predicciones", href: "/predictions" },
  ],
  soporte: [
    { label: "Centro de ayuda", href: "/help" },
    { label: "Contacto", href: "/contact" },
    { label: "Reportar un problema", href: "/report" },
    { label: "Estado del servicio", href: "/status" },
  ],
  legal: [
    { label: "Términos y condiciones", href: "/terms" },
    { label: "Política de privacidad", href: "/privacy" },
    { label: "Juego responsable", href: "/responsible-gaming" },
    { label: "Política de cookies", href: "/cookies" },
    { label: "Aviso legal", href: "/legal" },
  ],
  empresa: [
    { label: "Sobre Last Kick", href: "/about" },
    { label: "Afiliados", href: "/affiliates" },
    { label: "Prensa", href: "/press" },
    { label: "Empleo", href: "/careers" },
  ],
};

const SOCIAL_LINKS = [
  {
    name: "Instagram",
    href: "https://instagram.com/lastkick",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "X / Twitter",
    href: "https://x.com/lastkick",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://tiktok.com/@lastkick",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.5a8.27 8.27 0 004.84 1.56V6.59a4.85 4.85 0 01-1.07.1z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@lastkick",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://facebook.com/lastkick",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
];

// ─── SVG ESCUDOS ─────────────────────────────────────────────────────────────
// Escudos simbólicos SVG inline (representación estilizada)
function TournamentBadge({ abbr, color, bg }: { abbr: string; color: string; bg: string }) {
  return (
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: "50%",
        background: bg,
        border: `1.5px solid ${color}33`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 700,
        color,
        fontFamily: "'Orbitron', monospace",
        letterSpacing: "0.5px",
        flexShrink: 0,
        transition: "transform 0.2s ease, border-color 0.2s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "scale(1.12)";
        (e.currentTarget as HTMLDivElement).style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLDivElement).style.borderColor = `${color}33`;
      }}
      title={abbr}
    >
      {abbr}
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function LastKickFooter() {
  const router = useRouter();
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const currentYear = new Date().getFullYear();

  const handleSubscribe = () => {
    if (emailInput.includes("@")) {
      setSubscribed(true);
      setEmailInput("");
    }
  };

  return (
    <footer
      style={{
        background: "linear-gradient(180deg, #050508 0%, #07070d 100%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.85)",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Glow ambiental ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 800,
          height: 2,
          background: "linear-gradient(90deg, transparent, #0070f3 30%, #00c8ff 50%, #0070f3 70%, transparent)",
          opacity: 0.6,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -200,
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 400,
          background: "radial-gradient(ellipse, rgba(0,112,243,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* ── BANDA SUPERIOR: Torneos ── */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "28px 0",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: "3px",
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              marginBottom: 16,
              fontFamily: "'Orbitron', monospace",
            }}
          >
            Torneos oficiales
          </p>
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {TOURNAMENT_LOGOS.map((t) => (
              <div key={t.abbr} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <TournamentBadge abbr={t.abbr} color={t.color} bg={t.bg} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textAlign: "center", maxWidth: 52, lineHeight: 1.2 }}>
                  {t.name.split(" ").slice(-1)[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BANDA SPONSORS ── */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          padding: "20px 0",
          background: "rgba(255,255,255,0.015)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <p style={{ fontSize: 9, letterSpacing: "3px", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginBottom: 14, fontFamily: "'Orbitron', monospace" }}>
            Marcas asociadas
          </p>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
            {SPONSOR_BRANDS.map((b) => (
              <div
                key={b.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 14px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 6,
                  cursor: "default",
                  transition: "border-color 0.2s, background 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.18)";
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                <span style={{ fontSize: 14, opacity: 0.5 }}>{b.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
                  {b.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CUERPO PRINCIPAL ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "52px 24px 40px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "40px 48px",
          }}
        >
          {/* Columna marca */}
          <div style={{ gridColumn: "span 1" }}>
            {/* Logo */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: 4,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: "2px",
                    color: "#fff",
                  }}
                >
                  LAST
                </span>
                <span
                  style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: "2px",
                    color: "#0070f3",
                  }}
                >
                  KICK
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.35)",
                    letterSpacing: "2px",
                    marginLeft: 4,
                    alignSelf: "flex-start",
                    marginTop: 4,
                  }}
                >
                  ™
                </span>
              </div>
              <div
                style={{
                  width: 40,
                  height: 2,
                  background: "linear-gradient(90deg, #0070f3, transparent)",
                  marginBottom: 16,
                  borderRadius: 2,
                }}
              />
              <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 220 }}>
                La plataforma de predicción de fútbol más competitiva del mundo. Predice. Compite. Sobrevive.
              </p>
            </div>

            {/* Redes sociales */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.45)",
                    textDecoration: "none",
                    transition: "color 0.2s, border-color 0.2s, background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(0,112,243,0.6)";
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,112,243,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.45)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.1)";
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  }}
                >
                  {s.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Columnas de links */}
          {(Object.entries(FOOTER_LINKS) as [string, { label: string; href: string }[]][]).map(([section, links]) => (
            <div key={section}>
              <h4
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: 20,
                  fontFamily: "'Orbitron', monospace",
                }}
              >
                {section}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={(e) => { e.preventDefault(); router.push(link.href); }}
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.45)",
                        textDecoration: "none",
                        transition: "color 0.15s",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#fff")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.45)")}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div>
            <h4
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                marginBottom: 20,
                fontFamily: "'Orbitron', monospace",
              }}
            >
              Newsletter
            </h4>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginBottom: 16 }}>
              Recibe alertas de torneos, resultados y promociones exclusivas.
            </p>
            {subscribed ? (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(0,200,83,0.08)",
                  border: "1px solid rgba(0,200,83,0.25)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#00c853",
                }}
              >
                ✓ ¡Suscrito con éxito!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "#fff",
                    outline: "none",
                    width: "100%",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={handleSubscribe}
                  style={{
                    background: "#0070f3",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fff",
                    cursor: "pointer",
                    letterSpacing: "1px",
                    fontFamily: "'Orbitron', monospace",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#0057c2")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#0070f3")}
                >
                  SUSCRIBIRME
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SEPARADOR ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent)" }} />
      </div>

      {/* ── BANDA +18 y COMPLIANCE ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
        <div
          style={{
            display: "flex",
            gap: 20,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          {/* Badge +18 */}
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                width: 52,
                height: 52,
                border: "2.5px solid rgba(255,80,80,0.7)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                fontWeight: 900,
                color: "rgba(255,80,80,0.9)",
                fontFamily: "'Orbitron', monospace",
                letterSpacing: "-1px",
              }}
            >
              +18
            </div>
          </div>
          {/* Texto legal */}
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", lineHeight: 1.65, flex: 1, minWidth: 260 }}>
            <strong style={{ color: "rgba(255,255,255,0.45)" }}>LAST KICK</strong> es una plataforma de predicción deportiva exclusivamente para mayores de 18 años. La participación en torneos de predicción con premios puede estar sujeta a regulaciones locales. Es responsabilidad del usuario verificar la legalidad en su jurisdicción antes de participar. Juega con responsabilidad. Si el juego deja de ser divertido, busca ayuda.{" "}
            <a href="/responsible-gaming" style={{ color: "rgba(0,112,243,0.7)", textDecoration: "none" }}>
              Juego responsable →
            </a>
          </p>
        </div>
      </div>

      {/* ── SEPARADOR ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05) 20%, rgba(255,255,255,0.05) 80%, transparent)" }} />
      </div>

      {/* ── COPYRIGHT BAR ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", fontFamily: "'Orbitron', monospace", letterSpacing: "1px" }}>
              © {currentYear} LAST KICK™
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>|</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Todos los derechos reservados</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>|</span>
            <a href="/terms" style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.25)")}
            >
              T&C
            </a>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>|</span>
            <a href="/privacy" style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.25)")}
            >
              Privacidad
            </a>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>|</span>
            <a href="/cookies" style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.6)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.25)")}
            >
              Cookies
            </a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#00c853",
                boxShadow: "0 0 6px #00c853",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "1px", fontFamily: "'Orbitron', monospace" }}>
              SISTEMA OPERATIVO
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (max-width: 768px) {
          footer .lk-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          footer .lk-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}