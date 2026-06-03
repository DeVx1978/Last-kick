"use client";

import React, { useState } from "react";
import Link from "next/link";
import "./Footer.css";

/* ── Logos ── */
const LOGOS = [
  { name: "Real Madrid",       file: "realmadrid1.png",  fb: "RM"   },
  { name: "Barcelona",         file: "barcelona1.png",   fb: "FCB"  },
  { name: "Man City",          file: "mancity1.png",     fb: "MCI"  },
  { name: "PSG",               file: "psg7.png",         fb: "PSG"  },
  { name: "Bayern",            file: "bayern1.png",      fb: "BAY"  },
  { name: "Liverpool",         file: "liverpool1.png",   fb: "LFC"  },
  { name: "Inter Milan",       file: "inter1.png",       fb: "INT"  },
  { name: "Atlético",          file: "atletico1.png",    fb: "ATM"  },
  { name: "Boca Juniors",      file: "boca1.png",        fb: "BOC"  },
  { name: "River Plate",       file: "river1.png",       fb: "RIV"  },
  { name: "Flamengo",          file: "flamengo1.png",    fb: "FLA"  },
  { name: "América",           file: "america1.png",     fb: "AME"  },
  { name: "FIFA World Cup",    file: "fifa1.png",        fb: "FIFA" },
  { name: "UEFA Champions",    file: "wefa1.png",        fb: "UEFA" },
  { name: "Premier League",    file: "premier1.png",     fb: "PL"   },
  { name: "La Liga",           file: "laliga1.png",      fb: "LFP"  },
  { name: "Serie A",           file: "seriea1.png",      fb: "SA"   },
  { name: "Bundesliga",        file: "bundesliga1.png",  fb: "BL"   },
  { name: "Ligue 1",           file: "ligue-1.0.png",    fb: "L1"   },
  { name: "MLS",               file: "mls1.png",         fb: "MLS"  },
];

const TRACK_ITEMS = [...LOGOS, ...LOGOS];

const SOCIALS = [
  { label: "IG", href: "https://instagram.com", aria: "Instagram" },
  { label: "TT", href: "https://tiktok.com",    aria: "TikTok"    },
  { label: "YT", href: "https://youtube.com",   aria: "YouTube"   },
  { label: "𝕏",  href: "https://x.com",         aria: "Twitter/X" },
];

const NAV_LINKS = [
  { label: "Fixture Mundial",     href: "/fixture"                },
  { label: "Trono de Privilegio", href: "/ranking", badge: "VIP"  },
  { label: "Premio Acumulado",    href: "/jackpot"                },
  { label: "Recargar Vidas",      href: "/recharge"               },
  { label: "Reglamento",          href: "/reglas"                 },
  { label: "Ayuda",               href: "/ayuda"                  },
];

const LEGAL_LINKS = [
  { label: "Términos y condiciones", href: "/terminos"           },
  { label: "Política de privacidad", href: "/privacidad"         },
  { label: "Juego responsable",      href: "/juego-responsable"  },
  { label: "Contacto",               href: "/contacto"           },
  { label: "Patrocinadores",         href: "/patrocinadores"     },
];

/* ── Subcomponente Inteligente para Logos (La Forma React) ── */
const LogoEquipo = ({ logo }: { logo: typeof LOGOS[0] }) => {
  const [error, setError] = useState(false);

  return (
    <div className="lk-logo-item" title={logo.name}>
      {!error ? (
        <img
          src={`/img/${logo.file}`}
          alt={logo.name}
          className="lk-logo-img-sm"
          onError={() => setError(true)}
        />
      ) : (
        <span className="lk-logo-fallback">{logo.fb}</span>
      )}
    </div>
  );
};

