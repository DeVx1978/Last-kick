"use client";


import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import "./LiveMatches.css";

// ─── TIPOS ───────────────────────────────────────────────────────────────────
interface Tournament {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  emoji: string;
  accentColor: string;
  glowColor: string;
  entryFee: string;
  prize: string;
  players: string;
  status: "ACTIVO" | "PRÓXIMO" | "FINALIZADO";
  badge?: string;
  href: string;
}

// ─── DATOS DE TORNEOS ─────────────────────────────────────────────────────────
// Edita estos datos con los torneos reales de tu plataforma
const TOURNAMENTS: Tournament[] = [
  {
    id: "mundial2026",
    slug: "mundial",
    name: "FIFA WORLD CUP",
    subtitle: "MUNDIAL 2026",
    emoji: "🌍",
    accentColor: "#00C853",
    glowColor: "rgba(0,200,83,0.45)",
    entryFee: "$5 USD",
    prize: "$500,000+",
    players: "142,500",
    status: "PRÓXIMO",
    badge: "GRAN FINAL",
    href: "/fixture",
  },
  {
    id: "champions",
    slug: "champions",
    name: "UEFA CHAMPIONS",
    subtitle: "LEAGUE 2025/26",
    emoji: "⭐",
    accentColor: "#00B0FF",
    glowColor: "rgba(0,176,255,0.45)",
    entryFee: "$3 USD",
    prize: "$50,000",
    players: "38,200",
    status: "ACTIVO",
    badge: "EN VIVO",
    href: "/champions",
  },
  {
    id: "laliga",
    slug: "laliga",
    name: "LA LIGA",
    subtitle: "ESPAÑA 2024/25",
    emoji: "🇪🇸",
    accentColor: "#FF6D00",
    glowColor: "rgba(255,109,0,0.45)",
    entryFee: "$2 USD",
    prize: "$20,000",
    players: "21,800",
    status: "ACTIVO",
    href: "/laliga",
  },
  {
    id: "premier",
    slug: "premier",
    name: "PREMIER LEAGUE",
    subtitle: "INGLATERRA 2024/25",
    emoji: "🦁",
    accentColor: "#9C27B0",
    glowColor: "rgba(156,39,176,0.45)",
    entryFee: "$2 USD",
    prize: "$25,000",
    players: "29,400",
    status: "ACTIVO",
    href: "/premier",
  },
  {
    id: "libertadores",
    slug: "libertadores",
    name: "LIBERTADORES",
    subtitle: "CONMEBOL 2025",
    emoji: "🏆",
    accentColor: "#FFD700",
    glowColor: "rgba(255,215,0,0.45)",
    entryFee: "$2 USD",
    prize: "$30,000",
    players: "44,100",
    status: "PRÓXIMO",
    href: "/libertadores",
  },
  {
    id: "euroliga",
    slug: "euroliga",
    name: "EURO 2028",
    subtitle: "CLASIFICATORIAS",
    emoji: "🌟",
    accentColor: "#FF0033",
    glowColor: "rgba(255,0,51,0.45)",
    entryFee: "$2 USD",
    prize: "$15,000",
    players: "12,300",
    status: "PRÓXIMO",
    href: "/euro",
  },
  {
    id: "copaamerica",
    slug: "copa-america",
    name: "COPA AMÉRICA",
    subtitle: "EDICIÓN ESPECIAL",
    emoji: "🦅",
    accentColor: "#00E5FF",
    glowColor: "rgba(0,229,255,0.45)",
    entryFee: "$2 USD",
    prize: "$18,000",
    players: "31,700",
    status: "PRÓXIMO",
    href: "/copa-america",
  },
  {
    id: "mundial-femenino",
    slug: "mundial-femenino",
    name: "WORLD CUP FEMENINO",
    subtitle: "EDICIÓN 2027",
    emoji: "👑",
    accentColor: "#E91E8C",
    glowColor: "rgba(233,30,140,0.45)",
    entryFee: "$3 USD",
    prize: "$40,000",
    players: "18,900",
    status: "PRÓXIMO",
    href: "/mundial-femenino",
  },
];

 

