"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import "./Hero.css";

/* ── Types ── */
interface Notif { id: number; text: string; color: string; }

/* ── Slides ── */
const SLIDES = [
  {
    headline: ["ATRÉVETE", "A GANAR"],
    sub: "Siente la adrenalina de cada gol, anticipa cada resultado y conviértete en parte del juego mientras millones de aficionados viven la intensidad del Mundial 2026 dentro y fuera del estadio.",
    image: "/img/11chica.png",
    bgPosition: "center 35%",      // mujer + app — centra en el rostro
    category: "EL PRIMER JUEGO DE PREDICCIONES DE FÚTBOL",
    infoHeadline: "Pon a Prueba tu Intuición y Conocimiento",
    desc: "",
    tags: ["PREDICE EL MUNDIAL", "GANA HASTA $100K", "PITCHX"],
  },
  {
    headline: ["PREDICE 104", "PARTIDOS"],
    sub: "La FIFA World Cup 2026 será el Mundial más grande de la historia. Con Kick Last la emoción no solo se vive en la cancha, también se juega con cada predicción.",
    image: "/img/guerra1.png",
    bgPosition: "center 20%",      // estadio arriba — baja el foco al campo
    category: "MUNDIAL DE FÚTBOL 2026",
    infoHeadline: "Juega tu Propio Mundial y Gana Prediciendo los Resultados",
    desc: "",
    tags: ["GANA", "PREMIOS", "JUGANDO"],
  },
  {
    headline: ["UZBEKISTÁN", "VS COLOMBIA"],
    sub: "La Selección Colombia inicia su participación en la Copa Mundial FIFA 2026 enfrentando a Uzbekistán el miércoles 17 de junio. Estadio Azteca, Ciudad de México — 9:00 p.m. hora Colombia.",
    image: "/img/james2.jpg",
    bgPosition: "center 25%",      // jugador — centra en torso/cara
    category: "¿ESTÁS LISTO PARA PREDECIR ESTE PARTIDO?",
    infoHeadline: "UZBEKISTÁN VS COLOMBIA",
    desc: "Vive la emoción de los 90 minutos más emocionantes fuera de la cancha. Gana como un experto de las predicciones.",
    tags: ["JUEGA", "PREDICE", "GANA"],
  },
  {
    headline: ["COSTA DE MARFIL", "VS ECUADOR"],
    sub: "Ecuador enfrenta a Costa de Marfil el 14 de junio de 2026 en el Lincoln Financial Field de Filadelfia. Predice minuto a minuto este emocionante partido.",
    image: "/img/equ10.jpg",
    bgPosition: "center 30%",      // trofeo/jugadores — equilibrado
    category: "PREDICE ESTE PARTIDO",
    infoHeadline: "SIGUE MINUTO A MINUTO ESTE EMOCIONANTE PARTIDO",
    desc: "Regístrate gratis y realiza las predicciones según tu instinto.",
    tags: ["JUEGA", "PREDICE", "GANA"],
  },
];

/* ── Partidos destacados data ── */
const MATCHES = [
  {
    league: "🇨🇴 Primera A Colombia", time: null, live: true,
    team1: { flag: "🟢", name: "Atlético Nacional" }, score1: "3",
    team2: { flag: "🔴", name: "Deportes Tolima"  }, score2: "1",
    odds: [{ l:"1", v:"2,55" }, { l:"X", v:"1,45" }, { l:"2", v:"3,20" }],
  },
  {
    league: "🇨🇴 Primera A Colombia", time: "Hoy 20:30", live: false,
    team1: { flag: "🔴", name: "Junior"   }, score1: "—",
    team2: { flag: "🔴", name: "Santa Fe" }, score2: "—",
    odds: [{ l:"1", v:"2,10" }, { l:"X", v:"3,50" }, { l:"2", v:"3,60" }],
  },
  {
    league: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League", time: "Mañana 10:00", live: false,
    team1: { flag: "🔵", name: "Manchester City" }, score1: "—",
    team2: { flag: "🔴", name: "Aston Villa"     }, score2: "—",
    odds: [{ l:"1", v:"1,25" }, { l:"X", v:"6,50" }, { l:"2", v:"11" }],
  },
  {
    league: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League", time: "Mañana 10:00", live: false,
    team1: { flag: "🔴", name: "Nottingham F."  }, score1: "—",
    team2: { flag: "🔴", name: "AFC Bournemouth" }, score2: "—",
    odds: [{ l:"1", v:"3,35" }, { l:"X", v:"4" }, { l:"2", v:"2,05" }],
  },
  {
    league: "🌍 Mundial 2026", time: "11 JUN 18:00", live: false,
    team1: { flag: "🇲🇽", name: "México" }, score1: "?",
    team2: { flag: "🇺🇸", name: "USA"    }, score2: "?",
    odds: [{ l:"1", v:"2,40" }, { l:"2", v:"2,80" }],
  },
  {
    league: "🇪🇸 La Liga", time: "Hoy 20:00", live: false,
    team1: { flag: "⚪", name: "Real Madrid" }, score1: "—",
    team2: { flag: "🔵", name: "Barcelona"   }, score2: "—",
    odds: [{ l:"1", v:"2,10" }, { l:"X", v:"3,40" }, { l:"2", v:"3,20" }],
  },
];

