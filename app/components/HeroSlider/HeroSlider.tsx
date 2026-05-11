"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  accent: string;
}

const SLIDES: Slide[] = [
  {
    image: "/img/banner1.jpg",
    title: "WORLD CUP 2026",
    subtitle: "Predice. Compite. Sobrevive.",
    ctaLabel: "ENTRAR AL JUEGO",
    ctaHref: "/register",
    accent: "#00C853",
  },
  {
    image: "/img/banner2.jpg",
    title: "CHAMPIONS LEAGUE",
    subtitle: "El torneo más grande del mundo.",
    ctaLabel: "VER TORNEOS",
    ctaHref: "/champions",
    accent: "#00B0FF",
  },
  {
    image: "/img/banner3.jpg",
    title: "APUESTAS EN VIVO",
    subtitle: "Más emoción. Más adrenalina.",
    ctaLabel: "PREDECIR AHORA",
    ctaHref: "/fixture",
    accent: "#FF6D00",
  },
  {
    image: "/img/banner4.jpg",
    title: "LAST KICK",
    subtitle: "Mantente con vida hasta la final.",
    ctaLabel: "REGISTRARSE",
    ctaHref: "/register",
    accent: "#00C853",
  },
];

const AUTOPLAY_MS = 5000;

export default function HeroSlider() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [progKey, setProgKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((next: number) => {
    setCurrent(next);
    setProgKey((k) => k + 1);
  }, []);

  const goNext = useCallback(
    () => goTo((current + 1) % SLIDES.length),
    [current, goTo]
  );
  const goPrev = useCallback(
    () => goTo((current - 1 + SLIDES.length) % SLIDES.length),
    [current, goTo]
  );

  useEffect(() => {
    timerRef.current = setTimeout(goNext, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, goNext]);

  const s = SLIDES[current];

  return (
    <>
      <style>{`
        @keyframes lkProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes lkTextIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lk-text-animate {
          animation: lkTextIn 0.5s ease 0.2s both;
        }
        .lk-bg-layer {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center center;
          filter: brightness(0.55) saturate(0.85);
          /* ── ESTO es el fade real ── */
          opacity: 0;
          transition: opacity 900ms ease;
        }
        .lk-bg-layer.lk-active {
          opacity: 1;
        }
        .lk-arrow:hover {
          opacity: 1 !important;
          border-color: rgba(255,255,255,0.6) !important;
        }
        .lk-dot {
          border: none;
          padding: 0;
          cursor: pointer;
          height: 6px;
          border-radius: 3px;
          transition: width 0.35s ease, background 0.35s ease, box-shadow 0.35s ease;
        }
      `}</style>

      <div
        style={{
          display: "block",
          width: "100%",
          height: "calc(100vh - 140px)",
          position: "relative",
          overflow: "hidden",
          margin: 0,
          padding: 0,
          backgroundColor: "#111",
        }}
      >
        {/*
         * ── CAPAS DE IMAGEN ──────────────────────────────────────────────
         * Cada slide tiene su PROPIO div con su propia backgroundImage.
         * Todos están en el DOM al mismo tiempo, posición absolute inset:0.
         * La clase `lk-active` cambia opacity de 0 → 1.
         * CSS transition: opacity 900ms hace el crossfade entre capas.
         * Así funciona el fade real: dos divs superpuestos con opacidades cruzadas.
         */}
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            className={`lk-bg-layer${i === current ? " lk-active" : ""}`}
            style={{
              backgroundImage: `url(${slide.image})`,
              zIndex: i === current ? 2 : 1,
            }}
          />
        ))}

        {/* ── OVERLAY ─────────────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            pointerEvents: "none",
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 50%, rgba(0,0,0,0.05) 100%)," +
              "linear-gradient(0deg, rgba(0,0,0,0.65) 0%, transparent 45%)",
          }}
        />

        {/* ── TEXTOS ──────────────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 4,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 5vw 56px",
            pointerEvents: "none",
          }}
        >
          <div key={`txt-${current}`} className="lk-text-animate">
            <div
              style={{
                fontFamily: "'DM Mono', 'Courier New', monospace",
                fontSize: "10px",
                letterSpacing: "5px",
                color: s.accent,
                marginBottom: "10px",
                opacity: 0.9,
              }}
            >
              {String(current + 1).padStart(2, "0")} —{" "}
              {String(SLIDES.length).padStart(2, "0")}
            </div>

            <div
              style={{
                width: "40px",
                height: "3px",
                background: s.accent,
                marginBottom: "16px",
                boxShadow: `0 0 12px ${s.accent}`,
              }}
            />

            <h2
              style={{
                fontFamily:
                  "'Bebas Neue', 'Anton', 'Arial Black', Impact, sans-serif",
                fontSize: "clamp(50px, 8vw, 96px)",
                lineHeight: 0.9,
                color: "#ffffff",
                textTransform: "uppercase",
                letterSpacing: "-1px",
                margin: "0 0 14px 0",
                textShadow: "0 2px 20px rgba(0,0,0,0.8)",
                maxWidth: "580px",
              }}
            >
              {s.title}
            </h2>

            <p
              style={{
                fontFamily: "'Space Grotesk', 'Arial', sans-serif",
                fontSize: "clamp(13px, 1.4vw, 17px)",
                color: "rgba(255,255,255,0.82)",
                fontWeight: 300,
                letterSpacing: "1px",
                margin: "0 0 26px 0",
                maxWidth: "420px",
                lineHeight: 1.5,
              }}
            >
              {s.subtitle}
            </p>

            <div style={{ pointerEvents: "auto" }}>
              <button
                onClick={() => router.push(s.ctaHref)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "9px",
                  padding: "13px 28px",
                  background: s.accent,
                  border: "none",
                  borderRadius: "2px",
                  color: "#000",
                  fontFamily: "'Space Grotesk', 'Arial', sans-serif",
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  boxShadow: `0 0 24px ${s.accent}44`,
                  transition: "transform 0.18s, opacity 0.18s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.opacity = "0.85";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.opacity = "1";
                }}
              >
                {s.ctaLabel}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M1 6h10M6.5 2l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── FLECHA IZQUIERDA ─────────────────────────────────────────── */}
        <button
          onClick={goPrev}
          aria-label="Anterior"
          className="lk-arrow"
          style={{
            position: "absolute",
            left: "18px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 5,
            width: "42px",
            height: "42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.22)",
            borderRadius: "2px",
            backdropFilter: "blur(6px)",
            color: "#fff",
            cursor: "pointer",
            opacity: 0.75,
            transition: "opacity 0.2s, border-color 0.2s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3L5 8l5 5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* ── FLECHA DERECHA ───────────────────────────────────────────── */}
        <button
          onClick={goNext}
          aria-label="Siguiente"
          className="lk-arrow"
          style={{
            position: "absolute",
            right: "18px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 5,
            width: "42px",
            height: "42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.22)",
            borderRadius: "2px",
            backdropFilter: "blur(6px)",
            color: "#fff",
            cursor: "pointer",
            opacity: 0.75,
            transition: "opacity 0.2s, border-color 0.2s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 3l5 5-5 5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* ── DOTS ─────────────────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            bottom: "22px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="lk-dot"
              aria-label={`Slide ${i + 1}`}
              style={{
                width: i === current ? "26px" : "6px",
                background:
                  i === current ? s.accent : "rgba(255,255,255,0.30)",
                boxShadow: i === current ? `0 0 8px ${s.accent}` : "none",
              }}
            />
          ))}
        </div>

        {/* ── BARRA DE PROGRESO ────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "3px",
            zIndex: 6,
            background: "rgba(255,255,255,0.08)",
          }}
        >
          <div
            key={progKey}
            style={{
              height: "100%",
              background: s.accent,
              boxShadow: `0 0 6px ${s.accent}`,
              animation: `lkProgress ${AUTOPLAY_MS}ms linear forwards`,
            }}
          />
        </div>
      </div>
    </>
  );
}