export default function Footer() {
  const [mainLogoError, setMainLogoError] = useState(false);

  return (
    <footer className="lk-footer">

      {/* ── STATEMENT — franja horizontal compacta ── */}
      <div className="lk-footer-statement">
        <div className="lk-stmt-inner">

          {/* Izquierda: identidad */}
          <div className="lk-stmt-left">
            <div className="lk-stmt-accent-line" />
            <div className="lk-stmt-text-wrap">
              <div className="lk-stmt-eyebrow">⚽ El juego dentro del juego</div>
              <div className="lk-stmt-title">
                Cada <span className="lk-accent">predicción</span> cuenta.
                Cada <span className="lk-accent">vida</span>{" "}
                <span className="lk-dim">importa.</span>
              </div>
            </div>
          </div>

          {/* Derecha: subtexto + CTA */}
          <div className="lk-stmt-right">
            <p className="lk-stmt-sub">
              No es suerte. Es intuición y pasión por el fútbol convertidos en un juego.
            </p>
            <Link href="/register" className="lk-stmt-btn">
              Predecir ahora ›
            </Link>
          </div>

        </div>
      </div>

      {/* ── FRANJA LOGOS — fondo verde oscuro ── */}
      <div className="lk-logos-section">
        <div className="lk-logos-track">
          {TRACK_ITEMS.map((logo, i) => (
            <LogoEquipo key={i} logo={logo} />
          ))}
        </div>
      </div>

      {/* ── CUERPO PRINCIPAL ── */}
      <div className="lk-footer-container">

        {/* MARCA */}
        <div className="lk-footer-brand">
          {!mainLogoError && (
            <img
              src="/img/kicklast02.png"
              alt="Kick Last"
              className="lk-brand-logo"
              onError={() => setMainLogoError(true)}
            />
          )}
          {mainLogoError && (
            <div className="lk-brand-logo-text" style={{fontFamily:"Oswald", fontSize:"28px", fontWeight:700, color:"#fff", marginBottom:"16px"}}>
              Kick <span style={{color:"#8dc63f"}}>Last</span>
            </div>
          )}
          
          <div className="lk-brand-tagline">El juego dentro del juego</div>
          <p className="lk-brand-desc">
            Sistema de predicciones futbolísticas para el Mundial 2026.
            Donde la intuición vale más que la suerte.
          </p>
          <div className="lk-live-pill">
            <div className="lk-live-dot" />
            <span className="lk-live-txt">Sistema activo · Mundial 2026</span>
          </div>
          <div className="lk-socials">
            {SOCIALS.map((s) => (
              <a 
                key={s.label} 
                href={s.href} 
                className="lk-social-btn" 
                aria-label={s.aria}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <div>
          <h4 className="lk-col-title">Navegación</h4>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="lk-footer-link">
              {l.label}
              {l.badge && <span className="lk-link-badge">{l.badge}</span>}
            </Link>
          ))}
        </div>

        {/* LEGAL */}
        <div>
          <h4 className="lk-col-title">Legal</h4>
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="lk-footer-link">
              {l.label}
            </Link>
          ))}
        </div>

        {/* NEWSLETTER */}
        <div>
          <h4 className="lk-col-title">Alertas del Decano</h4>
          <p className="lk-newsletter-desc">
            Recibe coordenadas tácticas antes de cada partido directamente en tu correo.
          </p>
          <form className="lk-newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="tu@correo.com"
              required
              autoComplete="off"
              aria-label="Correo electrónico para boletín"
            />
            <button type="submit">Unirse al equipo</button>
          </form>
          <p className="lk-newsletter-note">
            Sin spam. Solo lo importante. Date de baja cuando quieras.
          </p>
        </div>

      </div>

      <div className="lk-footer-divider" />

      {/* ── +18 ── */}
      <div className="lk-responsibility-bar">
        <div className="lk-resp-inner">
          <span className="lk-resp-badge">+18</span>
          <span className="lk-resp-text">
            Servicio exclusivo para mayores de 18 años · Juega con responsabilidad ·
            Si crees que tienes un problema con el juego, busca ayuda profesional
          </span>
        </div>
      </div>

      {/* ── COPYRIGHT ── */}
      <div className="lk-footer-bottom">
        <div className="lk-bottom-brand">
          <span className="lk-bottom-logo-txt">Kick <span>Last</span></span>
          <span className="lk-bottom-year">© 2026 · Todos los derechos reservados</span>
        </div>
        <div className="lk-bottom-links">
          <Link href="/terminos"   className="lk-bottom-link">Términos</Link>
          <div className="lk-bottom-sep" />
          <Link href="/privacidad" className="lk-bottom-link">Privacidad</Link>
          <div className="lk-bottom-sep" />
          <Link href="/contacto"   className="lk-bottom-link">Contacto</Link>
          <div className="lk-bottom-sep" />
          <span className="lk-bottom-link">Colombia · Mundial 2026</span>
        </div>
      </div>

    </footer>
  );
}