/* ── Constants ── */
const SLIDE_DURATION = 5000;
const TICK_MS        = 50;
const WORLD_CUP_START = new Date("2026-06-11T18:00:00");
const WORLD_CUP_FINAL = new Date("2026-07-19T18:00:00");
function pad(n: number) { return String(n).padStart(2, "0"); }

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */
export default function HeroLastKick() {
  const heroRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);

  const [countdown, setCountdown]   = useState({ d:0, h:0, m:0, s:0 });
  const [cdLabel,   setCdLabel]     = useState("INICIO MUNDIAL 2026");
  const [currentTime, setCurrentTime] = useState("--:--:--");
  const [stats, setStats]           = useState({ vivos:20007, coma:121, elim:542, jackpot:200000 });
  const [current, setCurrent]       = useState(0);
  const [progress, setProgress]     = useState(0);
  const [activeClass, setActiveClass] = useState(true);
  const [notifs, setNotifs]         = useState<Notif[]>([]);
  const [selOdds, setSelOdds]       = useState<Record<number,number>>({});

  const progressRef      = useRef(0);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Countdown ── */
  useEffect(() => {
    const tick = () => {
      const now   = new Date();
      const start = WORLD_CUP_START.getTime() - now.getTime();
      const final = WORLD_CUP_FINAL.getTime()  - now.getTime();
      let diff = start; let lbl = "INICIO DEL MUNDIAL 2026";
      if (start <= 0 && final > 0) { diff = final; lbl = "TORNEO ACTIVO · RUTA A LA FINAL"; }
      if (start <= 0 && final <= 0){ diff = 0;     lbl = "TEMPORADA COMPLETADA"; }
      setCountdown({ d: Math.max(0,Math.floor(diff/86400000)), h: Math.max(0,Math.floor((diff%86400000)/3600000)), m: Math.max(0,Math.floor((diff%3600000)/60000)), s: Math.max(0,Math.floor((diff%60000)/1000)) });
      setCdLabel(lbl);
      const n = new Date();
      setCurrentTime(`${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Stats desde Supabase ── */
  useEffect(() => {
    const load = async () => {
      try {
        const { data: profiles } = await supabase.from("profiles").select("lives").order("created_at", { ascending: false });
        if (profiles) {
          setStats(prev => ({ ...prev, vivos: profiles.filter(p => (p.lives??0) > 0).length, coma: profiles.filter(p => (p.lives??0) === 1).length, elim: profiles.filter(p => (p.lives??0) === 0).length }));
        }
        const { data: jackpotData } = await supabase.from("tournaments").select("prize_current").eq("status","active").order("prize_current",{ascending:false}).limit(1).maybeSingle();
        if (jackpotData?.prize_current) setStats(prev => ({ ...prev, jackpot: jackpotData.prize_current }));
      } catch {}
    };
    load();
    const dbInt = setInterval(load, 30000);
    const simInt = setInterval(() => setStats(prev => ({ ...prev, vivos: prev.vivos + Math.floor(Math.random()*3)-1, coma: Math.max(0, prev.coma + Math.floor(Math.random()*3)-1), elim: prev.elim + Math.floor(Math.random()*2), jackpot: prev.jackpot + Math.floor(Math.random()*50+10) })), 2500);
    return () => { clearInterval(dbInt); clearInterval(simInt); };
  }, []);

  /* ── Alertas realtime ── */
  useEffect(() => {
    const EV = [{ text:"NUEVO JUGADOR INGRESADO", color:"#8dc63f" }, { text:"JUGADOR EN ESTADO CRÍTICO", color:"#f59e0b" }, { text:"JUGADOR ELIMINADO", color:"#ef4444" }, { text:"ACUMULADO ACTUALIZADO", color:"#8dc63f" }];
    const channel = supabase.channel("hero-alerts").on("postgres_changes",{event:"*",schema:"public",table:"profiles"},(payload)=>{
      const p = payload.new as any; let ev = null;
      if (payload.eventType==="INSERT") ev = EV[0];
      else if (payload.eventType==="UPDATE") { if ((p.lives??0)===0) ev = EV[2]; else if ((p.lives??0)===1) ev = EV[1]; }
      if (ev) { const id = Date.now(); setNotifs(prev => [{ id, text: ev!.text+" #"+Math.floor(Math.random()*90000+10000), color:ev!.color }, ...prev].slice(0,4)); setTimeout(() => setNotifs(prev => prev.filter(n => n.id !== id)), 4500); }
    }).subscribe();
    const iv = setInterval(() => { if (Math.random() > 0.65) { const ev = EV[Math.floor(Math.random()*EV.length)]; const id = Date.now(); setNotifs(prev => [{ id, text:ev.text+" #"+Math.floor(Math.random()*90000+10000), color:ev.color }, ...prev].slice(0,4)); setTimeout(() => setNotifs(prev => prev.filter(n => n.id !== id)), 4500); } }, 3500);
    return () => { supabase.removeChannel(channel); clearInterval(iv); };
  }, []);

  /* ── Canvas partículas (muy sutiles, sin neón) ── */
  useEffect(() => {
    const canvas = canvasRef.current; const hero = heroRef.current;
    if (!canvas || !hero) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const resize = () => { canvas.width = hero.offsetWidth; canvas.height = hero.offsetHeight; };
    resize(); window.addEventListener("resize", resize);
    const pts = Array.from({ length: 35 }, () => ({ x: Math.random()*800, y: Math.random()*460, vx:(Math.random()-.5)*.25, vy:-(Math.random()*.35+.08), r:Math.random()*1.2+.3, a:Math.random()*.3+.05, life:Math.random() }));
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.life+=.0025;
        if (p.y<-5||p.life>1){ p.x=Math.random()*canvas.width; p.y=canvas.height+5; p.life=0; }
        const alpha = p.a * Math.sin(p.life*Math.PI);
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = `rgba(141,198,63,${alpha*0.6})`; ctx.fill();
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener("resize",resize); cancelAnimationFrame(animRef.current); };
  }, []);

  /* ── Slider ── */
  const goTo = useCallback((n: number) => {
    const next = ((n % SLIDES.length) + SLIDES.length) % SLIDES.length;
    setActiveClass(false);
    setTimeout(() => { setCurrent(next); setActiveClass(true); }, 50);
    progressRef.current = 0; setProgress(0);
  }, []);

  const startProgress = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    progressRef.current = 0; setProgress(0);
    progressInterval.current = setInterval(() => {
      progressRef.current += TICK_MS;
      const pct = Math.min(100, (progressRef.current / SLIDE_DURATION) * 100);
      setProgress(pct);
      if (progressRef.current >= SLIDE_DURATION) {
        if (progressInterval.current) clearInterval(progressInterval.current);
        setCurrent(prev => { const next=(prev+1)%SLIDES.length; setActiveClass(false); setTimeout(()=>setActiveClass(true),50); progressRef.current=0; setProgress(0); return next; });
      }
    }, TICK_MS);
  }, []);

  useEffect(() => { startProgress(); return () => { if (progressInterval.current) clearInterval(progressInterval.current); }; }, [current, startProgress]);

  const handlePrev = () => { if (progressInterval.current) clearInterval(progressInterval.current); goTo(current-1); startProgress(); };
  const handleNext = () => { if (progressInterval.current) clearInterval(progressInterval.current); goTo(current+1); startProgress(); };
  const handleDot  = (i: number) => { if (progressInterval.current) clearInterval(progressInterval.current); goTo(i); startProgress(); };

  const jackpotStr = "$" + stats.jackpot.toLocaleString();
  const slide = SLIDES[current];

  /* ── Selección de cuota ── */
  const selectOdd = (matchIdx: number, oddIdx: number) => {
    setSelOdds(prev => ({ ...prev, [matchIdx]: prev[matchIdx] === oddIdx ? -1 : oddIdx }));
  };

  return (
    <div className="lk-hero" ref={heroRef}>

      {/* ── Alertas flotantes ── */}
      <div className="lk-alert-container">
        {notifs.map(n => (
          <div key={n.id} className="lk-alert-card" style={{ borderLeft: `3px solid ${n.color}` }}>
            <span className="lk-alert-dot" style={{ background: n.color }} />
            {n.text}
          </div>
        ))}
      </div>

      {/* ============================================================
          NAVBAR — Estilo Codere
          ============================================================ */}
      <nav className="lk-nav">
        <div className="lk-nav-brand">
          {/* Usa img si tienes logo, o texto fallback */}
          <img
            src="/img/logo12.png"
            alt="Kick Last"
            className="lk-nav-logo-img"
            onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }}
          />
          <span className="lk-nav-logo-text" style={{display:"none"}}>Last <span>Kick</span></span>
        </div>

        {/* Menú horizontal igual a Codere */}
        <div className="lk-nav-menu">
          <a className="lk-nav-link active">Predicciones</a>
          <a className="lk-nav-link">Mundial</a>
          <a className="lk-nav-link">En Vivo</a>
          <a className="lk-nav-link">Crown</a>
          <a className="lk-nav-link">Premio</a>
          <a className="lk-nav-link">Promociones</a>
          <a className="lk-nav-link">Recargas y Vidas</a>
        </div>

        <div className="lk-nav-right">
          <div className="lk-jackpot">
            <span className="lk-jackpot-label">ACUMULADO</span>
            <span className="lk-jackpot-val">{jackpotStr}</span>
          </div>
          <Link href="/login">
            <button className="lk-btn-login">Acceder</button>
          </Link>
          <Link href="/register">
            <button className="lk-btn-register">+ Crear cuenta</button>
          </Link>
        </div>
      </nav>

      {/* ============================================================
          HERO VIEWPORT — Fullwidth estilo Codere
          ============================================================ */}
      <div className="lk-viewport">
        <canvas className="lk-pcanvas" ref={canvasRef} />

        {/* Slider */}
        <div className="lk-track" style={{ transform: `translateX(-${current * 100}%)` }}>
          {SLIDES.map((s, i) => (
            <div key={i} className={`lk-slide ${i === current ? "lk-slide--active" : ""}`}>
              <div className="lk-slide-bg" style={{ backgroundImage: `url(${s.image})` }} />
              <div className="lk-slide-overlay" />
            </div>
          ))}
        </div>

        {/* Contenido flotante */}
        <div className={`lk-overlay-content ${activeClass ? "lk-content--in" : ""}`}>

          {/* Bloque IZQUIERDO */}
          <div className="lk-left">
            <div className="lk-headline-anim">
              <div className="lk-eyebrow">
                <div className="lk-eyebrow-line" />
                <span className="lk-eyebrow-text">Juego de predicciones de fútbol</span>
              </div>
              <h1 className="lk-headline">
                {slide.headline[0]}<br />
                <span className="lk-headline-red">{slide.headline[1]}</span>
              </h1>
            </div>

            <p className="lk-sub lk-sub-anim">{slide.sub}</p>

            <div className="lk-btns lk-btns-anim">
              
              
            </div>
            

            <div className="lk-proof lk-proof-anim">
              <div className="lk-proof-item">
                <div className="lk-proof-dot live" />
                <span>{stats.vivos.toLocaleString()} Operadores activos</span>
              </div>
              <div className="lk-proof-item">
                <div className="lk-proof-dot" />
                <span>Conexión cifrada</span>
              </div>
            </div>
          </div>

          {/* Bloque DERECHO — HUD sobrio estilo Codere */}
          <div className="lk-right">
            {/* Countdown */}
            <div className="lk-countdown">
              <div className="lk-cd-label">{cdLabel}</div>
              <div className="lk-cd-units">
                {[{ val: countdown.d, lbl:"DÍAS" }, { val: countdown.h, lbl:"HRS" }, { val: countdown.m, lbl:"MIN" }, { val: countdown.s, lbl:"SEG" }].map((u,i) => (
                  <div key={i} className="lk-cd-unit">
                    <div className="lk-cd-num">{pad(u.val)}</div>
                    <div className="lk-cd-lbl">{u.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats grid */}
            <div className="lk-stats">
              <div className="lk-stat"><div className="lk-stat-accent green" /><div className="lk-stat-val green">{stats.vivos.toLocaleString()}</div><div className="lk-stat-lbl">Vivos</div></div>
              <div className="lk-stat"><div className="lk-stat-accent yellow" /><div className="lk-stat-val yellow">{stats.coma.toLocaleString()}</div><div className="lk-stat-lbl">En Coma</div></div>
              <div className="lk-stat"><div className="lk-stat-accent red" /><div className="lk-stat-val red">{stats.elim.toLocaleString()}</div><div className="lk-stat-lbl">Eliminados</div></div>
              <div className="lk-stat"><div className="lk-stat-accent cyan" /><div className="lk-stat-val cyan">$200K</div><div className="lk-stat-lbl">Premio Máx</div></div>
            </div>

            {/* Monitor de rango */}
            <div className="lk-status">
              <div className="lk-status-header">
                <span className="lk-status-title">MONITOR DE RANGO</span>
                <div className="lk-status-live"><div className="lk-status-live-dot" /> LIVE</div>
              </div>
              {[
                { key:"FASE",       val:"FASE DE GRUPOS", accent:"cyan"  },
                { key:"INICIO",     val:"11 JUN · 18:00", accent:""      },
                { key:"ACUMULADO",  val: jackpotStr,       accent:"green" },
                { key:"SISTEMA",    val:"ESTABLE",         accent:"green" },
              ].map((row,i) => (
                <div key={i} className="lk-status-row">
                  <span className="lk-status-key">{row.key}</span>
                  <span className={`lk-status-val${row.accent ? " accent-"+row.accent : ""}`}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Marcos decorativos */}
        <div className="lk-corner lk-corner--tl" />
        <div className="lk-corner lk-corner--tr" />
        <div className="lk-corner lk-corner--bl" />
        <div className="lk-corner lk-corner--br" />

        {/* Flechas nav */}
        <button className="lk-nav-arrow lk-nav-arrow--prev" onClick={handlePrev} aria-label="Anterior">‹</button>
        <button className="lk-nav-arrow lk-nav-arrow--next" onClick={handleNext} aria-label="Siguiente">›</button>

        {/* Dots */}
        <div className="lk-dots">
          {SLIDES.map((_,i) => (
            <button key={i} className={`lk-dot ${i===current ? "lk-dot--active" : ""}`} onClick={()=>handleDot(i)} aria-label={`Slide ${i+1}`} />
          ))}
        </div>

        <div className="lk-slide-counter"><strong>{pad(current+1)}</strong> / {pad(SLIDES.length)}</div>
        <div className="lk-energy" />
      </div>

      {/* PROGRESS BAR */}
      <div className="lk-progress-bar">
        <div className="lk-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* PANEL INFERIOR INFO */}
      <div className="lk-info-wrap">
        <div className="lk-info-track" style={{ transform: `translateX(-${current*100}%)` }}>
          {SLIDES.map((s,i) => (
            <div key={i} className="lk-info-panel">
              <div className="lk-info-left">
                <div className="lk-info-cat">{s.category}</div>
                <div className="lk-info-headline">{s.infoHeadline}</div>
                {s.desc && <div className="lk-info-desc">{s.desc}</div>}
                <div className="lk-info-tags">
                  {s.tags.map((t,j) => <span key={j} className="lk-info-tag">{t}</span>)}
                </div>
              </div>
              <div className="lk-info-num">{pad(i+1)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================
          PARTIDOS DESTACADOS — Réplica exacta Codere
          ============================================================ */}
      <div className="lk-matches-section">
        <div className="lk-matches-title">PARTIDOS DESTACADOS</div>
        <div className="lk-matches-scroll">
          {MATCHES.map((m, mi) => (
            <div key={mi} className="lk-match-col">
              {/* Header */}
              <div className="lk-match-header">
                <span className="lk-match-league">{m.league}</span>
                {m.live
                  ? <span className="lk-live-pill">LIVE</span>
                  : <span className="lk-match-time">{m.time}</span>
                }
              </div>

              {/* Equipos */}
              <div className="lk-match-body">
                <div className="lk-match-team-row">
                  <div className="lk-team-name"><span className="lk-team-flag">{m.team1.flag}</span>{m.team1.name}</div>
                  <span className="lk-match-score">{m.score1}</span>
                </div>
                <div className="lk-match-team-row">
                  <div className="lk-team-name"><span className="lk-team-flag">{m.team2.flag}</span>{m.team2.name}</div>
                  <span className="lk-match-score">{m.score2}</span>
                </div>
              </div>

              {/* Cuotas */}
              <div className={`lk-odds-row ${m.odds.length === 2 ? "two" : "three"}`}>
                {m.odds.map((o, oi) => (
                  <div
                    key={oi}
                    className={`lk-odd-btn ${selOdds[mi] === oi ? "sel" : ""}`}
                    onClick={() => selectOdd(mi, oi)}
                  >
                    <span className="lk-odd-l">{o.l}</span>
                    <span className="lk-odd-v">{o.v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="lk-bottom">
        <span className="lk-bottom-label">Kick Last © OPERACIÓN MUNDIAL 2026</span>
        <div className="lk-bottom-pills">
          {["FÚTBOL", "CONEXIÓN SEGURA", "PREDICCIONES"].map((p,i) => (
            <span key={i} className="lk-pill">{p}</span>
          ))}
        </div>
        <span className="lk-bottom-label">{currentTime}</span>
      </div>

    </div>
  );
}