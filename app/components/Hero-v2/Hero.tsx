"use client";

import { useEffect, useRef, useState } from "react";
import "./Hero.css";
import Link from "next/link";

const TICKER_ITEMS = [
  { text: "ARGENTINA 2 - 1 BRASIL", time: "MIN 74", live: true },
  { text: "ESPAÑA 1 - 1 FRANCIA", time: "MIN 66", live: true },
  { text: "ALEMANIA vs ITALIA", time: "HOY 20:00", live: false },
  { text: "COLOMBIA vs URUGUAY", time: "HOY 22:00", live: false },
  { text: "BRASIL vs PORTUGAL", time: "MIN 55", live: true },
  { text: "MÉXICO vs USA", time: "MIN 33", live: true },
];

const WORLD_CUP_DATE = new Date("2026-06-11T18:00:00");

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function HeroLastKick() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [currentTime, setCurrentTime] = useState("--:--:--");
  const [stats, setStats] = useState({ vivos: 20007, coma: 121, elim: 542, jackpot: 200000 });

  // ─── Countdown ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = WORLD_CUP_DATE.getTime() - now.getTime();
      if (diff > 0) {
        setCountdown({
          d: Math.floor(diff / 86400000),
          h: Math.floor((diff % 86400000) / 3600000),
          m: Math.floor((diff % 3600000) / 60000),
          s: Math.floor((diff % 60000) / 1000),
        });
      }
      setCurrentTime(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ─── Live stats fluctuation ───────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setStats((prev) => ({
        vivos: prev.vivos + Math.floor(Math.random() * 3) - 1,
        coma: Math.max(0, prev.coma + Math.floor(Math.random() * 3) - 1),
        elim: prev.elim + Math.floor(Math.random() * 2),
        jackpot: prev.jackpot + Math.floor(Math.random() * 50 + 10),
      }));
    }, 2500);
    return () => clearInterval(id);
  }, []);

  // ─── Particles ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = heroRef.current;
    if (!canvas || !hero) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const pts = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(Math.random() * 0.4 + 0.1),
      r: Math.random() * 1.5 + 0.3,
      a: Math.random() * 0.5 + 0.1,
      life: Math.random(),
      red: Math.random() > 0.7,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 0.003;
        if (p.y < -5 || p.life > 1) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 5;
          p.life = 0;
          p.a = Math.random() * 0.5 + 0.1;
          p.red = Math.random() > 0.7;
        }
        const alpha = p.a * Math.sin(p.life * Math.PI);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.red
          ? `rgba(232,0,45,${alpha})`
          : `rgba(0,212,255,${alpha})`;
        ctx.fill();
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  const jackpotStr = "$" + stats.jackpot.toLocaleString();

  return (
    <>

      <div className="lk-hero" ref={heroRef}>
        <div className="lk-stadium" />
        <div className="lk-bg" />
        <div className="lk-grid" />
        <div className="lk-scan" />
        <div className="lk-vignette" />
        <canvas className="lk-pcanvas" ref={canvasRef} />

        {/* NAV */}
        <nav className="lk-nav">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="lk-logo">
              LAST <span>KICK</span>
            </div>
            <div className="lk-nav-symbols">
              <span className="lk-sym lk-sym-tri">△</span>
              <span className="lk-sym lk-sym-cir">○</span>
              <span className="lk-sym lk-sym-x">✕</span>
              <span className="lk-sym lk-sym-sq">□</span>
            </div>
          </div>
          <div className="lk-jackpot">
            <div className="lk-jackpot-label">JACKPOT ACUMULADO</div>
            <div className="lk-jackpot-val">{jackpotStr}</div>
          </div>
        </nav>

        {/* TICKER */}
        <div className="lk-ticker">
          <div className="lk-ticker-inner">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="lk-tick-item">
                <span className={`lk-tick-dot${item.live ? " live" : ""}`} />
                <span className="lk-tick-score">{item.text}</span>
                <span> • {item.time}</span>
              </span>
            ))}
          </div>
        </div>

        {/* MAIN */}
        <div className="lk-main">
          <div className="lk-left">
            <div className="lk-eyebrow">
              <div className="lk-eyebrow-line" />
              <span className="lk-eyebrow-text">El sistema de vidas</span>
            </div>

            <h1 className="lk-headline">
              CADA VIDA
              <br />
              <span className="lk-headline-red">IMPORTA</span>
            </h1>

            <p className="lk-sub">
              No es solo predecir. Es sobrevivir un torneo entero con recursos
              limitados. Así funciona el sistema.
            </p>

            <div className="lk-btns">
              <Link href="/login" className="lk-btn-login">
  ⚡ INGRESAR
