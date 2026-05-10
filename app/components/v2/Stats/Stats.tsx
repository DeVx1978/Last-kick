"use client";


import { useState } from "react";
import "./Stats.css";


// ─── DATA ──────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    badge: "REGISTRO",
    icon: "💳",
    title: "Regístrate por $5 USD",
    tags: ["SIN COSTOS OCULTOS", "PAGO ÚNICO", "ACTIVACIÓN INMEDIATA"],
    stats: [
      { val: "$5",   lbl: "Entrada" },
      { val: "8",    lbl: "Vidas" },
      { val: "0",    lbl: "Subscripciones" },
    ],
    desc: (
      <>
        Crea tu cuenta y realiza un pago único de <strong>$5 USD</strong>. Al instante recibes{" "}
        <strong>8 vidas</strong> con las que debes sobrevivir los{" "}
        <span className="hl-cyan">104 partidos del Mundial</span>. Sin subscripciones, sin costos
        ocultos, sin sorpresas.
      </>
    ),
    cta: "Registrarme Ahora",
  },
  {
    num: "02",
    badge: "PREDICCIÓN",
    icon: "⚽",
    title: "Predice cada partido",
    tags: ["ANTES DEL PITAZO", "3 OPCIONES", "PLAZO LÍMITE"],
    stats: [
      { val: "3",   lbl: "Opciones" },
      { val: "104", lbl: "Partidos" },
      { val: "-1",  lbl: "Sin predecir" },
    ],
    desc: (
      <>
        Antes del pitazo inicial debes elegir:{" "}
        <strong>victoria local, empate o victoria visitante</strong>. Tienes plazo máximo hasta el
        inicio de cada partido.{" "}
        <span className="hl-red">Si no predices a tiempo: −1 vida automática.</span> La disciplina
        es parte del juego.
      </>
    ),
    cta: "Ver Calendario",
  },
  {
    num: "03",
    badge: "SUPERVIVENCIA",
    icon: "❤️",
    title: "Cuida tus vidas",
    tags: ["RACHA DE 5 = +1 VIDA", "RECARGA DISPONIBLE", "EN COMA = ALERTA"],
    stats: [
      { val: "-1", lbl: "Por error" },
      { val: "+1", lbl: "Racha x5" },
      { val: "∞",  lbl: "Recargas" },
    ],
    desc: (
      <>
        Cada predicción incorrecta cuesta <span className="hl-red">1 vida</span>. Acierta{" "}
        <span className="hl-green">5 partidos consecutivos</span> y ganas{" "}
        <span className="hl-green">+1 vida extra</span>. Si llegas a 0 vidas entras en{" "}
        <strong>modo Coma</strong> — puedes{" "}
        <span className="hl-cyan">recargar y seguir</span>. Cada recarga suma al pozo total.
      </>
    ),
    cta: "Ver Sistema de Vidas",
  },
  {
    num: "04",
    badge: "LA FINAL",
    icon: "🏆",
    title: "Predice La Final y llévate todo",
    tags: ["SOLO SOBREVIVIENTES", "TODO EL POZO", "UN GANADOR"],
    stats: [
      { val: "$500K+", lbl: "Premio" },
      { val: "1",      lbl: "Ganador" },
      { val: "0",      lbl: "Splits" },
    ],
    desc: (
      <>
        Solo quienes lleguen <strong>vivos</strong> al último partido pueden predecir la Gran Final
        del Mundial. El ganador de esa predicción se lleva{" "}
        <span className="hl-gold">todo el pozo acumulado</span>. Sin divisiones. Sin splits.{" "}
        <span className="hl-red">Todo para uno.</span>
      </>
    ),
    cta: "Ver Premio Acumulado",
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function HowToPlay() {
  const [open, setOpen] = useState<number | null>(0);

  const toggle = (i: number) => setOpen((prev) => (prev === i ? null : i));

  const progress =
    open !== null ? Math.round(((open + 1) / STEPS.length) * 100) : 0;

  return (
    <>

      <section className="lk-how" id="como-jugar">
        <div className="lk-grid-bg" />
        <div className="lk-wrap">

          {/* HEADER */}
          <div className="lk-how-header">
            <div>
              <div className="lk-eyebrow">Mecánicas del juego</div>
              <h2 className="lk-how-title">
                Cómo se<br />
                <span className="accent">juega</span>
              </h2>
            </div>
            <div className="lk-how-header-right">
              <p className="lk-how-desc">
                Cuatro pasos que separan al jugador promedio del único que llega a la Final.
                Selecciona cada fase para descubrir cómo funciona el sistema.
              </p>
              <div className="lk-prog-bar">
                <div className="lk-prog-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          {/* STEPS */}
          <div className="lk-steps">
            {STEPS.map((step, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={i}
                  className={`lk-step${isOpen ? " open" : ""}`}
                  onClick={() => toggle(i)}
                >
                  {/* HEADER ROW */}
                  <div className="lk-step-head">
                    <div className="lk-step-num">{step.num}</div>
                    <div className="lk-step-info">
                      <span className="lk-step-icon">{step.icon}</span>
                      <div>
                        <div className="lk-step-badge">{step.badge}</div>
                        <div className="lk-step-title">{step.title}</div>
                      </div>
                    </div>
                    <div className="lk-step-arrow">▼</div>
                  </div>

                  {/* BODY */}
                  <div className="lk-step-body">
                    <div className="lk-step-content">
                      <div className="lk-step-left-bar" />
                      <div className="lk-step-body-inner">
                        {/* STATS */}
                        <div className="lk-step-stats">
                          {step.stats.map((st, j) => (
                            <div key={j} className="lk-sstat">
                              <div className="lk-sstat-val">{st.val}</div>
                              <div className="lk-sstat-lbl">{st.lbl}</div>
                            </div>
                          ))}
                        </div>
                        {/* TAGS */}
                        <div className="lk-step-tags">
                          {step.tags.map((t, j) => (
                            <span key={j} className="lk-step-tag">{t}</span>
                          ))}
                        </div>
                        {/* DESC */}
                        <p className="lk-step-desc">{step.desc}</p>
                        {/* CTA */}
                        <button className="lk-step-cta">{step.cta} ▶</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BOTTOM META */}
          <div className="lk-meta">
            <div className="lk-meta-left">
              <div className="lk-meta-dot" />
              <span className="lk-meta-text">MUNDIAL 2026 • CADA VIDA CUENTA</span>
            </div>
            <button className="lk-meta-cta">+ CREAR CUENTA</button>
          </div>

        </div>
      </section>
    </>
  );
}