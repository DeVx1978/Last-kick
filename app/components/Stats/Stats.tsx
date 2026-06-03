"use client";

import Link from "next/link";
import "./Stats.css";

/* ── Data ── */
const STEPS = [
  {
    num: "01",
    icon: "👤",
    title: "Regístrate",
    desc: (
      <>
        Crea tu cuenta <strong>gratis</strong> en segundos. Usa un correo
        verificable para mantener tu acceso seguro y no perder tus premios.
      </>
    ),
    tag: "Sin costo",
    href: "/register",
  },
  {
    num: "02",
    icon: "⚡",
    title: "Recarga vidas",
    desc: (
      <>
        Compra vidas con nuestros pines. Cada vida te permite hacer una
        predicción. Distribúyelas entre los torneos que más te interesen.
      </>
    ),
    tag: "Comprar vidas",
    href: "/recargar",
  },
  {
    num: "03",
    icon: "🎯",
    title: "Predice",
    desc: (
      <>
        Elige el resultado que crees que va a ocurrir en cada partido.
        Analiza, sigue tu intuición y demuestra que sabes más que los demás.
      </>
    ),
    tag: "Jugar ahora",
    href: "/partidos",
  },
  {
    num: "04",
    icon: "🏆",
    title: "Gana",
    desc: (
      <>
        Acierta las predicciones y reclama tu premio. Cada torneo tiene un
        premio <strong>independiente</strong>. Cuantos más aciertes, más ganas.
      </>
    ),
    tag: "Quiero ganar",
    href: "/register",
  },
];

const FAQS = [
  {
    color: "g",
    icon: "♻",
    q: "¿Qué pasa si pierdo una vida?",
    a: "Cada predicción incorrecta consume una vida. Sin vidas debes recargar para seguir compitiendo en los torneos activos.",
  },
  {
    color: "y",
    icon: "⏱",
    q: "¿Cuándo cierran las predicciones?",
    a: "Al inicio de cada partido. Una vez arranca el juego ya no puedes modificar ni añadir predicciones para ese evento.",
  },
  {
    color: "b",
    icon: "💰",
    q: "¿Cómo se reparten los premios?",
    a: "Cada torneo tiene un premio acumulado propio. Ganan quienes aciertan todas las predicciones del evento completo.",
  },
  {
    color: "r",
    icon: "📋",
    q: "¿Puedo jugar varios torneos?",
    a: "Sí. Distribuye tus vidas entre todos los torneos activos. Cada evento funciona de forma completamente independiente.",
  },
];

/* ── Component ── */
export default function HowToPlay() {
  return (
    <section className="lk-how" id="como-jugar">
      <div className="lk-how-inner">

        {/* HEADER */}
        <div className="lk-how-head">
          <div>
            <p className="lk-how-eyebrow">Instrucciones del juego</p>
            <h2 className="lk-how-title">¿Cómo jugar?</h2>
          </div>
          <p className="lk-how-desc">
            Kick Last es un juego de predicciones futbolísticas donde la
            intuición vale más que la suerte. Solo 4 pasos para empezar a ganar.
          </p>
        </div>

        {/* STEPS */}
        <div className="lk-steps-grid">
          {STEPS.map((s, i) => (
            <div key={i} className="lk-step">
              <div className="lk-step-bg-num">{s.num}</div>
              <div className="lk-step-top">
                <div className="lk-step-num">{s.num}</div>
                <span className="lk-step-icon">{s.icon}</span>
              </div>
              <div className="lk-step-title">{s.title}</div>
              <p className="lk-step-desc">{s.desc}</p>
              <Link href={s.href} className="lk-step-tag">
                {s.tag} <span className="lk-step-tag-arr">›</span>
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="lk-faq-grid">
          {FAQS.map((f, i) => (
            <div key={i} className="lk-faq-card">
              <div className={`lk-faq-ico ${f.color}`}>{f.icon}</div>
              <div>
                <div className="lk-faq-q">{f.q}</div>
                <p className="lk-faq-a">{f.a}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="lk-how-footer">
          <div className="lk-how-footer-l">
            <div className="lk-how-fdot" />
            <span className="lk-how-ftxt">Mundial 2026 · Cada vida cuenta</span>
          </div>
          <Link href="/register" className="lk-how-cta">
            + Crear cuenta gratis
          </Link>
        </div>

      </div>
    </section>
  );
}