"use client";

import { AnimatePresence, motion } from "framer-motion";

interface AboutProps {
  activeProtocolId: string | null;
  setActiveProtocolId: (id: string | null) => void;
}

export default function About({
  activeProtocolId,
  setActiveProtocolId,
}: AboutProps) {
  const stats = [
    { v: "104", unit: "PARTIDOS",  sub: "grupos → final" },
    { v: "8",   unit: "VIDAS",     sub: "para sobrevivir" },
    { v: "$5",  unit: "ENTRADA",   sub: "usd por jugador" },
    { v: "1",   unit: "GANADOR",   sub: "se lleva todo" },
  ];

  const protocols = [
    {
      id: "INFO", n: "01", t: "REGISTRO",
      color: "#00C853", dimColor: "rgba(0,200,83,0.18)",
      icon: "◈", badge: "PRIMER PASO",
      d: "Activa tu identidad táctica por $5 USD. El sistema te asignará 8 VIDAS iniciales para iniciar la supervivencia en el Mundial 2026.",
    },
    {
      id: "AUTH", n: "02", t: "RECARGA",
      color: "#2196F3", dimColor: "rgba(33,150,243,0.18)",
      icon: "⬡", badge: "ABASTECIMIENTO",
      d: "Recupera capacidad operativa comprando paquetes PITCHX: $3 (1 vida), $5 (2 vidas) o $8 (3 vidas). Cada recarga alimenta la Bóveda Global.",
    },
    {
      id: "PX", n: "03", t: "PREDICCIÓN",
      color: "#9C27B0", dimColor: "rgba(156,39,176,0.18)",
      icon: "◎", badge: "DECISIÓN TÁCTICA",
      d: "Firma tu predicción (Victoria o Empate) antes de cada partido. El acierto te mantiene en pie; el error o la omisión drena -1 VIDA de tu cuenta.",
    },
    {
      id: "PLAY", n: "04", t: "SISTEMA VIDAS",
      color: "#FFD700", dimColor: "rgba(255,215,0,0.18)",
      icon: "◆", badge: "REGENERACIÓN",
      d: "Premio a la precisión: Si logras una racha de 5 aciertos consecutivos, el sistema inyectará automáticamente +1 VIDA EXTRA a tu perfil.",
    },
    {
      id: "JACK", n: "05", t: "LA FINAL",
      color: "#FF0033", dimColor: "rgba(255,0,51,0.18)",
      icon: "★", badge: "GLORIA TOTAL",
      d: "Solo los sobrevivientes que lleguen con al menos 1 vida al partido 104 podrán predecir el desenlace final por el premio total acumulado.",
    },
  ];

  const roadmap = [
    { e: "🌍", n: "GRUPOS",  s: "48 partidos",  dim: true  },
    { e: "⚔️", n: "OCTAVOS", s: "16 partidos",  dim: true  },
    { e: "🔥", n: "CUARTOS", s: "8 partidos",   dim: true  },
    { e: "💀", n: "SEMIS",   s: "4 partidos",   dim: true  },
    { e: "🏆", n: "FINAL",   s: "1 ganador",    dim: false },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* TICKER */
        @keyframes lk-tick { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .lk-ticker { display:flex; gap:52px; width:max-content; animation:lk-tick 32s linear infinite; overflow:hidden; }

        /* CORNER DECORATION — helper class */
        .lk-corner-box {
          position: relative;
          background: rgba(0,0,0,0.48);
          backdrop-filter: blur(12px);
        }
        /* top-left corner */
        .lk-corner-box::before {
          content: '';
          position: absolute;
          top: -1px; left: -1px;
          width: 18px; height: 18px;
          border-top: 2px solid var(--lk-c, #00C853);
          border-left: 2px solid var(--lk-c, #00C853);
          pointer-events: none;
          z-index: 2;
        }
        /* bottom-right corner */
        .lk-corner-box::after {
          content: '';
          position: absolute;
          bottom: -1px; right: -1px;
          width: 18px; height: 18px;
          border-bottom: 2px solid var(--lk-c, #00C853);
          border-right: 2px solid var(--lk-c, #00C853);
          pointer-events: none;
          z-index: 2;
        }

        /* STAT CARD */
        .lk-stat {
          position: relative;
          background: rgba(0,0,0,0.42);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 24px 14px 20px;
          text-align: center;
          transition: background .2s, transform .2s;
          overflow: hidden;
        }
        .lk-stat::before {
          content: '';
          position: absolute; top:-1px; left:-1px;
          width:14px; height:14px;
          border-top: 2px solid #00C853;
          border-left: 2px solid #00C853;
        }
        .lk-stat::after {
          content: '';
          position: absolute; bottom:-1px; right:-1px;
          width:14px; height:14px;
          border-bottom: 2px solid rgba(0,200,83,0.35);
          border-right: 2px solid rgba(0,200,83,0.35);
        }
        .lk-stat:hover { background:rgba(0,200,83,0.04); transform:translateY(-3px); }

        /* PROTO CARD */
        .lk-proto {
          position: relative;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.07);
          display: flex;
          flex-direction: column;
          transition: transform .22s ease, background .22s ease, box-shadow .22s ease, border-color .22s ease;
          overflow: visible;
        }
        .lk-proto::before {
          content: '';
          position: absolute; top:-1px; left:-1px;
          width:16px; height:16px;
          border-top: 2px solid var(--pc, #fff);
          border-left: 2px solid var(--pc, #fff);
          opacity: 0.3;
          transition: opacity .22s, width .22s, height .22s;
          z-index: 3;
        }
        .lk-proto::after {
          content: '';
          position: absolute; bottom:-1px; right:-1px;
          width:16px; height:16px;
          border-bottom: 2px solid var(--pc, #fff);
          border-right: 2px solid var(--pc, #fff);
          opacity: 0.3;
          transition: opacity .22s, width .22s, height .22s;
          z-index: 3;
        }
        .lk-proto:hover::before,
        .lk-proto:hover::after { opacity: 0.7; width:20px; height:20px; }
        .lk-proto.on::before,
        .lk-proto.on::after { opacity: 1; width:22px; height:22px; }

        /* VER BUTTON */
        .lk-ver-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: calc(100% - 24px);
          margin: 0 12px 12px;
          padding: 9px 0;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.4);
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all .2s ease;
          position: relative;
          z-index: 1;
        }
        .lk-ver-btn:hover {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.8);
          border-color: rgba(255,255,255,0.2);
        }
        .lk-ver-btn.on {
          border-color: var(--pc, #fff);
          background: rgba(0,0,0,0.3);
          color: var(--pc, #fff);
        }
        .lk-ver-arrow {
          display: inline-block;
          transition: transform .2s;
          font-style: normal;
        }
        .lk-ver-btn.on .lk-ver-arrow { transform: rotate(180deg); }

        /* PANEL */
        .lk-panel {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.06);
          border-top: none;
          backdrop-filter: blur(14px);
        }
        .lk-panel::before {
          content:'';
          position:absolute; top:-1px; left:-1px;
          width:20px; height:20px;
          border-top: 2px solid var(--pc,#fff);
          border-left: 2px solid var(--pc,#fff);
          opacity:.6; z-index:2;
        }
        .lk-panel::after {
          content:'';
          position:absolute; bottom:-1px; right:-1px;
          width:20px; height:20px;
          border-bottom: 2px solid var(--pc,#fff);
          border-right: 2px solid var(--pc,#fff);
          opacity:.6; z-index:2;
        }

        /* ROADMAP */
        .lk-stage { opacity:.22; transition:opacity .25s, transform .25s; cursor:default; }
        .lk-stage:hover { opacity:.55; transform:translateY(-3px); }
        .lk-stage.is-on { opacity:1; }

        /* BLINK */
        @keyframes lk-bd { 0%,100%{opacity:1} 50%{opacity:0} }
        .lk-bd { animation:lk-bd 1.3s step-end infinite; }

        /* VAULT PULSE */
        @keyframes lk-vp { 0%,100%{opacity:1} 50%{opacity:.45} }
        .lk-vp { animation:lk-vp 2.6s ease-in-out infinite; }

        /* LABEL */
        .lk-label {
          display: inline-flex; align-items:center; gap:10px;
          font-family: var(--font-mono, monospace);
          font-size: 9px; letter-spacing:4px;
          color: rgba(255,255,255,0.28);
          margin-bottom: 10px;
        }
        .lk-label::before {
          content:''; display:block;
          width:22px; height:1px; background:#FF0033;
        }

        /* CLOSE */
        .lk-x {
          position:absolute; top:14px; right:18px;
          font-size:20px; font-weight:200; line-height:1;
          color:rgba(255,255,255,0.2); cursor:pointer;
          transition:color .15s, transform .2s; z-index:5;
        }
        .lk-x:hover { color:#fff; transform:rotate(90deg); }
      ` }} />

      <section
        id="last-kick-protocol"
        style={{
          position: "relative", zIndex: 40,
          background: "rgba(0,0,0,0.1)",
          backdropFilter: "blur(4px)",
          width: "100%", color: "#fff",
          borderTop: "1px solid rgba(0,200,83,0.2)",
          padding: "0 0 100px",
          userSelect: "none", cursor: "default",
        }}
      >

        {/* TICKER */}
        <div style={{ background:"rgba(0,0,0,0.65)", borderBottom:"1px solid rgba(255,255,255,0.04)", padding:"9px 0", marginBottom:"60px", overflow:"hidden" }}>
          <div className="lk-ticker" style={{ fontFamily:"var(--font-mono,monospace)", fontSize:"9px", letterSpacing:"3px", color:"rgba(0,200,83,0.4)" }}>
            {[...Array(4)].flatMap(() =>
              ["▸ LAST KICK 2026","▸ 104 PARTIDOS","▸ 8 VIDAS","▸ ENTRADA $5 USD","▸ BÓVEDA $500K+","▸ UN SOLO GANADOR","▸ MUNDIAL FIFA 2026","▸ SOBREVIVE O MUERE"]
            ).map((t, i) => <span key={i} style={{ whiteSpace:"nowrap" }}>{t}</span>)}
          </div>
        </div>

        {/* HERO */}
        <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"0 5vw", display:"flex", gap:"14px", alignItems:"stretch" }}>

          {/* MANIFIESTO */}
          <div
            className="lk-corner-box"
            style={{
              flex:"3", padding:"40px 48px",
              border:"1px solid rgba(255,255,255,0.07)",
              position:"relative", overflow:"hidden",
              "--lk-c":"#00C853",
            } as any}
          >
            {/* extra top-right corner */}
            <div style={{ position:"absolute", top:-1, right:-1, width:18, height:18, borderTop:"2px solid rgba(0,200,83,0.25)", borderRight:"2px solid rgba(0,200,83,0.25)" }} />
            {/* extra bottom-left corner */}
            <div style={{ position:"absolute", bottom:-1, left:-1, width:18, height:18, borderBottom:"2px solid rgba(0,200,83,0.25)", borderLeft:"2px solid rgba(0,200,83,0.25)" }} />

            <div className="lk-label">PROTOCOLO ACTIVO</div>
            <h2 style={{ fontFamily:"Anton,sans-serif", fontSize:"clamp(28px,3.8vw,50px)", lineHeight:"0.92", textTransform:"uppercase", margin:"0 0 18px", fontWeight:"400", letterSpacing:"-0.5px" }}>
              ¿Qué es<br /><span style={{ color:"#00C853" }}>Last Kick?</span>
            </h2>
            <p style={{ color:"rgba(255,255,255,0.52)", fontSize:"14px", lineHeight:"1.8", maxWidth:"580px", margin:0, fontWeight:300 }}>
              El primer juego de supervivencia del{" "}
              <span style={{ color:"rgba(255,255,255,0.9)", fontWeight:500 }}>Mundial 2026</span>.
              No es un pasatiempo — es una batalla de{" "}
              <span style={{ color:"#00C853", fontWeight:500 }}>104 partidos</span>{" "}
              donde la precisión táctica es tu única defensa. Sobrevive y reclama la bóveda.
            </p>
          </div>

          {/* BÓVEDA */}
          <div
            className="lk-corner-box"
            style={{
              flex:"1", minWidth:"155px",
              border:"1px solid rgba(0,200,83,0.18)",
              display:"flex", flexDirection:"column", justifyContent:"center",
              padding:"28px 18px", textAlign:"center",
              "--lk-c":"#00C853",
            } as any}
          >
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px", fontFamily:"var(--font-mono,monospace)", fontSize:"8px", letterSpacing:"2px", color:"rgba(255,255,255,0.25)" }}>
              <span>ACCESO</span>
              <span className="lk-bd" style={{ display:"inline-block", width:"5px", height:"5px", borderRadius:"50%", background:"#00C853" }} />
            </div>
            <div style={{ fontFamily:"Anton,sans-serif", lineHeight:"1", letterSpacing:"-2px" }}>
              <span style={{ fontSize:"46px" }}>$5</span>
              <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.15)", marginLeft:"3px" }}>USD</span>
            </div>
            <div style={{ margin:"14px 0", height:"1px", background:"linear-gradient(90deg,transparent,rgba(0,200,83,0.3),transparent)" }} />
            <div style={{ fontFamily:"var(--font-mono,monospace)", fontSize:"8px", letterSpacing:"3px", color:"#00C853", marginBottom:"8px" }}>BÓVEDA ACTUAL</div>
            <div className="lk-vp" style={{ fontFamily:"Anton,sans-serif", fontSize:"34px", color:"#00C853", lineHeight:"1", letterSpacing:"-1px" }}>$500K+</div>
          </div>
        </div>

        {/* STATS */}
        <div style={{ maxWidth:"1200px", margin:"46px auto 0", padding:"0 5vw", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px" }}>
          {stats.map((s, i) => (
            <div key={i} className="lk-stat">
              <div style={{ display:"flex", alignItems:"baseline", justifyContent:"center", gap:"5px" }}>
                <span style={{ fontFamily:"Anton,sans-serif", fontSize:"38px", lineHeight:"1", letterSpacing:"-1px" }}>{s.v}</span>
                <span style={{ fontFamily:"var(--font-mono,monospace)", fontSize:"9px", color:"#00C853", letterSpacing:"2px" }}>{s.unit}</span>
              </div>
              <div style={{ fontFamily:"var(--font-mono,monospace)", fontSize:"8px", color:"rgba(255,255,255,0.2)", letterSpacing:"1px", marginTop:"6px" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* MECÁNICAS */}
        <div style={{ maxWidth:"1200px", margin:"68px auto 0", padding:"0 5vw" }}>
          <div style={{ marginBottom:"30px" }}>
            <div className="lk-label">SISTEMA TÁCTICO</div>
            <h2 style={{ fontFamily:"Anton,sans-serif", fontSize:"clamp(24px,3.5vw,46px)", textTransform:"uppercase", margin:0, lineHeight:"0.92", fontWeight:"400", letterSpacing:"-0.5px" }}>
              Mecánicas de <span style={{ color:"#00C853" }}>Supervivencia</span>
            </h2>
          </div>

          {/* PROTOCOL CARDS */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"8px" }}>
            {protocols.map((cat) => {
              const on = activeProtocolId === cat.id;
              return (
                <div
                  key={cat.id}
                  className={`lk-proto${on ? " on" : ""}`}
                  style={{
                    "--pc": cat.color,
                    borderColor: on ? `${cat.color}55` : "rgba(255,255,255,0.07)",
                    background: on ? `rgba(0,0,0,0.6)` : "rgba(0,0,0,0.45)",
                    boxShadow: on ? `0 0 28px ${cat.color}14, inset 0 0 24px ${cat.color}06` : "none",
                  } as any}
                >
                  {/* BADGE */}
                  <div style={{
                    background: on ? `${cat.color}18` : "rgba(255,255,255,0.03)",
                    borderBottom: `1px solid ${on ? cat.color + "30" : "rgba(255,255,255,0.05)"}`,
                    padding:"7px 10px",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    transition:"background .2s",
                  }}>
                    <span style={{ fontFamily:"var(--font-mono,monospace)", fontSize:"7px", letterSpacing:"1.5px", color: on ? cat.color : "rgba(255,255,255,0.18)", transition:"color .2s" }}>
                      {cat.badge}
                    </span>
                    <span style={{ fontSize:"11px", color:cat.color, opacity: on ? 1 : 0.2, transition:"opacity .2s" }}>
                      {cat.icon}
                    </span>
                  </div>

                  {/* BODY */}
                  <div style={{ padding:"18px 14px 14px", flex:1 }}>
                    {/* number */}
                    <div style={{ fontFamily:"Anton,sans-serif", fontSize:"32px", lineHeight:"1", color:cat.color, letterSpacing:"-1px", textShadow: on ? `0 0 18px ${cat.color}55` : "none", transition:"text-shadow .2s", marginBottom:"8px" }}>
                      {cat.n}
                    </div>
                    {/* title */}
                    <div style={{ fontFamily:"var(--font-mono,monospace)", fontSize:"9px", letterSpacing:"1.5px", color: on ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)", textTransform:"uppercase", lineHeight:1.4, transition:"color .2s" }}>
                      {cat.t}
                    </div>
                  </div>

                  {/* VER BUTTON */}
                  <button
                    className={`lk-ver-btn${on ? " on" : ""}`}
                    style={{ "--pc": cat.color } as any}
                    onClick={() => setActiveProtocolId(on ? null : cat.id)}
                  >
                    <i className="lk-ver-arrow">{on ? "▲" : "▼"}</i>
                    {on ? "CERRAR" : "VER INFO"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* PANEL EXPANDIDO */}
          <AnimatePresence mode="wait">
            {activeProtocolId && (() => {
              const cat = protocols.find(p => p.id === activeProtocolId);
              if (!cat) return null;
              return (
                <motion.div
                  key={activeProtocolId}
                  className="lk-panel"
                  initial={{ opacity:0, height:0 }}
                  animate={{ opacity:1, height:"auto" }}
                  exit={{ opacity:0, height:0 }}
                  transition={{ duration:0.22, ease:[0.4,0,0.2,1] }}
                  style={{
                    "--pc": cat.color,
                    background:"rgba(0,0,0,0.55)",
                    borderColor:`${cat.color}22`,
                    marginTop:"2px",
                  } as any}
                >
                  {/* bg tint */}
                  <div style={{ position:"absolute", inset:0, background:`${cat.color}05`, pointerEvents:"none" }} />
                  {/* top bar */}
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:`linear-gradient(90deg,${cat.color}50,transparent)` }} />

                  <div className="lk-x"
                    onClick={() => setActiveProtocolId(null)}
                    onMouseEnter={(e) => (e.currentTarget.style.color = cat.color)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
                  >×</div>

                  <div style={{ padding:"28px 40px", position:"relative", zIndex:1 }}>
                    <div style={{ fontFamily:"var(--font-mono,monospace)", fontSize:"8px", letterSpacing:"3px", color:cat.color, opacity:0.7, marginBottom:"10px" }}>
                      {cat.icon} {cat.n} — {cat.badge}
                    </div>
                    <h3 style={{ fontFamily:"Anton,sans-serif", fontSize:"clamp(16px,2.2vw,24px)", color:"#fff", textTransform:"uppercase", margin:"0 0 12px", lineHeight:1, letterSpacing:"1px" }}>
                      {cat.t}
                    </h3>
                    <p style={{ color:"rgba(255,255,255,0.58)", fontSize:"14px", lineHeight:"1.8", margin:0, fontWeight:300, maxWidth:"680px" }}>
                      {cat.d}
                    </p>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>

        {/* ROADMAP */}
        <div style={{ maxWidth:"1200px", margin:"80px auto 0", padding:"0 5vw" }}>
          <div style={{ marginBottom:"36px" }}>
            <div className="lk-label">ROAD TO GLORY</div>
            <h2 style={{ fontFamily:"Anton,sans-serif", fontSize:"clamp(24px,3.5vw,46px)", textTransform:"uppercase", margin:0, lineHeight:"0.92", fontWeight:"400", letterSpacing:"-0.5px" }}>
              De 200,000 sobrevive <span style={{ color:"#FF0033" }}>Uno</span>
            </h2>
          </div>

          <div style={{ display:"flex", alignItems:"center", maxWidth:"620px" }}>
            {roadmap.map((item, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", flex:1 }}>
                <div className={`lk-stage${!item.dim ? " is-on" : ""}`} style={{ textAlign:"center", width:"100%" }}>
                  <div style={{
                    width:"50px", height:"50px",
                    margin:"0 auto 10px",
                    border: !item.dim ? "1px solid rgba(255,0,51,0.55)" : "1px solid rgba(255,255,255,0.07)",
                    background: !item.dim ? "rgba(255,0,51,0.07)" : "rgba(0,0,0,0.4)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"20px",
                    boxShadow: !item.dim ? "0 0 16px rgba(255,0,51,0.18)" : "none",
                    position:"relative",
                  }}>
                    {/* corner deco on active */}
                    {!item.dim && <>
                      <div style={{ position:"absolute", top:-1, left:-1, width:8, height:8, borderTop:"1px solid #FF0033", borderLeft:"1px solid #FF0033" }} />
                      <div style={{ position:"absolute", bottom:-1, right:-1, width:8, height:8, borderBottom:"1px solid #FF0033", borderRight:"1px solid #FF0033" }} />
                    </>}
                    {item.e}
                  </div>
                  <div style={{ fontFamily:"var(--font-mono,monospace)", fontSize:"8px", letterSpacing:"2px", color: !item.dim ? "#FF0033" : "rgba(255,255,255,0.3)", marginBottom:"2px" }}>{item.n}</div>
                  <div style={{ fontFamily:"var(--font-mono,monospace)", fontSize:"7px", color:"rgba(255,255,255,0.15)", letterSpacing:"1px" }}>{item.s}</div>
                </div>
                {i < roadmap.length - 1 && (
                  <div style={{ flex:"0 0 16px", height:"1px", background:"rgba(255,255,255,0.07)", marginBottom:"28px", flexShrink:0 }} />
                )}
              </div>
            ))}
          </div>
        </div>

      </section>
    </>
  );
}