</Link>

<Link href="/register" className="lk-btn-register">
  ✦ CREAR CUENTA
</Link>
            </div>

            <div className="lk-proof">
              <div className="lk-proof-item">
                <div className="lk-proof-dot live" />
                <span>{stats.vivos.toLocaleString()} activos</span>
              </div>
              <div className="lk-proof-item">
                <div className="lk-proof-dot" />
                <span>Seguro</span>
              </div>
              <div className="lk-proof-item">
                <div className="lk-proof-dot" />
                <span>Online</span>
              </div>
            </div>
          </div>

          <div className="lk-right">
            {/* COUNTDOWN */}
            <div className="lk-countdown">
              <div className="lk-cd-label">INICIO DE OPERACIONES GLOBALES</div>
              <div className="lk-cd-units">
                {[
                  { val: countdown.d, lbl: "DÍAS" },
                  { val: countdown.h, lbl: "HRS" },
                  { val: countdown.m, lbl: "MIN" },
                  { val: countdown.s, lbl: "SEG" },
                ].map((u, i) => (
                  <div key={i} className="lk-cd-unit">
                    <div className="lk-cd-num">{pad(u.val)}</div>
                    <div className="lk-cd-lbl">{u.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* STATS */}
            <div className="lk-stats">
              <div className="lk-stat">
                <div className="lk-stat-accent green" />
                <div className="lk-stat-val green">{stats.vivos.toLocaleString()}</div>
                <div className="lk-stat-lbl">Vivos</div>
              </div>
              <div className="lk-stat">
                <div className="lk-stat-accent yellow" />
                <div className="lk-stat-val yellow">{stats.coma.toLocaleString()}</div>
                <div className="lk-stat-lbl">En Coma</div>
              </div>
              <div className="lk-stat">
                <div className="lk-stat-accent red" />
                <div className="lk-stat-val red">{stats.elim.toLocaleString()}</div>
                <div className="lk-stat-lbl">Eliminados</div>
              </div>
              <div className="lk-stat">
                <div className="lk-stat-accent cyan" />
                <div className="lk-stat-val cyan">$200K</div>
                <div className="lk-stat-lbl">Premio</div>
              </div>
            </div>

            {/* STATUS */}
            <div className="lk-status">
              <div className="lk-status-header">
                <span className="lk-status-title">STATUS LIVE</span>
                <div className="lk-status-live">
                  <div className="lk-status-live-dot" />
                  LIVE
                </div>
              </div>
              {[
                { key: "FASE", val: "FASE DE GRUPOS", accent: "cyan" },
                { key: "INICIO", val: "11 JUN • 18:00", accent: "" },
                { key: "JACKPOT", val: jackpotStr, accent: "red" },
                { key: "DIFICULTAD", val: "INICIACIÓN", accent: "red" },
              ].map((row, i) => (
                <div key={i} className="lk-status-row">
                  <span className="lk-status-key">{row.key}</span>
                  <span className={`lk-status-val${row.accent ? " accent-" + row.accent : ""}`}>
                    {row.val}
                  </span>
                </div>
              ))}
            </div>

            <div className="lk-warning">
              <span className="lk-warning-icon">⚠</span>
              <span className="lk-warning-text">LAS DECISIONES SON FINALES</span>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="lk-bottom">
          <span className="lk-bottom-label">LAST KICK © MUNDIAL 2026</span>
          <div className="lk-bottom-pills">
            {["COLOMBIA", "FIFA 2026", "PREDICCIONES EN VIVO"].map((p, i) => (
              <span key={i} className="lk-pill">{p}</span>
            ))}
          </div>
          <span className="lk-bottom-label">{currentTime}</span>
        </div>
      </div>
    </>
  );
}