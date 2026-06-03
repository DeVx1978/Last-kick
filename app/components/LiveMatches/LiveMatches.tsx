"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import "./LiveMatches.css";

// ─── INTERFAZ DE DATOS MAESTRA (CONEXIÓN ADAPTADA A TU SUPABASE) ──────────────
interface DatabaseEvent {
  id: string;
  name: string;             // Tu columna 'name'
  slug: string;             // Tu columna 'slug' (fixture / champions)
  type: string;             // Tu columna 'type' (CUP / LEAGUE)
  status: string;           // Tu columna 'status' (ACTIVO / PROXIMO)
  bg_image: string;         // Tu columna 'bg_image' (/img/euforia.jpg)
  accent_color: string;     // Tu columna 'accent_color' (#FF0033)
  prize_current: number;    // Tu columna 'prize_current' (100000)
  entry_cost: number;       // Tu columna 'entry_cost' (500)
  total_matches: number;    // Tu columna 'total_matches' (92)
  
  // 🔒 LA REQUERIDA POR EL DIRECTOR: Columna de descripción dinámica desde el Admin
  description: string;      

  // Datos para Partidos Independientes (Tabla public.matches en el futuro)
  isPartidoIndependent?: boolean;
  stadiumName?: string;
  cityName?: string;
  dateString?: string;
  timeString?: string;
  teamA?: { name: string; flag: string };
  teamB?: { name: string; flag: string };
}

// ─── REGISTROS DINÁMICOS ALIMENTADOS POR TU ADMIN ────────────────────────────
const REAL_DATABASE_MOCK: DatabaseEvent[] = [
  {
    id: "c64467f3-00d1-4c7d-b360-c72d6aa177bd",
    name: "Mundial FIFA 2026",
    slug: "fixture",
    type: "CUP",
    status: "ACTIVO",
    bg_image: "/img/baloncopa1.jpg",
    accent_color: "#FF0033",
    prize_current: 100000,
    entry_cost: 0,
    total_matches: 92,
    description: "Compite en la Arena Suprema del planeta. Predice el desarrollo de los 104 partidos históricos, administra tus vidas con frialdad militar y avanza ronda tras ronda para adueñarte del Jackpot total garantizado. Aquí no hay margen de error: racha o eliminación."
  },
  {
    id: "e1f930ea-3fc1-42bb-baf7-4a26998d25e9",
    name: "UEFA Champions League",
    slug: "champions",
    type: "LEAGUE",
    status: "ACTIVO",
    bg_image: "/img/starwefa2.jpg",
    accent_color: "#00C853",
    prize_current: 50000,
    entry_cost: 500,
    total_matches: 125,
    description: "La élite absoluta del fútbol europeo entra en zona de guerra táctica. Pronostica los choques de titanes en la nueva fase de liga y cuida tu inventario de vidas frente a los clubes más dominantes del mundo. Diseña tu estrategia antes del pitazo inicial."
  },
  {
    id: "partido-destacado-1",
    name: "BRASIL vs ESPAÑA",
    slug: "fixture",
    type: "PARTIDO",
    status: "PROXIMO",
    bg_image: "/img/braesp1.jpg", 
    accent_color: "#00D4FF",
    prize_current: 25000,
    entry_cost: 150,
    total_matches: 1,
    isPartidoIndependent: true,
    stadiumName: "Estadio Maracaná",
    cityName: "Río de Janeiro",
    dateString: "15 Junio 2026",
    timeString: "20:00 COT",
    teamA: { name: "Brasil", flag: "https://flagcdn.com/br.svg" },
    teamB: { name: "España", flag: "https://flagcdn.com/es.svg" },
    description: "Duelo directo de alto calibre táctico entre dos campeones del mundo en el mítico templo de Río. Un enfrentamiento cerrado donde cada tarjeta, gol y predicción en tiempo real decidirá de forma inmediata quién sobrevive en la clasificación global."
  }
];

