"use client";
import React, { useRef, useState, useEffect } from "react";
import "./Sponsors.css";

/* ══════════════════════════════════════
   DATA — agrega sponsors aquí fácilmente.
   Con 5, 10 o 50 marcas el diseño
   siempre funciona sin romper el layout.
   ══════════════════════════════════════ */
const MAIN_SPONSOR = {
  name: "Consorcio IMS",
  logo: "/img/logoims1.png",
  fb: "IMS",
  tagline: (
    <>
      Líderes en <span>gestión deportiva</span>
      <br />y desarrollo empresarial global
    </>
  ),
  description:
    "Consorcio IMS conecta marcas globales con el evento deportivo más grande del planeta. Más de 30 países y dos décadas de experiencia construyendo puentes entre el deporte y el negocio de alto impacto.",
  metrics: [
    { val: "3.5B+", lbl: "Espectadores" },
    { val: "104",   lbl: "Selecciones"  },
    { val: "#1",    lbl: "Evento global" },
    { val: "30+",   lbl: "Países"       },
  ],
  benefits: [
    { icon: "👁️", label: "Visibilidad masiva"      },
    { icon: "🎯", label: "Audiencia segmentada"     },
    { icon: "📊", label: "Métricas en tiempo real"  },
    { icon: "🤝", label: "Asociación estratégica"   },
  ],
};

/* ── Sponsors secundarios
   Para agregar más: solo añade un objeto al array.
   En desktop aparece en grid. En móvil, carrusel.
   ────────────────────────────────────────────── */
const OTHER_SPONSORS = [
  {
    id: "s2", type: "Patrocinador",
    name: "SureBets24/P", logo: "/img/surebets11.png", fb: "SB",
    desc: "Plataforma líder en análisis de apuestas deportivas con presencia en más de 20 mercados internacionales.",
  },
  {
    id: "s3", type: "Patrocinador",
    name: "GO! Sports", logo: "/img/gosports1.png", fb: "GO!",
    desc: "Marketing deportivo de alto impacto conectando marcas con los eventos más importantes del mundo.",
  },
  {
    id: "s4", type: "Desarrollador oficial",
    name: "DeVx Studio", logo: "/img/logodevx1.png", fb: "DVX",
    desc: "Equipo técnico detrás de la arquitectura y desarrollo integral de la plataforma KICK LAST.",
  },
  /* ── Agrega más aquí sin tocar nada más:
  {
    id: "s5", type: "Patrocinador",
    name: "Tu Marca", logo: "/img/tumarca.png", fb: "TM",
    desc: "Descripción breve de tu marca.",
  },
  ── */
];

/* ══════════════════════════════════════
   COMPONENTE
   ══════════════════════════════════════ */