// ─── COMPONENTE ───────────────────────────────────────────────────────────────
export default function TournamentsPS5Section() {
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(0);
  const [offset, setOffset] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const CARD_WIDTH = 200;
  const CARD_GAP = 16;
  const CARD_STEP = CARD_WIDTH + CARD_GAP;

  // Calcula el offset para centrar la card activa
  const centerCard = useCallback((idx: number) => {
    if (!trackRef.current) return;
    const containerWidth = trackRef.current.parentElement?.clientWidth || 800;
    const newOffset = -(idx * CARD_STEP) + (containerWidth / 2) - (CARD_WIDTH / 2);
    setOffset(newOffset);
  }, [CARD_STEP, CARD_WIDTH]);

  useEffect(() => {
    centerCard(activeIdx);
  }, [activeIdx, centerCard]);

  // Recalcular en resize
  useEffect(() => {
    const handleResize = () => centerCard(activeIdx);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIdx, centerCard]);

  // Navegar con teclado cuando el foco está en la sección
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setActiveIdx(i => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setActiveIdx(i => Math.min(TOURNAMENTS.length - 1, i + 1));
      if (e.key === "Enter") router.push(TOURNAMENTS[activeIdx].href);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIdx, router]);

  const goNext = () => setActiveIdx(i => Math.min(TOURNAMENTS.length - 1, i + 1));
  const goPrev = () => setActiveIdx(i => Math.max(0, i - 1));

  const active = TOURNAMENTS[activeIdx];

  // Genera un background gradiente para las cards sin imagen