export default function NetflixVitrinaSection() {
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState(0);
  const [offset, setOffset] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const activeEvent = REAL_DATABASE_MOCK[activeIdx];

  const THUMB_WIDTH = 230;
  const THUMB_GAP = 16;
  const STEP = THUMB_WIDTH + THUMB_GAP;

  const centerThumb = useCallback((idx: number) => {
    if (!trackRef.current) return;
    const containerWidth = trackRef.current.parentElement?.clientWidth || 800;
    const newOffset = -(idx * STEP) + (containerWidth / 2) - (THUMB_WIDTH / 2);
    setOffset(idx === 0 ? 0 : newOffset);
  }, [STEP]);

  useEffect(() => {
    centerThumb(activeIdx);
  }, [activeIdx, centerThumb]);

  useEffect(() => {
    const handleResize = () => centerThumb(activeIdx);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIdx, centerThumb]);

  // Manejo de atajos tácticos de teclado
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = document.activeElement?.tagName;
      if (target === "INPUT" || target === "TEXTAREA" || document.activeElement?.getAttribute("contenteditable") === "true") return;
      if (e.key === "ArrowLeft") setActiveIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setActiveIdx((i) => Math.min(REAL_DATABASE_MOCK.length - 1, i + 1));
      if (e.key === "Enter") router.push(`/${activeEvent.slug}`);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIdx, activeEvent, router]);

  return (
    <section className="lk-vitrina" id="vitrina-arena">
      <div className="lk-vitrina-grid-bg" />

      {/* 📺 STAGE 1: NETFLIX BILLBOARD CONTROL (PANEL SUPERIOR INTERACTIVO) */}
      <div className="lk-billboard" key={activeEvent.id}>
        <div 
          className="lk-billboard-bg" 
          style={{ backgroundImage: `url(${activeEvent.bg_image})` }}
        >
          <div className="lk-billboard-mask" />
        </div>

        <div className="lk-billboard-viewport">
          <div className="lk-billboard-info">
            
            <div className="lk-hud-tag" style={{ color: activeEvent.accent_color }}>
              <span className="lk-hud-dot" style={{ backgroundColor: activeEvent.accent_color }} />
              ARENA {activeEvent.type} • {activeEvent.status}
            </div>

            {/* Configuración Cinemática Maqueta Netflix */}
            <h2 className="lk-event-headline">{activeEvent.name}</h2>
            
            {/* 🔒 LA NUEVA DESCRIPCIÓN REQUERIDA: Perfectamente posicionada debajo del título */}
            <p className="lk-event-description-text">{activeEvent.description}</p>

            {/* Ficha logística compactada HUD */}
            <div className="lk-hud-specs">
              <div className="lk-spec-cell">
                <span className="lk-spec-lbl">ARENA U UBICACIÓN</span>
                <span className="lk-spec-val">
                  {activeEvent.isPartidoIndependent ? `${activeEvent.stadiumName} (${activeEvent.cityName})` : "MÚLTIPLES SEDES GLOBALES"}
                </span>
              </div>
              <div className="lk-spec-cell">
                <span className="lk-spec-lbl">CRONOGRAMA OPERATIVO</span>
                <span className="lk-spec-val">
                  {activeEvent.isPartidoIndependent ? `${activeEvent.dateString} — ${activeEvent.timeString}` : `DISPONIBLE • ${activeEvent.total_matches} ENCUENTROS`}
                </span>
              </div>
            </div>

<div className="lk-billboard-actions">
  <button className="lk-btn-tactical-main" onClick={() => router.push("/register")}>
    PREDECIR EVENTO
  </button>
  
  <div className="lk-hud-actions-prize">
    <span className="lk-fin-lbl">POZO ACUMULADO</span>
    <span className="lk-fin-val" style={{ color: activeEvent.accent_color, textShadow: `0 0 15px ${activeEvent.accent_color}60` }}>
      {activeEvent.prize_current.toLocaleString()} USD
    </span>
  </div>
</div>
          </div>

          <div className="lk-billboard-logo-frame">
  <img 
    src={
      activeEvent.slug === "champions" 
        ? "https://upload.wikimedia.org/wikipedia/commons/d/f0/UEFA_Champions_League_logo_2.svg"
        : "https://upload.wikimedia.org/wikipedia/commons/b/bb/FIFA_logo.svg"
    } 
    alt="" /* 🔒 Vacío para evitar que el navegador pinte textos rotos */
    className="lk-hud-big-logo" 
  />
</div>
        </div>
      </div>

      {/* 🎬 STAGE 2: CONTROL RACK (CARRUSEL INFERIOR NETFLIX CON BANDERAS Y CUCUYO) */}
      <div className="lk-rack-area">
        <h3 className="lk-rack-headline">CARTELERA DE SELECCIÓN TÁCTICA</h3>
        
        <div className="lk-rack-slider-container">
          {/* Flecha de Navegación Izquierda */}
          <button 
            className="lk-rack-arrow lk-rack-arrow-left"
            onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
            disabled={activeIdx === 0}
          >
            ‹
          </button>

          <div 
            ref={trackRef}
            className="lk-rack-track"
            style={{ transform: `translateX(${offset}px)` }}
          >
            {REAL_DATABASE_MOCK.map((event, i) => {
              const isActive = i === activeIdx;
              return (
                <div
                  key={event.id}
                  className={`lk-netflix-thumb ${isActive ? "lk-netflix-thumb--active" : ""}`}
                  onClick={() => setActiveIdx(i)}
                  style={{ "--step-accent": event.accent_color } as React.CSSProperties}
                >
                  <div className="lk-thumb-cucuyo-light" />

                  <div className="lk-thumb-inner">
                    <div className="lk-thumb-identity-view">
                      {event.isPartidoIndependent ? (
                        <div className="lk-hud-vs-flags">
                          <img src={event.teamA?.flag} alt="" className="lk-flag-hud-icon" />
                          <span className="lk-hud-vs-divider">VS</span>
                          <img src={event.teamB?.flag} alt="" className="lk-flag-hud-icon" />
                        </div>
                      ) : (
                        <div className="lk-thumb-logo-center">
                          <img 
                            src={event.slug === "champions" ? "/img/wefa1.png" : "/img/fifa1.png"} 
                            alt="" 
                            className="lk-logo-hud-icon" 
                          />
                        </div>
                      )}
                    </div>

                    <div className="lk-thumb-meta-footer">
                      <span className="lk-thumb-title-text">{event.name}</span>
                      <span className="lk-thumb-status-tag" style={{ color: event.accent_color }}>
                        {event.status}
                      </span>
                    </div>
                  </div>

                  <div className="lk-thumb-index-decor">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Flecha de Navegación DERECHA */}
          <button 
            className="lk-rack-arrow lk-rack-arrow-right"
            onClick={() => setActiveIdx((prev) => Math.min(REAL_DATABASE_MOCK.length - 1, prev + 1))}
            disabled={activeIdx === REAL_DATABASE_MOCK.length - 1}
          >
            ›
          </button>
        </div>

        {/* Dots para Control Táctil Móvil */}
        <div className="lk-rack-dots">
          {REAL_DATABASE_MOCK.map((_, i) => (
            <button
              key={i}
              className={`lk-rack-dot ${i === activeIdx ? "active" : ""}`}
              onClick={() => setActiveIdx(i)}
              style={i === activeIdx ? { background: activeEvent.accent_color, boxShadow: `0 0 10px ${activeEvent.accent_color}` } : {}}
            />
          ))}
        </div>
      </div>
    </section>
  );
}