export default function Sponsors() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);
  const totalCards = OTHER_SPONSORS.length + 1; // +1 slot

  /* Scroll horizontal por botones */
  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const card = 210; // ancho tarjeta + gap
    scrollRef.current.scrollBy({ left: dir === "right" ? card : -card, behavior: "smooth" });
  };

  /* Actualizar dot activo según scroll */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const cardW = 210;
      const idx = Math.round(el.scrollLeft / cardW);
      setActiveDot(Math.min(idx, totalCards - 1));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [totalCards]);

  /* Fallback logo helper */
  const logoFallback = (e: React.SyntheticEvent<HTMLImageElement>, fb: string) => {
    const img = e.currentTarget;
    img.style.display = "none";
    const parent = img.parentElement;
    if (parent && !parent.querySelector(".sp-sec-logo-fb")) {
      const span = document.createElement("span");
      span.className = "sp-sec-logo-fb";
      span.textContent = fb;
      parent.appendChild(span);
    }
  };

  return (
    <section className="sp-section" id="patrocinadores">

      {/* ── INTRO ── */}
      <div className="sp-intro-wrap">
        <div className="sp-intro">
          <div>
            <div className="sp-intro-eyebrow">Patrocinadores oficiales</div>
            <h2 className="sp-intro-title">
              Marcas que <em>confían</em><br />en KICK LAST
            </h2>
          </div>
          <p className="sp-intro-right">
            Empresas líderes que eligen KICK LAST para conectar con millones de
            aficionados apasionados durante el evento deportivo más grande del planeta.
          </p>
        </div>
      </div>

      {/* ── PATROCINADOR PRINCIPAL ── */}
      <div className="sp-featured">
        <div className="sp-featured-label">
          <span className="sp-featured-tag">Patrocinador principal</span>
          <div className="sp-featured-line" />
        </div>

        <div className="sp-featured-card">
          {/* Panel logo */}
          <div className="sp-feat-left">
            <div className="sp-feat-logo-stage">
              <img
                src={MAIN_SPONSOR.logo}
                alt={MAIN_SPONSOR.name}
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = "none";
                  const p = img.parentElement;
                  if (p && !p.querySelector(".sp-feat-logo-fb")) {
                    const fb = document.createElement("span");
                    fb.className = "sp-feat-logo-fb";
                    fb.style.cssText =
                      "font-family:'Oswald',sans-serif;font-size:28px;font-weight:700;color:rgba(141,198,63,0.5);letter-spacing:2px;position:relative;z-index:1";
                    fb.textContent = MAIN_SPONSOR.fb;
                    p.appendChild(fb);
                  }
                }}
              />
            </div>
            <div className="sp-feat-badge">
              <div className="sp-feat-badge-dot" />
              <span className="sp-feat-badge-txt">Verificado</span>
            </div>
            <div className="sp-feat-name">{MAIN_SPONSOR.name}</div>
          </div>

          {/* Panel contenido */}
          <div className="sp-feat-right">
            <div className="sp-feat-tagline">{MAIN_SPONSOR.tagline}</div>
            <p className="sp-feat-desc">{MAIN_SPONSOR.description}</p>

            <div className="sp-feat-metrics">
              {MAIN_SPONSOR.metrics.map((m, i) => (
                <div key={i} className="sp-feat-metric">
                  <div className="sp-feat-m-val">{m.val}</div>
                  <div className="sp-feat-m-lbl">{m.lbl}</div>
                </div>
              ))}
            </div>

            <div className="sp-feat-benefits">
              {MAIN_SPONSOR.benefits.map((b, i) => (
                <div key={i} className="sp-feat-benefit">
                  <span className="sp-feat-benefit-ico">{b.icon}</span>
                  {b.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECUNDARIOS ── */}
      <div className="sp-secondary">
        <div className="sp-secondary-label">
          <span className="sp-featured-tag">También nos apoyan</span>
          <div className="sp-featured-line" />
        </div>

        {/* Hint + botones — solo visible en móvil */}
        <div className="sp-carousel-hint">
          <span className="sp-carousel-hint-txt">
            Desliza para ver más
          </span>
          <div className="sp-carousel-arrows">
            <button className="sp-arr-btn" onClick={() => scroll("left")} aria-label="Anterior">‹</button>
            <button className="sp-arr-btn" onClick={() => scroll("right")} aria-label="Siguiente">›</button>
          </div>
        </div>

        {/* Grid / Carrusel */}
        <div className="sp-sec-scroll-wrap">
          <div className="sp-sec-grid" ref={scrollRef}>

            {OTHER_SPONSORS.map((s) => (
              <div key={s.id} className="sp-sec-card">
                <div className="sp-sec-logo-zone">
                  <img
                    src={s.logo}
                    alt={s.name}
                    onError={(e) => logoFallback(e, s.fb)}
                  />
                </div>
                <div className="sp-sec-info">
                  <div className="sp-sec-type">{s.type}</div>
                  <div className="sp-sec-name">{s.name}</div>
                  <p className="sp-sec-desc">{s.desc}</p>
                </div>
              </div>
            ))}

            {/* Slot disponible */}
            <div className="sp-slot">
              <div className="sp-slot-icon">+</div>
              <div className="sp-slot-txt">Tu marca aquí</div>
              <div className="sp-slot-sub">Slot disponible · Mundial 2026</div>
            </div>

          </div>
        </div>

        {/* Dots — solo móvil */}
        <div className="sp-dots">
          {Array.from({ length: totalCards }).map((_, i) => (
            <div
              key={i}
              className={`sp-dot ${i === activeDot ? "active" : ""}`}
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollTo({ left: i * 210, behavior: "smooth" });
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* ── CTA FINAL ── */}
      <div className="sp-cta-wrap">
        <div className="sp-cta-inner">
          <div>
            <div className="sp-cta-title">
              ¿Tu marca quiere estar en el{" "}
              <em>evento más visto</em> del mundo?
            </div>
            <p className="sp-cta-desc">
              Slots limitados para el Mundial 2026. Posiciona tu marca frente a
              millones de aficionados apasionados por el fútbol.
            </p>
          </div>
          <div className="sp-cta-btns">
            <a href="/contacto"  className="sp-btn-p">Quiero ser patrocinador</a>
          </div>
        </div>
      </div>

    </section>
  );
}