const cardBg = (t: Tournament) =>
"radial-gradient(ellipse at 30% 70%, " +
t.accentColor +
"22 0%, transparent 70%), linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0d0d0d 100%)";

  return (
    <section className="ps5-section" ref={sectionRef}>

      {/* ── Fondos animados ── */}
      <div className="ps5-bg-image" /> 
      <div className="ps5-bg-canvas" />
      <div className="ps5-grid-bg" />
      <div className="ps5-orb ps5-orb-1" />
      <div className="ps5-orb ps5-orb-2" />
      <div className="ps5-orb ps5-orb-3" />

      {/* ── Header ── */}
      <div className="ps5-header">
        <div className="ps5-header-left">
          <div className="ps5-header-tag">
            Selecciona tu arena
            <span className="ps5-header-dot" />
          </div>
          <h2 className="ps5-main-title">
            TORNEOS<br />
            <span>EN CURSO</span>
          </h2>
          <p className="ps5-header-desc">
            Elige tu torneo, registra tu predicción y compite contra miles de jugadores.
            Cada torneo es una nueva oportunidad de demostrar que eres el mejor predictor del mundo.
          </p>
        </div>
        <div className="ps5-header-stats">
          <div className="ps5-hstat">
            <div className="ps5-hstat-val">{TOURNAMENTS.filter(t => t.status === "ACTIVO").length}</div>
            <div className="ps5-hstat-label">Activos</div>
          </div>
          <div className="ps5-hstat">
            <div className="ps5-hstat-val">{TOURNAMENTS.length}</div>
            <div className="ps5-hstat-label">Torneos</div>
          </div>
          <div className="ps5-hstat">
            <div className="ps5-hstat-val">$643K+</div>
            <div className="ps5-hstat-label">En premios</div>
          </div>
        </div>
      </div>

      {/* ── Carrusel ── */}
      <div className="ps5-carousel-wrap">
        <div style={{ position: "relative" }}>

          {/* Botón izquierda */}
          <button
            className="ps5-nav-btn ps5-nav-left"
            onClick={goPrev}
            aria-label="Anterior torneo"
            disabled={activeIdx === 0}
            style={{ opacity: activeIdx === 0 ? 0.3 : 1 }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9l5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Track */}
          <div className="ps5-track-outer">
            <div
              ref={trackRef}
              className="ps5-track"
              style={{ transform: `translateX(${offset}px)` }}
            >
              {TOURNAMENTS.map((t, i) => {
                const isActive = i === activeIdx;
                const isNeighbor = Math.abs(i - activeIdx) === 1;
                return (
                  <div
                    key={t.id}
                    className={`ps5-card ${isActive ? "active" : ""} ${isNeighbor ? "neighbor" : ""}`}
                    style={{
                      "--card-accent": t.accentColor,
                      "--card-glow": t.glowColor,
                    } as React.CSSProperties}
                    onClick={() => {
                      if (isActive) {
                        router.push(t.href);
                      } else {
                        setActiveIdx(i);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${t.name} - ${t.subtitle}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (isActive) router.push(t.href);
                        else setActiveIdx(i);
                      }
                    }}
                  >
                    {/* Top accent indicator */}
                    <div className="ps5-card-top-indicator" />

                    {/* Fondo de la card */}
                    <div
                      className="ps5-card-bg"
                      style={{ background: cardBg(t) }}
                    />

                    {/* Patrón decorativo */}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `
                        radial-gradient(circle at 70% 20%, ${t.accentColor}18 0%, transparent 50%),
                        repeating-linear-gradient(45deg, ${t.accentColor}04 0px, ${t.accentColor}04 1px, transparent 1px, transparent 20px)
                      `,
                    }} />

                    {/* Overlay */}
                    <div className="ps5-card-overlay" />

                    {/* Borde de acento */}
                    <div className="ps5-card-border" />

                    {/* Contenido */}
                    <div className="ps5-card-content">
                      {(t.badge || t.status === "ACTIVO") && (
                        <div className={`ps5-card-badge status-${t.status}`}>
                          {t.badge || t.status}
                        </div>
                      )}
                      <span className="ps5-card-emoji">{t.emoji}</span>
                      <div className="ps5-card-name">{t.name}</div>
                      <div className="ps5-card-sub">{t.subtitle}</div>
                    </div>

                    {/* Número de índice decorativo */}
                    <div style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      fontFamily: "'Orbitron', monospace",
                      fontSize: "9px",
                      color: "rgba(255,255,255,0.15)",
                      letterSpacing: "1px",
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botón derecha */}
          <button
            className="ps5-nav-btn ps5-nav-right"
            onClick={goNext}
            aria-label="Siguiente torneo"
            disabled={activeIdx === TOURNAMENTS.length - 1}
            style={{ opacity: activeIdx === TOURNAMENTS.length - 1 ? 0.3 : 1 }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 4l5 5-5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Dots */}
        <div className="ps5-dots">
          {TOURNAMENTS.map((_, i) => (
            <button
              key={i}
              className={`ps5-dot ${i === activeIdx ? "active" : ""}`}
              onClick={() => setActiveIdx(i)}
              aria-label={`Ir al torneo ${i + 1}`}
              style={i === activeIdx ? {
                background: active.accentColor,
                boxShadow: `0 0 8px ${active.glowColor}`,
              } : {}}
            />
          ))}
        </div>

        {/* Hints de controles */}
        <div className="ps5-controls-hint">
          <div className="ps5-hint-item">
            <span className="ps5-hint-key">←</span>
            <span className="ps5-hint-key">→</span>
            Navegar
          </div>
          <div className="ps5-hint-item">
            <span className="ps5-hint-key">↵</span>
            Entrar
          </div>
        </div>
      </div>

      {/* ── Panel de detalle del torneo activo ── */}
      <div
        className="ps5-detail-panel"
        style={{
          "--panel-accent": active.accentColor,
          "--panel-glow": active.glowColor,
        } as React.CSSProperties}
        key={active.id}
      >
        <div className="ps5-detail-inner">
          {/* Ícono */}
          <div className="ps5-detail-icon">{active.emoji}</div>

          {/* Info */}
          <div className="ps5-detail-info">
            <div className="ps5-detail-name">{active.name}</div>
            <div className="ps5-detail-sub">{active.subtitle}</div>
            <div className="ps5-detail-stats">
              <div className="ps5-dstat">
                <div className="ps5-dstat-label">Entrada</div>
                <div className="ps5-dstat-val">{active.entryFee}</div>
              </div>
              <div className="ps5-dstat">
                <div className="ps5-dstat-label">Premio</div>
                <div className="ps5-dstat-val">{active.prize}</div>
              </div>
              <div className="ps5-dstat">
                <div className="ps5-dstat-label">Jugadores</div>
                <div className="ps5-dstat-val">{active.players}</div>
              </div>
              <div className="ps5-dstat">
                <div className="ps5-dstat-label">Estado</div>
                <div className="ps5-dstat-val" style={{
                  color: active.status === "ACTIVO" ? "#00C853" :
                         active.status === "PRÓXIMO" ? "rgba(255,255,255,0.6)" : "#FF0033"
                }}>
                  {active.status}
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="ps5-detail-action">
            <button
              className="ps5-btn-enter"
              style={{
                background: active.accentColor,
                boxShadow: `0 0 20px ${active.glowColor}`,
              }}
              onClick={() => router.push(active.href)}
            >
              ENTRAR AL TORNEO
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7.5 2.5l4.5 4.5-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="ps5-btn-info">
              VER DETALLES
            </button>
          </div>
        </div>
      </div>

      {/* ── Franja de descripción Last Kick ── */}
      <div className="ps5-footer-strip">
        <div>
          <div className="ps5-footer-title">
            <span>LAST KICK</span> — PREDICE DIFERENTE
          </div>
          <p className="ps5-footer-text">
            La única plataforma donde predecir fútbol se convierte en supervivencia real.
            No apostamos — competimos. Cada predicción cuenta, cada vida importa, y solo
            el más preciso llega a La Final. Aquí no se gana por suerte. Se gana por conocimiento.
          </p>
        </div>
        <button
          className="ps5-footer-cta"
          onClick={() => router.push("/register")}
        >
          REGISTRARSE GRATIS
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10M7.5 2.5l4.5 4.5-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

    </section>
  );
}