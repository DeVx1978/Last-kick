"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "./Carousel.css";
import { useRouter } from "next/navigation";

const slides = [
  {
    badge: "BIENVENIDA",
    title: ["Registrate", "y Participa"],
    sub: "Comienza hoy y entra al ranking global.",
    icon: "🎁",
    image: "/img/mexico1.jpg",
    category: "JUEGA, PREDICE, Y GANA DESDE EL PRIMER PARTIDO",
    headline: "Pon a Prueba tu intuicion y Conocimiento",
    desc: "Regístrate ahora y entra a competir por el premio acumulado. Predice los resultados del fútbol, avanza ronda tras ronda hasta llegar a la final y gana jugando con tus conocimientos. Aquí no apuestas: aquí triunfas acertando..",
    tags: ["PREDICE EL MUNDIAL", "GANA HASTA $200K", "DOLARES"],
    cta: "Estas listo para jugar y predecir?",
    href: "/register",
  },
  {
    badge: "WORLD CUP 2026",
    title: ["Predice el", "Mundial 2026"],
    sub: "Cada partido puede darte puntos reales.",
    icon: "🌍",
    image: "/img/banner1.jpg",
    category: "EVENTO MUNDIAL",
    headline: "La Selección Colombia te espera",
    desc: "Apuesta por cada partido del Mundial 2026. Cuotas en vivo, mercados especiales y torneos de predicción con premios millonarios en COP.",
    tags: ["COLOMBIA", "EN VIVO", "PREMIOS MILLONARIOS"],
    cta: "Apostar Ahora",
    href: "/register",
  },
  {
    badge: "TORNEOS",
    title: ["Compite", "Contra Miles"],
    sub: "Enfrenta jugadores de todo el mundo.",
    icon: "⚔️",
    image: "/img/banner2.jpg",
    category: "TORNEOS SEMANALES",
    headline: "Escala el ranking nacional",
    desc: "Ingresa a torneos gratuitos y de entrada. Sé el mejor predictor de la semana y llévate premios en efectivo directos a tu cuenta.",
    tags: ["GRATIS", "SEMANALES", "TOP 3 GANA"],
    cta: "Entrar al Torneo",
    href: "/register",
  },
  {
    badge: "PREMIOS",
    title: ["Sube", "de Nivel"],
    sub: "Gana recompensas por cada acierto.",
    icon: "🏆",
    image: "/img/banner3.jpg",
    category: "SISTEMA DE RECOMPENSAS",
    headline: "Puntos que se convierten en COP",
    desc: "Cada predicción correcta suma puntos a tu perfil. Alcanza el nivel Diamante y desbloquea bonos exclusivos, freebets y sorpresas.",
    tags: ["FREEBETS", "NIVEL DIAMANTE", "CASHBACK"],
    cta: "Ver Recompensas",
    href: "/register",
  },
  {
    badge: "LIVE BETTING",
    title: ["Predicciones", "en Vivo"],
    sub: "Juega mientras rueda el balón.",
    icon: "⚡",
    image: "/img/banner4.jpg",
    category: "APUESTAS EN TIEMPO REAL",
    headline: "Cuotas que cambian cada segundo",
    desc: "Activa el modo en vivo y realiza predicciones mientras el partido se desarrolla. La mayor emoción está en los últimos minutos.",
    tags: ["TIEMPO REAL", "CASH OUT", "MULTI-LIVE"],
    cta: "Apostar en Vivo",
    href: "/register",
  },
  {
    badge: "RANKING",
    title: ["Demuestra", "Que Eres Top"],
    sub: "Escala posiciones cada semana.",
    icon: "📊",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1600&q=80",
    category: "LEADERBOARD GLOBAL",
    headline: "Top 10 recibe premios cada semana",
    desc: "Compite en el leaderboard nacional. Los 10 mejores predictores de la semana reciben bonos automáticos. ¿Tienes lo que se necesita?",
    tags: ["SEMANAL", "TOP 10", "BONOS AUTOMÁTICOS"],
    cta: "Ver Ranking",
    href: "/register",
  },
  {
    badge: "LAST KICK",
    title: ["Tu Última", "Jugada"],
    sub: "Puede cambiarlo todo.",
    icon: "🎯",
    image: "https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=1600&q=80",
    category: "APUESTA FINAL",
    headline: "El golpe definitivo está en tus manos",
    desc: "Selecciona tu apuesta más confiada de la jornada con multiplicador x5. Una sola predicción puede transformar toda tu semana.",
    tags: ["MULTIPLICADOR x5", "UNA JORNADA", "TODO O NADA"],
    cta: "Jugada Final",
    href: "/register",
  },
];

const DURATION = 5000;
const TICK = 50;

export default function Carousel() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [activeClass, setActiveClass] = useState(true);

  const progressRef = useRef(0);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vpRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  // ─── Slide navigation ───────────────────────────────────────────────────────

  const goTo = useCallback((n: number) => {
    const next = ((n % slides.length) + slides.length) % slides.length;
    setActiveClass(false);
    setTimeout(() => {
      setCurrent(next);
      setActiveClass(true);
    }, 50);
    progressRef.current = 0;
    setProgress(0);
  }, []);

  // ─── Progress timer ──────────────────────────────────────────────────────────

  const startProgress = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    progressRef.current = 0;
    setProgress(0);
    progressInterval.current = setInterval(() => {
      progressRef.current += TICK;
      const pct = Math.min(100, (progressRef.current / DURATION) * 100);
      setProgress(pct);
      if (progressRef.current >= DURATION) {
        if (progressInterval.current) clearInterval(progressInterval.current);
        setCurrent((prev) => {
          const next = (prev + 1) % slides.length;
          setActiveClass(false);
          setTimeout(() => setActiveClass(true), 50);
          progressRef.current = 0;
          setProgress(0);
          return next;
        });
      }
    }, TICK);
  }, []);

  useEffect(() => {
    startProgress();
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const handleNav = (dir: number) => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    goTo(current + dir);
    startProgress();
  };

  const handleDot = (i: number) => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    goTo(i);
    startProgress();
  };

  // ─── Particle canvas ─────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    const vp = vpRef.current;
    if (!canvas || !vp) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = vp.clientWidth;
      canvas.height = vp.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(Math.random() * 0.5 + 0.2),
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.6 + 0.1,
      life: Math.random(),
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 0.004;
        if (p.y < -5 || p.life > 1) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 5;
          p.life = 0;
          p.alpha = Math.random() * 0.6 + 0.1;
        }
        const a = p.alpha * Math.sin(p.life * Math.PI);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,255,${a})`;
        ctx.fill();
      });
      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────────

  const slide = slides[current];
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      <section className="bp-universe">
        {/* Scanlines */}
        <div className="bp-scanlines" />

        {/* HUD Bar */}
        <div className="bp-hud">
          <div className="bp-brand">
            LAST<span>KICK</span>
          </div>
          <div className="bp-hud-dots">
            <div className="bp-hdot" />
            <div className="bp-hdot bp-hdot--white" />
            <div className="bp-hdot bp-hdot--blue" />
          </div>
          <div className="bp-live-label">LIVE EXPERIENCE</div>
        </div>

        {/* Viewport */}
        <div className="bp-viewport" ref={vpRef}>
          <canvas className="bp-canvas" ref={canvasRef} />

          {/* Slides */}
          <div
            className="bp-track"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {slides.map((s, i) => (
              <div
                key={i}
                className={`bp-slide${i === current ? " bp-slide--active" : ""}`}
              >
                <div
                  className="bp-slide-bg"
                  style={{ backgroundImage: `url(${s.image})` }}
                />
                <div className="bp-slide-overlay" />
                <div className="bp-slide-grid" />

                <div className={`bp-content${activeClass && i === current ? " bp-content--in" : ""}`}>
                  <span className="bp-badge">{s.badge}</span>
                  <h2 className="bp-title">
                    {s.title[0]}
                    <br />
                    {s.title[1]}
                  </h2>
                  <p className="bp-sub">{s.sub}</p>
                  {/* ✅ BOTÓN CTA SUPERIOR — navega a /register */}
                  <button
                    className="bp-cta"
                    onClick={() => router.push(s.href)}
                  >
                    {s.cta} ▶
                  </button>
                </div>

                <div className={`bp-visual${activeClass && i === current ? " bp-visual--in" : ""}`}>
                  <div className="bp-icon-ring">{s.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Corners */}
          <div className="bp-corner bp-corner--tl" />
          <div className="bp-corner bp-corner--tr" />
          <div className="bp-corner bp-corner--bl" />
          <div className="bp-corner bp-corner--br" />

          {/* Arrows */}
          <button className="bp-nav bp-nav--prev" onClick={() => handleNav(-1)}>
            ‹
          </button>
          <button className="bp-nav bp-nav--next" onClick={() => handleNav(1)}>
            ›
          </button>

          {/* Dots */}
          <div className="bp-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`bp-dot${i === current ? " bp-dot--active" : ""}`}
                onClick={() => handleDot(i)}
              />
            ))}
          </div>

          {/* Counter */}
          <div className="bp-counter">
            <strong>{pad(current + 1)}</strong> / {pad(slides.length)}
          </div>

          {/* Energy line */}
          <div className="bp-energy" />
        </div>

        {/* Progress bar */}
        <div className="bp-progress">
          <div className="bp-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Info Panel */}
        <div className="bp-info-wrap">
          <div
            className="bp-info-track"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {slides.map((s, i) => (
              <div key={i} className="bp-info">
                <div className="bp-info-left">
                  <div className="bp-info-cat">{s.category}</div>
                  <div className="bp-info-headline">{s.headline}</div>
                  <div className="bp-info-desc">{s.desc}</div>
                  <div className="bp-info-tags">
                    {s.tags.map((t, j) => (
                      <span key={j} className="bp-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bp-info-right">
                  <div className="bp-info-num">{pad(i + 1)}</div>
                  {/* ✅ BOTÓN CTA INFERIOR — navega a /register */}
                  <button
                    className="bp-info-cta"
                    onClick={() => router.push(s.href)}
                  >
                    {s.cta} ▶
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}